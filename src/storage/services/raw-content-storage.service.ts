import { Injectable, Logger } from '@nestjs/common';
import { DigitalOceanSpacesService } from '../../whatsapp/services/digital-ocean-spaces.service';
import { StoragePathGeneratorService } from './storage-path-generator.service';
import { 
  RawContentStorageResult, 
  BatchUploadResult, 
  StorageFile,
  RawContentEntry 
} from '../interfaces/storage-result.interface';

export interface StoreRawPdfContentParams {
  agencyId: number;
  messageId: string;
  originalPdf: Buffer;
  originalFilename: string;
  extractedContent: {
    text: string;
    tables: any[];
    images: Buffer[];
  };
}

export interface StoreRawMediaContentParams {
  agencyId: number;
  messageId: string;
  mediaBuffer: Buffer;
  mediaType: 'image' | 'video';
  originalFilename: string;
  contentType: string;
}

@Injectable()
export class RawContentStorageService {
  private readonly logger = new Logger(RawContentStorageService.name);

  constructor(
    private readonly digitalOceanSpacesService: DigitalOceanSpacesService,
    private readonly pathGenerator: StoragePathGeneratorService,
  ) {}

  /**
   * Stores raw PDF content and extracted data in Digital Ocean Spaces
   */
  async storeRawPdfContent(params: StoreRawPdfContentParams): Promise<RawContentStorageResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`[RAW-STORAGE] Starting PDF storage for agency ${params.agencyId}, message ${params.messageId}`);
      
      // Generate storage paths
      const paths = this.pathGenerator.generatePdfPaths(
        params.agencyId, 
        params.messageId, 
        params.originalFilename
      );

      // Prepare files for batch upload
      const filesToUpload: Array<{
        buffer: Buffer;
        key: string;
        contentType: string;
        metadata: Record<string, string>;
      }> = [];

      // Original PDF
      filesToUpload.push({
        buffer: params.originalPdf,
        key: paths.originalFile,
        contentType: 'application/pdf',
        metadata: {
          messageId: params.messageId,
          agencyId: params.agencyId.toString(),
          fileType: 'original_pdf',
          originalFilename: params.originalFilename,
        },
      });

      // Extracted text as JSON
      if (params.extractedContent.text) {
        const textBuffer = Buffer.from(JSON.stringify({
          text: params.extractedContent.text,
          extractedAt: new Date().toISOString(),
          messageId: params.messageId,
        }), 'utf-8');

        filesToUpload.push({
          buffer: textBuffer,
          key: paths.extractedText!,
          contentType: 'application/json',
          metadata: {
            messageId: params.messageId,
            agencyId: params.agencyId.toString(),
            fileType: 'extracted_text',
            textLength: params.extractedContent.text.length.toString(),
          },
        });
      }

      // Extracted tables as JSON
      if (params.extractedContent.tables && params.extractedContent.tables.length > 0) {
        const tablesBuffer = Buffer.from(JSON.stringify({
          tables: params.extractedContent.tables,
          extractedAt: new Date().toISOString(),
          messageId: params.messageId,
          tableCount: params.extractedContent.tables.length,
        }), 'utf-8');

        filesToUpload.push({
          buffer: tablesBuffer,
          key: paths.extractedTables!,
          contentType: 'application/json',
          metadata: {
            messageId: params.messageId,
            agencyId: params.agencyId.toString(),
            fileType: 'extracted_tables',
            tableCount: params.extractedContent.tables.length.toString(),
          },
        });
      }

      // Extracted images
      const extractedImageFiles: StorageFile[] = [];
      if (params.extractedContent.images && params.extractedContent.images.length > 0) {
        params.extractedContent.images.forEach((imageBuffer, index) => {
          const imagePath = this.pathGenerator.generateExtractedImagePath(
            params.agencyId,
            params.messageId,
            index
          );

          filesToUpload.push({
            buffer: imageBuffer,
            key: imagePath,
            contentType: 'image/jpeg',
            metadata: {
              messageId: params.messageId,
              agencyId: params.agencyId.toString(),
              fileType: 'extracted_image',
              imageIndex: index.toString(),
            },
          });
        });
      }

      // Upload all files
      this.logger.log(`[RAW-STORAGE] Uploading ${filesToUpload.length} files to Digital Ocean Spaces`);
      const uploadResults = await this.digitalOceanSpacesService.uploadMultipleFiles(filesToUpload);

      // Process results
      const successfulUploads = uploadResults.filter(result => result.success);
      const failedUploads = uploadResults.filter(result => !result.success);

      if (failedUploads.length > 0) {
        this.logger.error(`[RAW-STORAGE] ${failedUploads.length} uploads failed for message ${params.messageId}`);
        failedUploads.forEach(failed => {
          this.logger.error(`[RAW-STORAGE] Failed upload: ${failed.key} - ${failed.error}`);
        });
      }

      const processingTime = Date.now() - startTime;

      // Find the original file result
      const originalFileResult = uploadResults.find(result => 
        result.key === paths.originalFile && result.success
      );

      if (!originalFileResult) {
        throw new Error('Failed to upload original PDF file');
      }

      // Build extracted content results
      const extractedContent: RawContentStorageResult['extractedContent'] = {};
      
      const textResult = uploadResults.find(result => result.key === paths.extractedText && result.success);
      if (textResult) {
        extractedContent.textFile = {
          path: textResult.key,
          url: textResult.url!,
          size: textResult.size || 0,
          contentType: 'application/json',
        };
      }

      const tablesResult = uploadResults.find(result => result.key === paths.extractedTables && result.success);
      if (tablesResult) {
        extractedContent.tablesFile = {
          path: tablesResult.key,
          url: tablesResult.url!,
          size: tablesResult.size || 0,
          contentType: 'application/json',
        };
      }

      // Extracted images
      const imageResults = uploadResults.filter(result => 
        result.key.includes('/extracted/images/') && result.success
      );
      if (imageResults.length > 0) {
        extractedContent.images = imageResults.map(result => ({
          path: result.key,
          url: result.url!,
          size: result.size || 0,
          contentType: 'image/jpeg',
        }));
      }

      this.logger.log(`[RAW-STORAGE] PDF storage complete in ${processingTime}ms: ${successfulUploads.length}/${filesToUpload.length} successful`);

      return {
        success: successfulUploads.length > 0, // At least original file should be uploaded
        agencyId: params.agencyId,
        messageId: params.messageId,
        contentType: 'pdf',
        originalFile: {
          path: originalFileResult.key,
          url: originalFileResult.url!,
          size: originalFileResult.size || params.originalPdf.length,
          contentType: 'application/pdf',
        },
        extractedContent,
        metadata: {
          processingTime,
          timestamp: new Date(),
          originalFilename: params.originalFilename,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`[RAW-STORAGE] PDF storage failed after ${processingTime}ms: ${error.message}`);
      
      return {
        success: false,
        agencyId: params.agencyId,
        messageId: params.messageId,
        contentType: 'pdf',
        originalFile: {
          path: '',
          url: '',
          size: 0,
          contentType: 'application/pdf',
        },
        metadata: {
          processingTime,
          timestamp: new Date(),
          originalFilename: params.originalFilename,
        },
        error: error.message,
      };
    }
  }

  /**
   * Stores raw media content (images/videos) in Digital Ocean Spaces
   */
  async storeRawMediaContent(params: StoreRawMediaContentParams): Promise<RawContentStorageResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`[RAW-STORAGE] Starting ${params.mediaType} storage for agency ${params.agencyId}, message ${params.messageId}`);
      
      // Generate storage paths
      const paths = params.mediaType === 'image' 
        ? this.pathGenerator.generateImagePaths(params.agencyId, params.messageId, params.originalFilename)
        : this.pathGenerator.generateVideoPaths(params.agencyId, params.messageId, params.originalFilename);

      // Upload file
      const uploadResult = await this.digitalOceanSpacesService.uploadMultipleFiles([{
        buffer: params.mediaBuffer,
        key: paths.originalFile,
        contentType: params.contentType,
        metadata: {
          messageId: params.messageId,
          agencyId: params.agencyId.toString(),
          fileType: `original_${params.mediaType}`,
          originalFilename: params.originalFilename,
        },
      }]);

      const processingTime = Date.now() - startTime;
      const result = uploadResult[0];

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      this.logger.log(`[RAW-STORAGE] ${params.mediaType} storage complete in ${processingTime}ms`);

      return {
        success: true,
        agencyId: params.agencyId,
        messageId: params.messageId,
        contentType: params.mediaType,
        originalFile: {
          path: result.key,
          url: result.url!,
          size: result.size || params.mediaBuffer.length,
          contentType: params.contentType,
        },
        metadata: {
          processingTime,
          timestamp: new Date(),
          originalFilename: params.originalFilename,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`[RAW-STORAGE] ${params.mediaType} storage failed after ${processingTime}ms: ${error.message}`);
      
      return {
        success: false,
        agencyId: params.agencyId,
        messageId: params.messageId,
        contentType: params.mediaType,
        originalFile: {
          path: '',
          url: '',
          size: 0,
          contentType: params.contentType,
        },
        metadata: {
          processingTime,
          timestamp: new Date(),
          originalFilename: params.originalFilename,
        },
        error: error.message,
      };
    }
  }

  /**
   * Creates a database entry record for tracking raw content
   */
  createRawContentEntry(storageResult: RawContentStorageResult): RawContentEntry {
    const extractedFiles: string[] = [];
    
    if (storageResult.extractedContent?.textFile) {
      extractedFiles.push(storageResult.extractedContent.textFile.path);
    }
    if (storageResult.extractedContent?.tablesFile) {
      extractedFiles.push(storageResult.extractedContent.tablesFile.path);
    }
    if (storageResult.extractedContent?.images) {
      extractedFiles.push(...storageResult.extractedContent.images.map(img => img.path));
    }

    return {
      agency_id: storageResult.agencyId,
      message_id: storageResult.messageId,
      content_type: storageResult.contentType,
      storage_path: storageResult.originalFile.path,
      processing_status: storageResult.success ? 'processed' : 'failed',
      metadata: {
        originalFilename: storageResult.metadata.originalFilename,
        fileSize: storageResult.originalFile.size,
        contentType: storageResult.originalFile.contentType,
        extractedFiles: extractedFiles.length > 0 ? extractedFiles : undefined,
        processingTime: storageResult.metadata.processingTime,
        error: storageResult.error,
      },
    };
  }
}
