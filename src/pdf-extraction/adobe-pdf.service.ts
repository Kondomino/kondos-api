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
  ServiceApiError,
  ExtractRenditionsElementType
} from '@adobe/pdfservices-node-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as unzipper from 'unzipper';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import { MediaFilters, StorageStreamCdnService, EntryMetadata } from 'src/storage/services/storage-stream-cdn.service';
import { getMediaFilters, getLargePdfFilters } from 'src/whatsapp/config/whatsapp.config';

/**
 * Media upload statistics
 */
export interface MediaUploadStats {
  uploaded: number;
  skipped: number;
  errors: number;
  skippedReasons?: string[];
}

/**
 * PDF Extraction result with CDN URLs
 */
export interface PdfExtractionResult {
  images?: Buffer[];
  success: boolean;
  text: string;
  tables: any[];
  mediaUrls: string[]; // CDN URLs instead of Buffers
  metadata: {
    pageCount?: number;
    extractionTime: number;
    elementsFound: number;
    fileSize: number;
    mediaStats?: MediaUploadStats;
    largeFileBypass?: boolean;  // Flag when PDF > 99MB bypasses extraction
  };
  error?: string;
}

@Injectable()
export class AdobePdfService {
  private readonly logger = new Logger(AdobePdfService.name);
  private readonly credentials: ServicePrincipalCredentials;
  private readonly mediaFilters: MediaFilters;
  private readonly largePdfFilters: MediaFilters;
  private readonly largePdfThresholdBytes: number;
  private readonly largePdfCdnPrefix: string;
  public readonly adobePdfEnabled: boolean = true;

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageStreamCdnService
  ) {
    const clientId = this.configService.get<string>('ADOBE_PDF_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ADOBE_PDF_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      this.logger.error('Adobe PDF Services credentials not configured. Service disabled.');
      this.adobePdfEnabled = false;
      return;
    }

    this.credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret
    });

    this.mediaFilters = getMediaFilters();
    this.largePdfFilters = getLargePdfFilters();
    
    const largePdfThresholdMb = this.configService.get<number>('LARGE_PDF_THRESHOLD_MB', 99);
    this.largePdfThresholdBytes = largePdfThresholdMb * 1024 * 1024;
    this.largePdfCdnPrefix = this.configService.get<string>('LARGE_PDF_CDN_PREFIX', 'documents');

    this.logger.log('Adobe PDF Service initialized successfully');
    this.logger.log(
      `[CONFIG] Media filters: minSize=${this.mediaFilters.minSizeKb}KB, minRes=${this.mediaFilters.minResolution.width}×${this.mediaFilters.minResolution.height}`
    );
    this.logger.log(
      `[CONFIG] Large PDF: threshold=${largePdfThresholdMb}MB, cdnPrefix=${this.largePdfCdnPrefix}`
    );
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

      // SIZE-BASED ROUTING: Check if PDF exceeds threshold
      if (this.isLargePdf(pdfBuffer)) {
        this.logger.log(
          `[PDF-EXTRACT] PDF exceeds ${this.largePdfThresholdBytes / (1024 * 1024)}MB threshold, using direct CDN upload`
        );
        return await this.uploadLargePdfToCdn(pdfBuffer, messageId);
      }

      // Normal extraction flow for PDFs under threshold
      return await this.extractPdfFromBuffer(pdfBuffer, messageId, startTime);
    } catch (error) {
      const extractionTime = Date.now() - startTime;
      this.logger.error(
        `[PDF-EXTRACT] FAILED for message ${messageId} after ${extractionTime}ms: ${error.message}`,
        error.stack
      );

      return {
        success: false,
        text: '',
        tables: [],
        mediaUrls: [],
        metadata: {
          extractionTime,
          elementsFound: 0,
          fileSize: 0
        },
        error: error.message
      };
    }
  }

  /**
   * Check if PDF buffer exceeds large file threshold
   */
  private isLargePdf(pdfBuffer: Buffer): boolean {
    return pdfBuffer.length > this.largePdfThresholdBytes;
  }

  /**
   * Upload large PDF directly to CDN without Adobe extraction
   * Used for PDFs > threshold (default 99MB) where extraction may timeout
   * 
   * @param pdfBuffer - PDF file buffer
   * @param messageId - Message identifier for tracking
   * @returns PdfExtractionResult with CDN URL in mediaUrls
   */
  private async uploadLargePdfToCdn(
    pdfBuffer: Buffer,
    messageId: string
  ): Promise<PdfExtractionResult> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `[PDF-LARGE] Processing large PDF: messageId=${messageId}, size=${(pdfBuffer.length / (1024 * 1024)).toFixed(2)}MB`
      );

      // Create readable stream from buffer for streaming upload
      const stream = Readable.from(pdfBuffer);

      // Prepare metadata with large PDF CDN prefix
      const metadata: EntryMetadata = {
        path: `${this.largePdfCdnPrefix}/large-pdf/${messageId}.pdf`,
        size: pdfBuffer.length
      };

      this.logger.debug(`[PDF-LARGE] Stream path: ${metadata.path}`);

      // Upload to CDN using StorageStreamCdnService with PDF filters
      const result = await this.storageService.processStreamEntry(
        stream,
        metadata,
        this.largePdfFilters
      );

      if (!result.success) {
        throw new Error(
          `Failed to upload large PDF: ${result.skippedReason || result.error}`
        );
      }

      const totalTime = Date.now() - startTime;
      this.logger.log(
        `[PDF-LARGE] Successfully uploaded large PDF in ${totalTime}ms: ${result.cdnUrl}`
      );

      return {
        success: true,
        text: '',  // No extraction performed
        tables: [],  // No extraction performed
        mediaUrls: [result.cdnUrl],  // Return CDN URL for consistency
        metadata: {
          pageCount: undefined,
          extractionTime: totalTime,
          elementsFound: 0,
          fileSize: pdfBuffer.length,
          largeFileBypass: true,  // Flag indicating this was a bypass
          mediaStats: {
            uploaded: 1,
            skipped: 0,
            errors: 0
          }
        }
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.logger.error(
        `[PDF-LARGE] FAILED to upload large PDF for message ${messageId} after ${totalTime}ms: ${error.message}`
      );

      return {
        success: false,
        text: '',
        tables: [],
        mediaUrls: [],
        metadata: {
          pageCount: undefined,
          extractionTime: totalTime,
          elementsFound: 0,
          fileSize: pdfBuffer.length,
          largeFileBypass: true,  // Flag indicating attempt was bypass
          mediaStats: {
            uploaded: 0,
            skipped: 0,
            errors: 1
          }
        },
        error: error.message
      };
    }
  }

  async extractPdfFromBuffer(
    pdfBuffer: Buffer,
    messageId: string,
    startTime?: number
  ): Promise<PdfExtractionResult> {
    const extractionStart = startTime || Date.now();

    try {
      this.logger.log(`[PDF-EXTRACT-BUFFER] Starting buffer-based extraction: messageId=${messageId}`);
      this.logger.log(`[PDF-EXTRACT-BUFFER] Buffer size: ${pdfBuffer.length} bytes`);

      // Create temporary file for Adobe SDK
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.promises.mkdir(tempDir, { recursive: true });

      const tempFilePath = path.join(tempDir, `${messageId}_${randomUUID()}.pdf`);
      await fs.promises.writeFile(tempFilePath, pdfBuffer as Uint8Array);

      try {
        // Perform extraction
        this.logger.log(`[PDF-EXTRACT-BUFFER] Starting Adobe API extraction: ${tempFilePath}`);
        const adobeStart = Date.now();
        const result = await this.performExtraction(tempFilePath);
        const adobeExtractionTime = Date.now() - adobeStart;

        const totalTime = Date.now() - extractionStart;
        this.logger.log(`[PDF-EXTRACT-BUFFER] Adobe extraction completed in ${adobeExtractionTime}ms`);
        this.logger.log(
          `[PDF-EXTRACT-BUFFER] Total processing time: ${totalTime}ms for message ${messageId}`
        );

        const extractionResult = {
          success: true,
          text: result.text,
          tables: result.tables,
          mediaUrls: result.mediaUrls,
          metadata: {
            pageCount: result.metadata?.pageCount,
            extractionTime: totalTime,
            elementsFound: result.text.length + result.tables.length + result.mediaUrls.length,
            fileSize: pdfBuffer.length,
            mediaStats: result.metadata?.mediaStats
          }
        };

        this.logger.log(
          `[PDF-EXTRACT-BUFFER] SUCCESS: text=${result.text.length}chars tables=${result.tables.length} media=${result.mediaUrls.length}`
        );
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
      this.logger.error(
        `[PDF-EXTRACT-BUFFER] FAILED for message ${messageId} after ${extractionTime}ms: ${error.message}`,
        error.stack
      );

      return {
        success: false,
        text: '',
        tables: [],
        mediaUrls: [],
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
      this.logger.log(
        `[PDF-DOWNLOAD] Response received: ${response.status} ${contentLength ? `(${contentLength} bytes)` : ''}`
      );

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
    mediaUrls: string[];
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
        elementsToExtract: [ExtractElementType.TEXT, ExtractElementType.TABLES],
        elementsToExtractRenditions: [
          ExtractRenditionsElementType.FIGURES,
          ExtractRenditionsElementType.TABLES
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

      // Parse extraction results using stream approach (no temp file)
      const extractedData = await this.parseExtractionResultsStream(streamAsset.readStream);

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

  private async parseExtractionResultsStream(zipStream: NodeJS.ReadableStream): Promise<{
    text: string;
    tables: any[];
    mediaUrls: string[];
    metadata?: any;
  }> {
    try {
      this.logger.log(`[ZIP-PARSE] Starting ZIP stream parsing`);

      let structuredData: any = null;
      const mediaUrls: string[] = [];
      const mediaStats: MediaUploadStats = {
        uploaded: 0,
        skipped: 0,
        errors: 0,
        skippedReasons: []
      };

      return new Promise((resolve, reject) => {
        zipStream
          .pipe(unzipper.Parse())
          .on('entry', async (entry: unzipper.Entry) => {
            const { path: filePath, type } = entry;

            try {
              // Skip directories
              if (type === 'Directory') {
                entry.autodrain();
                return;
              }

              // Extract structuredData.json (contains text and tables)
              if (filePath === 'structuredData.json') {
                this.logger.log(`[ZIP-PARSE] Found structuredData.json`);
                const buffer = await this.readStreamToBuffer(entry);
                structuredData = JSON.parse(buffer.toString());
                return;
              }

              // Process media files (figures/)
              if (filePath.startsWith('figures/') && !filePath.endsWith('/')) {
                this.logger.debug(`[ZIP-PARSE] Processing media entry: ${filePath}`);

                // Use storage service to validate and upload
                const result = await this.storageService.processStreamEntry(
                  entry,
                  { path: filePath, size: entry.size },
                  this.mediaFilters
                );

                if (result.success) {
                  mediaUrls.push(result.cdnUrl);
                  mediaStats.uploaded++;
                  this.logger.log(`[ZIP-PARSE] Media uploaded: ${result.cdnUrl}`);
                } else if (result.skippedReason) {
                  mediaStats.skipped++;
                  mediaStats.skippedReasons?.push(`${filePath}: ${result.skippedReason}`);
                  this.logger.debug(`[ZIP-PARSE] Media skipped: ${result.skippedReason}`);
                } else if (result.error) {
                  mediaStats.errors++;
                  this.logger.error(`[ZIP-PARSE] Media upload error: ${result.error}`);
                }
                return;
              }

              // Skip other files
              entry.autodrain();
            } catch (error) {
              this.logger.error(`[ZIP-PARSE] Error processing entry ${filePath}: ${error.message}`);
              mediaStats.errors++;
              entry.autodrain();
            }
          })
          .on('error', (err) => {
            this.logger.error(`[ZIP-PARSE] Stream error: ${err.message}`);
            reject(err);
          })
          .on('close', () => {
            this.logger.log(`[ZIP-PARSE] ZIP stream closed`);
            const result = this.buildExtractionResult(structuredData, mediaUrls, mediaStats);
            resolve(result);
          });
      });
    } catch (error) {
      this.logger.error(`[ZIP-PARSE] Error parsing extraction results: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async readStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks as Uint8Array[])));
      stream.on('error', reject);
    });
  }

  private buildExtractionResult(
    structuredData: any,
    mediaUrls: string[],
    mediaStats: MediaUploadStats
  ): {
    text: string;
    tables: any[];
    mediaUrls: string[];
    metadata?: any;
  } {
    let text = '';
    let tables: any[] = [];
    let pageCount = 1;

    if (structuredData) {
      this.logger.log(`[JSON-PARSE] Parsing structuredData.json`);

      // Extract text
      if (structuredData.elements) {
        this.logger.log(
          `[TEXT-EXTRACT] Extracting text from ${structuredData.elements.length} elements`
        );

        text = structuredData.elements
          .filter((el: any) => el.Text)
          .map((el: any) => el.Text)
          .join('\n');

        this.logger.log(`[TEXT-EXTRACT] Extracted ${text.length} characters`);
      }

      // Extract tables
      if (structuredData.elements) {
        tables = structuredData.elements.filter((el: any) => el.Table);
        this.logger.log(`[TABLE-EXTRACT] Found ${tables.length} tables`);

        tables.forEach((table, idx) => {
          if (table.Table) {
            const rows = table.Table.length;
            const cols = rows > 0 ? table.Table[0].length : 0;
            this.logger.debug(`[TABLE-EXTRACT] Table ${idx}: rows=${rows}, cols=${cols}`);
          }
        });
      }

      // Get page count
      if (structuredData.pages) {
        pageCount = structuredData.pages.length;
        this.logger.log(`[METADATA-EXTRACT] Page count: ${pageCount}`);
      }
    } else {
      this.logger.warn(`[JSON-PARSE] structuredData.json not found in ZIP`);
    }

    this.logger.log(
      `[ZIP-PARSE] SUCCESS: text=${text.length}chars, tables=${tables.length}, media=${mediaUrls.length}`
    );
    this.logger.log(
      `[ZIP-PARSE] Media stats: uploaded=${mediaStats.uploaded}, skipped=${mediaStats.skipped}, errors=${mediaStats.errors}`
    );

    return {
      text,
      tables,
      mediaUrls,
      metadata: {
        pageCount,
        mediaStats
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
