import { Injectable, Logger } from '@nestjs/common';
import { AdobePdfService, PdfExtractionResult } from './adobe-pdf.service';
import { MediaUploadService, UploadResult } from './media-upload.service';

export interface MediaData {
  mediaId?: string;
  mediaUrl?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  sha256?: string;
}

export interface ProcessedMedia {
  success: boolean;
  originalMediaData: MediaData;
  originalBuffer?: Buffer; // Raw original file data for cloud upload
  extractedText?: string;
  extractedTables?: any[];
  extractedImages?: string[]; // URLs to extracted images (local)
  extractedImageBuffers?: Buffer[]; // Raw image data for cloud upload
  uploadUrl?: string; // URL to uploaded original file
  metadata: {
    processingTime: number;
    fileSize: number;
    extractionType: 'pdf' | 'image' | 'video' | 'generic';
    extractionDetails?: any;
  };
  error?: string;
}

@Injectable()
export class MediaProcessingService {
  private readonly logger = new Logger(MediaProcessingService.name);

  constructor(
    private readonly adobePdfService: AdobePdfService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  async processMedia(mediaData: MediaData, messageId: string): Promise<ProcessedMedia> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`[MEDIA-PROCESS] Starting processing: messageId=${messageId}`);
      this.logger.log(`[MEDIA-PROCESS] Media details: type=${mediaData.mimeType} size=${mediaData.size} filename=${mediaData.filename}`);

      if (!mediaData.mediaUrl) {
        this.logger.error(`[MEDIA-PROCESS] Missing media URL for message ${messageId}`);
        throw new Error('Media URL is required for processing');
      }

      // Single download for all operations
      this.logger.log(`[MEDIA-PROCESS] Downloading original media from: ${mediaData.mediaUrl?.substring(0, 100)}...`);
      const downloadStart = Date.now();
      const mediaBuffer = await this.downloadMedia(mediaData.mediaUrl);
      const downloadTime = Date.now() - downloadStart;
      
      this.logger.log(`[MEDIA-PROCESS] Download complete: ${mediaBuffer.length} bytes in ${downloadTime}ms`);
      
      // Parallel processing: upload + content extraction
      this.logger.log(`[MEDIA-PROCESS] Starting parallel processing: upload + content extraction`);
      const parallelStart = Date.now();
      
      const [uploadResult, contentResult] = await Promise.all([
        // Upload to local storage
        this.uploadToLocalStorage(mediaBuffer, mediaData, messageId),
        // Process content from buffer
        this.processContentFromBuffer(mediaBuffer, mediaData, messageId)
      ]);
      
      const parallelTime = Date.now() - parallelStart;
      this.logger.log(`[MEDIA-PROCESS] Parallel processing complete in ${parallelTime}ms`);
      
      // Combine results
      let processedResult: ProcessedMedia;
      if (contentResult.success) {
        processedResult = {
          ...contentResult,
          originalBuffer: mediaBuffer, // Pass buffer for cloud upload
          uploadUrl: uploadResult.url,
        };
      } else {
        // Fallback for failed content processing
        processedResult = {
          success: true,
          originalMediaData: mediaData,
          originalBuffer: mediaBuffer,
          extractedText: this.getFallbackContentText(mediaData.mimeType || 'generic', mediaData.filename),
          uploadUrl: uploadResult.url,
          metadata: {
            processingTime: 0,
            fileSize: mediaBuffer.length,
            extractionType: this.getExtractionType(mediaData.mimeType || 'generic'),
            extractionDetails: { fallback: true, reason: contentResult.error }
          }
        };
      }

      const processingTime = Date.now() - startTime;
      processedResult.metadata.processingTime = processingTime;

      this.logger.log(`[MEDIA-PROCESS] Processing complete for message ${messageId} in ${processingTime}ms`);
      this.logger.log(`[MEDIA-PROCESS] Result: success=${processedResult.success} extractedText=${processedResult.extractedText?.length || 0}chars`);
      
      return processedResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`[MEDIA-PROCESS] FAILED for message ${messageId} after ${processingTime}ms: ${error.message}`, error.stack);

      return {
        success: false,
        originalMediaData: mediaData,
        metadata: {
          processingTime,
          fileSize: mediaData.size || 0,
          extractionType: 'generic',
        },
        error: error.message
      };
    }
  }

  private async uploadToLocalStorage(
    mediaBuffer: Buffer,
    mediaData: MediaData,
    messageId: string
  ): Promise<UploadResult> {
    this.logger.log(`[MEDIA-PROCESS] Uploading to local storage...`);
    const uploadStart = Date.now();
    
    const uploadResult = await this.mediaUploadService.uploadMedia(
      mediaBuffer,
      mediaData.filename || `media_${messageId}`,
      mediaData.mimeType || 'application/octet-stream'
    );
    
    const uploadTime = Date.now() - uploadStart;
    
    if (uploadResult.success) {
      this.logger.log(`[MEDIA-PROCESS] Local upload successful in ${uploadTime}ms: ${uploadResult.url}`);
    } else {
      this.logger.warn(`[MEDIA-PROCESS] Local upload failed in ${uploadTime}ms: ${uploadResult.error}`);
    }
    
    return uploadResult;
  }

  private async processContentFromBuffer(
    mediaBuffer: Buffer,
    mediaData: MediaData,
    messageId: string
  ): Promise<ProcessedMedia> {
    this.logger.log(`[MEDIA-PROCESS] Processing content from buffer: type=${mediaData.mimeType}`);
    
    try {
      switch (mediaData.mimeType) {
        case 'application/pdf':
          return await this.processPDFFromBuffer(mediaBuffer, mediaData, messageId);
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
          return await this.processImageFromBuffer(mediaBuffer, mediaData, messageId);
        case 'video/mp4':
        case 'video/quicktime':
        case 'video/avi':
          return await this.processVideoFromBuffer(mediaBuffer, mediaData, messageId);
        default:
          return await this.processGenericFileFromBuffer(mediaBuffer, mediaData, messageId);
      }
    } catch (error) {
      this.logger.error(`[MEDIA-PROCESS] Content processing failed: ${error.message}`);
      return {
        success: false,
        originalMediaData: mediaData,
        metadata: {
          processingTime: 0,
          fileSize: mediaBuffer.length,
          extractionType: 'generic',
        },
        error: error.message
      };
    }
  }

  private async processPDFFromBuffer(
    mediaBuffer: Buffer,
    mediaData: MediaData,
    messageId: string
  ): Promise<ProcessedMedia> {
    const pdfStart = Date.now();
    
    try {
      this.logger.log(`[PDF-PROCESS-BUFFER] Starting PDF processing from buffer for message ${messageId}`);

      // Extract content using Adobe PDF Service (buffer-based)
      const extractionResult: PdfExtractionResult = await this.adobePdfService.extractPdfFromBuffer(
        mediaBuffer,
        messageId
      );

      const pdfProcessTime = Date.now() - pdfStart;

      if (!extractionResult.success) {
        this.logger.error(`[PDF-PROCESS-BUFFER] Adobe extraction failed for message ${messageId}: ${extractionResult.error}`);
        throw new Error(extractionResult.error || 'PDF extraction failed');
      }

      this.logger.log(`[PDF-PROCESS-BUFFER] Adobe extraction successful in ${pdfProcessTime}ms: text=${extractionResult.text.length}chars tables=${extractionResult.tables.length} images=${extractionResult.images.length}`);

      // Upload extracted images if any (keep local upload for backward compatibility)
      let extractedImageUrls: string[] = [];
      if (extractionResult.images.length > 0) {
        this.logger.log(`[PDF-PROCESS-BUFFER] Uploading ${extractionResult.images.length} extracted images to local storage...`);
        const imageUploadPromises = extractionResult.images.map((imageBuffer, index) =>
          this.mediaUploadService.uploadMedia(
            imageBuffer,
            `${messageId}_extracted_image_${index}.jpg`,
            'image/jpeg'
          )
        );

        const imageUploadResults = await Promise.all(imageUploadPromises);
        extractedImageUrls = imageUploadResults
          .filter(result => result.success && result.url)
          .map(result => result.url!);
          
        this.logger.log(`[PDF-PROCESS-BUFFER] Image uploads complete: ${extractedImageUrls.length}/${extractionResult.images.length} successful`);
      }

      // Format extracted text for better readability
      const formattedText = this.formatExtractedText(extractionResult.text, extractionResult.tables);
      
      this.logger.log(`[PDF-PROCESS-BUFFER] Text formatting complete: ${formattedText.length} chars total`);

      return {
        success: true,
        originalMediaData: mediaData,
        extractedText: formattedText,
        extractedTables: extractionResult.tables,
        extractedImages: extractedImageUrls,
        extractedImageBuffers: extractionResult.images, // Store raw buffers for cloud upload
        metadata: {
          processingTime: 0, // Will be set by caller
          fileSize: extractionResult.metadata.fileSize,
          extractionType: 'pdf',
          extractionDetails: {
            pageCount: extractionResult.metadata.pageCount,
            elementsFound: extractionResult.metadata.elementsFound,
            tablesCount: extractionResult.tables.length,
            imagesCount: extractionResult.images.length
          }
        }
      };
    } catch (error) {
      const pdfProcessTime = Date.now() - pdfStart;
      this.logger.error(`[PDF-PROCESS-BUFFER] FAILED for message ${messageId} after ${pdfProcessTime}ms: ${error.message}`);
      throw error;
    }
  }

  private async processPDF(
    mediaData: MediaData, 
    messageId: string, 
    uploadResult: UploadResult
  ): Promise<ProcessedMedia> {
    const pdfStart = Date.now();
    
    try {
      this.logger.log(`[PDF-PROCESS] Starting PDF processing for message ${messageId}`);

      // Extract content using Adobe PDF Service
      const extractionResult: PdfExtractionResult = await this.adobePdfService.extractPdfContent(
        mediaData.mediaUrl!,
        messageId
      );

      const pdfProcessTime = Date.now() - pdfStart;

      if (!extractionResult.success) {
        this.logger.error(`[PDF-PROCESS] Adobe extraction failed for message ${messageId}: ${extractionResult.error}`);
        throw new Error(extractionResult.error || 'PDF extraction failed');
      }

      this.logger.log(`[PDF-PROCESS] Adobe extraction successful in ${pdfProcessTime}ms: text=${extractionResult.text.length}chars tables=${extractionResult.tables.length} images=${extractionResult.images.length}`);

      // Upload extracted images if any
      let extractedImageUrls: string[] = [];
      if (extractionResult.images.length > 0) {
        this.logger.log(`[PDF-PROCESS] Uploading ${extractionResult.images.length} extracted images...`);
        const imageUploadPromises = extractionResult.images.map((imageBuffer, index) =>
          this.mediaUploadService.uploadMedia(
            imageBuffer,
            `${messageId}_extracted_image_${index}.jpg`,
            'image/jpeg'
          )
        );

        const imageUploadResults = await Promise.all(imageUploadPromises);
        extractedImageUrls = imageUploadResults
          .filter(result => result.success && result.url)
          .map(result => result.url!);
          
        this.logger.log(`[PDF-PROCESS] Image uploads complete: ${extractedImageUrls.length}/${extractionResult.images.length} successful`);
      }

      // Format extracted text for better readability
      const formattedText = this.formatExtractedText(extractionResult.text, extractionResult.tables);
      
      this.logger.log(`[PDF-PROCESS] Text formatting complete: ${formattedText.length} chars total`);

      return {
        success: true,
        originalMediaData: mediaData,
        extractedText: formattedText,
        extractedTables: extractionResult.tables,
        extractedImages: extractedImageUrls,
        extractedImageBuffers: extractionResult.images, // Store raw buffers for cloud upload
        uploadUrl: uploadResult.url,
        metadata: {
          processingTime: 0, // Will be set by caller
          fileSize: extractionResult.metadata.fileSize,
          extractionType: 'pdf',
          extractionDetails: {
            pageCount: extractionResult.metadata.pageCount,
            elementsFound: extractionResult.metadata.elementsFound,
            tablesCount: extractionResult.tables.length,
            imagesCount: extractionResult.images.length
          }
        }
      };
    } catch (error) {
      const pdfProcessTime = Date.now() - pdfStart;
      this.logger.error(`[PDF-PROCESS] FAILED for message ${messageId} after ${pdfProcessTime}ms: ${error.message}`);
      throw error;
    }
  }

  private async processImage(
    mediaData: MediaData, 
    messageId: string, 
    uploadResult: UploadResult
  ): Promise<ProcessedMedia> {
    this.logger.log(`Processing image for message ${messageId} (placeholder)`);

    // TODO: Implement image processing
    // - OCR for text extraction
    // - Object detection for property images
    // - Image classification (floor plans, photos, etc.)

    return {
      success: true,
      originalMediaData: mediaData,
      extractedText: '[Image received - content analysis not yet implemented]',
      uploadUrl: uploadResult.url,
      metadata: {
        processingTime: 0,
        fileSize: mediaData.size || 0,
        extractionType: 'image',
        extractionDetails: {
          placeholder: true,
          message: 'Image processing will be implemented in the future'
        }
      }
    };
  }

  private async processImageFromBuffer(
    mediaBuffer: Buffer,
    mediaData: MediaData,
    messageId: string
  ): Promise<ProcessedMedia> {
    this.logger.log(`[IMAGE-PROCESS-BUFFER] Processing image from buffer for message ${messageId} (placeholder)`);

    // TODO: Implement image processing from buffer
    // - OCR for text extraction
    // - Object detection for property images
    // - Image classification (floor plans, photos, etc.)

    return {
      success: true,
      originalMediaData: mediaData,
      extractedText: '[Image received - content analysis not yet implemented]',
      metadata: {
        processingTime: 0,
        fileSize: mediaBuffer.length,
        extractionType: 'image',
        extractionDetails: {
          placeholder: true,
          message: 'Image processing will be implemented in the future'
        }
      }
    };
  }

  private async processVideoFromBuffer(
    mediaBuffer: Buffer,
    mediaData: MediaData,
    messageId: string
  ): Promise<ProcessedMedia> {
    this.logger.log(`[VIDEO-PROCESS-BUFFER] Processing video from buffer for message ${messageId} (placeholder)`);

    // TODO: Implement video processing from buffer
    // - Audio transcription
    // - Frame extraction
    // - Property tour analysis

    return {
      success: true,
      originalMediaData: mediaData,
      extractedText: '[Video received - content analysis not yet implemented]',
      metadata: {
        processingTime: 0,
        fileSize: mediaBuffer.length,
        extractionType: 'video',
        extractionDetails: {
          placeholder: true,
          message: 'Video processing will be implemented in the future'
        }
      }
    };
  }

  private async processGenericFileFromBuffer(
    mediaBuffer: Buffer,
    mediaData: MediaData,
    messageId: string
  ): Promise<ProcessedMedia> {
    this.logger.log(`[GENERIC-PROCESS-BUFFER] Processing generic file from buffer for message ${messageId}`);

    return {
      success: true,
      originalMediaData: mediaData,
      extractedText: `[File received: ${mediaData.filename || 'unknown'} (${mediaData.mimeType || 'unknown type'})]`,
      metadata: {
        processingTime: 0,
        fileSize: mediaBuffer.length,
        extractionType: 'generic',
        extractionDetails: {
          filename: mediaData.filename,
          mimeType: mediaData.mimeType
        }
      }
    };
  }

  private getFallbackContentText(mimeType: string, filename?: string): string {
    const name = filename || 'arquivo';
    
    if (mimeType.startsWith('image/')) return `[Imagem recebida: ${name}]`;
    if (mimeType.startsWith('video/')) return `[Vídeo recebido: ${name}]`;
    if (mimeType === 'application/pdf') return `[Documento PDF recebido: ${name}]`;
    return `[Arquivo recebido: ${name}]`;
  }

  private getExtractionType(mimeType: string): 'pdf' | 'image' | 'video' | 'generic' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'generic';
  }

  private async processVideo(
    mediaData: MediaData, 
    messageId: string, 
    uploadResult: UploadResult
  ): Promise<ProcessedMedia> {
    this.logger.log(`Processing video for message ${messageId} (placeholder)`);

    // TODO: Implement video processing
    // - Audio transcription
    // - Frame extraction
    // - Property tour analysis

    return {
      success: true,
      originalMediaData: mediaData,
      extractedText: '[Video received - content analysis not yet implemented]',
      uploadUrl: uploadResult.url,
      metadata: {
        processingTime: 0,
        fileSize: mediaData.size || 0,
        extractionType: 'video',
        extractionDetails: {
          placeholder: true,
          message: 'Video processing will be implemented in the future'
        }
      }
    };
  }

  private async processGenericFile(
    mediaData: MediaData, 
    messageId: string, 
    uploadResult: UploadResult
  ): Promise<ProcessedMedia> {
    this.logger.log(`Processing generic file for message ${messageId}`);

    return {
      success: true,
      originalMediaData: mediaData,
      extractedText: `[File received: ${mediaData.filename || 'unknown'} (${mediaData.mimeType || 'unknown type'})]`,
      uploadUrl: uploadResult.url,
      metadata: {
        processingTime: 0,
        fileSize: mediaData.size || 0,
        extractionType: 'generic',
        extractionDetails: {
          filename: mediaData.filename,
          mimeType: mediaData.mimeType
        }
      }
    };
  }

  private async downloadMedia(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error(`Error downloading media from ${url}: ${error.message}`);
      throw error;
    }
  }

  private formatExtractedText(text: string, tables: any[]): string {
    let formattedText = text;

    // Add table information to the text
    if (tables.length > 0) {
      formattedText += '\n\n--- TABELAS ENCONTRADAS ---\n';
      tables.forEach((table, index) => {
        formattedText += `\nTabela ${index + 1}:\n`;
        // TODO: Format table data properly
        formattedText += JSON.stringify(table, null, 2);
      });
    }

    // Clean up and format the text
    formattedText = formattedText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s+/g, '\n') // Remove leading spaces from new lines
      .trim();

    return formattedText;
  }

  // Utility method for testing
  async testServices(): Promise<{
    adobePdf: { success: boolean; message: string };
    mediaUpload: { success: boolean; message: string };
  }> {
    const adobeTest = await this.adobePdfService.testCredentials();
    
    // Test media upload with a small buffer
    const testBuffer = Buffer.from('test file content', 'utf-8');
    const uploadTest = await this.mediaUploadService.uploadMedia(testBuffer, 'test.txt', 'text/plain');
    
    return {
      adobePdf: adobeTest,
      mediaUpload: {
        success: uploadTest.success,
        message: uploadTest.success ? 'Media upload service working' : uploadTest.error || 'Unknown error'
      }
    };
  }
}
