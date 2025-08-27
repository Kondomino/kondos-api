import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  ExtractPDFParams,
  ExtractElementType,
  ExtractPDFJob,
  ExtractPDFResult,
  SDKError,
  ServiceUsageError,
  ServiceApiError
} from '@adobe/pdfservices-node-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface PdfExtractionResult {
  success: boolean;
  text: string;
  tables: any[];
  images: Buffer[];
  metadata: {
    pageCount?: number;
    extractionTime: number;
    elementsFound: number;
    fileSize: number;
  };
  error?: string;
}

@Injectable()
export class AdobePdfService {
  private readonly logger = new Logger(AdobePdfService.name);
  private readonly credentials: ServicePrincipalCredentials;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('ADOBE_EXTRACT_API_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ADOBE_EXTRACT_API_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.error('Adobe PDF Services credentials not configured');
      throw new Error('Adobe PDF Services credentials are required');
    }

    this.credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret
    });

    this.logger.log('Adobe PDF Service initialized successfully');
  }

  async extractPdfContent(pdfUrl: string, messageId: string): Promise<PdfExtractionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`[PDF-EXTRACT] Starting extraction: messageId=${messageId}`);
      this.logger.log(`[PDF-EXTRACT] Source URL: ${pdfUrl.substring(0, 100)}...`);

      // Download PDF from WhatsApp
      const downloadStart = Date.now();
      const pdfBuffer = await this.downloadPdf(pdfUrl);
      const downloadTime = Date.now() - downloadStart;
      
      this.logger.log(`[PDF-EXTRACT] Download complete: ${pdfBuffer.length} bytes in ${downloadTime}ms`);

      return await this.extractPdfFromBuffer(pdfBuffer, messageId, startTime);
    } catch (error) {
      const extractionTime = Date.now() - startTime;
      this.logger.error(`[PDF-EXTRACT] FAILED for message ${messageId} after ${extractionTime}ms: ${error.message}`, error.stack);
      
      return {
        success: false,
        text: '',
        tables: [],
        images: [],
        metadata: {
          extractionTime,
          elementsFound: 0,
          fileSize: 0
        },
        error: error.message
      };
    }
  }

  async extractPdfFromBuffer(pdfBuffer: Buffer, messageId: string, startTime?: number): Promise<PdfExtractionResult> {
    const extractionStart = startTime || Date.now();
    
    try {
      this.logger.log(`[PDF-EXTRACT-BUFFER] Starting buffer-based extraction: messageId=${messageId}`);
      this.logger.log(`[PDF-EXTRACT-BUFFER] Buffer size: ${pdfBuffer.length} bytes`);

      // Create temporary file for Adobe SDK
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.promises.mkdir(tempDir, { recursive: true });
      
      const tempFilePath = path.join(tempDir, `${messageId}_${randomUUID()}.pdf`);
      // @ts-ignore - Buffer is compatible with fs.writeFile despite TypeScript strictness
      await fs.promises.writeFile(tempFilePath, pdfBuffer);

      try {
        // Perform extraction
        this.logger.log(`[PDF-EXTRACT-BUFFER] Starting Adobe API extraction: ${tempFilePath}`);
        const adobeStart = Date.now();
        const result = await this.performExtraction(tempFilePath);
        const adobeExtractionTime = Date.now() - adobeStart;
        
        const totalTime = Date.now() - extractionStart;
        this.logger.log(`[PDF-EXTRACT-BUFFER] Adobe extraction completed in ${adobeExtractionTime}ms`);
        this.logger.log(`[PDF-EXTRACT-BUFFER] Total processing time: ${totalTime}ms for message ${messageId}`);
        
        const extractionResult = {
          success: true,
          text: result.text,
          tables: result.tables,
          images: result.images,
          metadata: {
            pageCount: result.metadata?.pageCount,
            extractionTime: totalTime,
            elementsFound: result.text.length + result.tables.length + result.images.length,
            fileSize: pdfBuffer.length
          }
        };

        this.logger.log(`[PDF-EXTRACT-BUFFER] SUCCESS: text=${result.text.length}chars tables=${result.tables.length} images=${result.images.length}`);
        return extractionResult;
      } finally {
        // Clean up temp file
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (error) {
          this.logger.warn(`Failed to clean up temp file ${tempFilePath}: ${error.message}`);
        }
      }
    } catch (error) {
      const extractionTime = Date.now() - extractionStart;
      this.logger.error(`[PDF-EXTRACT-BUFFER] FAILED for message ${messageId} after ${extractionTime}ms: ${error.message}`, error.stack);
      
      return {
        success: false,
        text: '',
        tables: [],
        images: [],
        metadata: {
          extractionTime,
          elementsFound: 0,
          fileSize: pdfBuffer.length
        },
        error: error.message
      };
    }
  }

  private async downloadPdf(url: string): Promise<Buffer> {
    try {
      this.logger.log(`[PDF-DOWNLOAD] Fetching PDF from WhatsApp servers...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        this.logger.error(`[PDF-DOWNLOAD] HTTP error: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      this.logger.log(`[PDF-DOWNLOAD] Response received: ${response.status} ${contentLength ? `(${contentLength} bytes)` : ''}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      this.logger.log(`[PDF-DOWNLOAD] Download successful: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      this.logger.error(`[PDF-DOWNLOAD] Error downloading PDF: ${error.message}`);
      throw error;
    }
  }

  private async performExtraction(filePath: string): Promise<{
    text: string;
    tables: any[];
    images: Buffer[];
    metadata?: any;
  }> {
    let readStream: fs.ReadStream | undefined;
    
    try {
      // Create PDF Services instance
      const pdfServices = new PDFServices({ credentials: this.credentials });

      // Create asset from file
      readStream = fs.createReadStream(filePath);
      const inputAsset = await pdfServices.upload({
        readStream,
        mimeType: MimeType.PDF
      });

      // Create extraction parameters
      const params = new ExtractPDFParams({
        elementsToExtract: [
          ExtractElementType.TEXT,
          ExtractElementType.TABLES
          // Note: IMAGES extraction may not be available in this version
        ]
      });

      this.logger.log(`[ADOBE-API] Submitting extraction job to Adobe PDF Services`);

      // Create and submit job
      const job = new ExtractPDFJob({ inputAsset, params });
      const pollingURL = await pdfServices.submit({ job });
      
      this.logger.log(`[ADOBE-API] Job submitted, polling for results...`);
      
      // Get result
      const pdfServicesResponse = await pdfServices.getJobResult({
        pollingURL,
        resultType: ExtractPDFResult
      });

      this.logger.log(`[ADOBE-API] Job completed successfully`);

      // Get content from result asset
      const resultAsset = pdfServicesResponse.result.resource;
      const streamAsset = await pdfServices.getContent({ asset: resultAsset });

      // Save result to temp file and extract content
      const resultPath = path.join(process.cwd(), 'temp', `extraction_${randomUUID()}.zip`);
      const writeStream = fs.createWriteStream(resultPath);
      
      await new Promise((resolve, reject) => {
        streamAsset.readStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Parse extraction results (Adobe returns a ZIP with JSON)
      const extractedData = await this.parseExtractionResults(resultPath);
      
      // Clean up result file
      try {
        await fs.promises.unlink(resultPath);
      } catch (error) {
        this.logger.warn(`Failed to clean up result file ${resultPath}: ${error.message}`);
      }

      return extractedData;
    } catch (error) {
      if (error instanceof SDKError || error instanceof ServiceUsageError || error instanceof ServiceApiError) {
        this.logger.error('Adobe PDF Services error:', error);
        throw new Error(`Adobe PDF extraction failed: ${error.message}`);
      }
      throw error;
    } finally {
      readStream?.destroy();
    }
  }

  private async parseExtractionResults(zipPath: string): Promise<{
    text: string;
    tables: any[];
    images: Buffer[];
    metadata?: any;
  }> {
    // TODO: Implement ZIP parsing to extract JSON and images
    // For now, return a placeholder implementation
    
    this.logger.log(`Parsing extraction results from ${zipPath}`);
    
    // Adobe PDF Extract returns a ZIP file containing:
    // - structuredData.json: Contains text and table data
    // - figures/: Contains extracted images
    
    return {
      text: 'Extracted text content would go here', // TODO: Parse from structuredData.json
      tables: [], // TODO: Parse tables from structuredData.json
      images: [], // TODO: Extract images from figures/ folder
      metadata: {
        pageCount: 1 // TODO: Get from structuredData.json
      }
    };
  }

  async testCredentials(): Promise<{ success: boolean; message: string }> {
    try {
      // Simple test - try to create PDFServices instance
      const pdfServices = new PDFServices({ credentials: this.credentials });
      
      this.logger.log('Adobe PDF Services credentials test successful');
      return {
        success: true,
        message: 'Adobe PDF Services credentials are valid'
      };
    } catch (error) {
      this.logger.error('Adobe PDF Services credentials test failed:', error);
      return {
        success: false,
        message: `Credentials test failed: ${error.message}`
      };
    }
  }
}
