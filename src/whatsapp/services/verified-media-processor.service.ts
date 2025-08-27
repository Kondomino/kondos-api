import { Injectable, Logger } from '@nestjs/common';
import { MediaProcessingService, MediaData, ProcessedMedia } from './media-processing.service';
import { DigitalOceanSpacesService, BatchUploadResult } from './digital-ocean-spaces.service';

export interface MediaProcessingResult {
  shouldProcessMedia: boolean;
  processedContent?: string;
  enhancedMediaData?: any;
  processingMetadata?: any;
}

@Injectable()
export class VerifiedMediaProcessorService {
  private readonly logger = new Logger(VerifiedMediaProcessorService.name);

  constructor(
    private readonly mediaProcessingService: MediaProcessingService,
    private readonly digitalOceanSpaces: DigitalOceanSpacesService,
  ) {}

  /**
   * Process media for verified real estate agents only
   * This is called after verification but before entering the agentic queue
   */
  async processVerifiedUserMedia(
    messageType: string,
    mediaData: MediaData | undefined,
    messageId: string,
    agencyId: number
  ): Promise<MediaProcessingResult> {
    const processStart = Date.now();
    
    try {
      this.logger.log(`[VERIFIED-MEDIA] Processing request: agencyId=${agencyId} type=${messageType} messageId=${messageId}`);
      
      // Only process media messages from verified users
      if (!this.shouldProcessMediaType(messageType) || !mediaData) {
        this.logger.log(`[VERIFIED-MEDIA] Skipping processing: unsupported type=${messageType} hasData=${!!mediaData}`);
        return {
          shouldProcessMedia: false
        };
      }

      this.logger.log(`[VERIFIED-MEDIA] Starting media processing for verified agency ${agencyId}`);

      // Process the media
      const mediaProcessStart = Date.now();
      const processedMedia: ProcessedMedia = await this.mediaProcessingService.processMedia(
        mediaData,
        messageId
      );
      const mediaProcessTime = Date.now() - mediaProcessStart;

      if (!processedMedia.success) {
        this.logger.warn(`[VERIFIED-MEDIA] Media processing failed after ${mediaProcessTime}ms for message ${messageId}: ${processedMedia.error}`);
        // Return fallback - don't block the conversation
        return {
          shouldProcessMedia: false,
          processedContent: this.getFallbackContent(messageType, mediaData),
          processingMetadata: {
            processingFailed: true,
            error: processedMedia.error,
            processingTime: mediaProcessTime
          }
        };
      }

      // Success - return processed content
      this.logger.log(`[VERIFIED-MEDIA] Media processing successful after ${mediaProcessTime}ms for message ${messageId}`);
      
      const contentBuildStart = Date.now();
      const enhancedContent = this.buildEnhancedContent(processedMedia, messageType);
      const contentBuildTime = Date.now() - contentBuildStart;
      
      const totalTime = Date.now() - processStart;
      
      this.logger.log(`[VERIFIED-MEDIA] Content enhancement complete in ${contentBuildTime}ms`);

      // NEW: Upload to DigitalOcean Spaces (using already-downloaded buffer)
      let spacesResult: BatchUploadResult | null = null;
      let spacesUploadTime = 0;

      if (processedMedia.originalBuffer) {
        try {
          this.logger.log(`[VERIFIED-MEDIA] Uploading files to DigitalOcean Spaces using existing buffer...`);
          const spacesUploadStart = Date.now();
          
          // Use the already-downloaded buffer - no re-download needed!
          spacesResult = await this.digitalOceanSpaces.uploadProcessedMedia({
            originalBuffer: processedMedia.originalBuffer,
            originalFilename: mediaData.filename || `media_${messageId}`,
            originalContentType: mediaData.mimeType || 'application/octet-stream',
            extractedImages: processedMedia.extractedImageBuffers || [],
            messageId,
            agencyId,
          });
          
          spacesUploadTime = Date.now() - spacesUploadStart;

          if (spacesResult.success) {
            this.logger.log(`[VERIFIED-MEDIA] Spaces upload successful in ${spacesUploadTime}ms: ${spacesResult.totalUploads} files`);
          } else {
            this.logger.warn(`[VERIFIED-MEDIA] Spaces upload failed in ${spacesUploadTime}ms: ${spacesResult.error}`);
          }
        } catch (spacesError) {
          spacesUploadTime = Date.now() - spacesUploadTime;
          this.logger.error(`[VERIFIED-MEDIA] Spaces upload error in ${spacesUploadTime}ms: ${spacesError.message}`);
          spacesResult = {
            success: false,
            error: spacesError.message,
            failedUploads: 1,
            totalUploads: 1,
            uploadTime: spacesUploadTime,
          };
        }
      } else {
        this.logger.warn(`[VERIFIED-MEDIA] No original buffer available - skipping Spaces upload`);
        spacesResult = {
          success: false,
          error: 'No original buffer available for upload',
          failedUploads: 1,
          totalUploads: 1,
          uploadTime: 0,
        };
      }

      const finalTotalTime = Date.now() - processStart;
      this.logger.log(`[VERIFIED-MEDIA] SUCCESS: extracted ${processedMedia.extractedText?.length || 0} chars, total time ${finalTotalTime}ms`);

      return {
        shouldProcessMedia: true,
        processedContent: enhancedContent,
        enhancedMediaData: {
          ...mediaData,
          processedContent: processedMedia.extractedText,
          // Use Spaces URLs if available, fallback to local URLs
          uploadUrl: spacesResult?.originalFileUrl || processedMedia.uploadUrl,
          spacesUrls: spacesResult?.success ? {
            originalFile: spacesResult.originalFileUrl,
            extractedImages: spacesResult.extractedImageUrls || []
          } : undefined,
          extractionMetadata: processedMedia.metadata,
          extractedTables: processedMedia.extractedTables,
          extractedImages: spacesResult?.extractedImageUrls || processedMedia.extractedImages
        },
        processingMetadata: {
          processingSuccessful: true,
          extractionType: processedMedia.metadata.extractionType,
          processingTime: finalTotalTime,
          mediaProcessingTime: mediaProcessTime,
          contentBuildTime: contentBuildTime,
          spacesUploadTime: spacesUploadTime,
          fileSize: processedMedia.metadata.fileSize,
          extractionDetails: processedMedia.metadata.extractionDetails,
          spacesUpload: spacesResult ? {
            success: spacesResult.success,
            totalFiles: spacesResult.totalUploads,
            failedFiles: spacesResult.failedUploads || 0,
            originalFileUrl: spacesResult.originalFileUrl,
            extractedImagesCount: spacesResult.extractedImageUrls?.length || 0,
            error: spacesResult.error
          } : { success: false, error: 'Spaces upload not attempted' }
        }
      };

    } catch (error) {
      const totalTime = Date.now() - processStart;
      this.logger.error(`[VERIFIED-MEDIA] FAILED after ${totalTime}ms for message ${messageId}: ${error.message}`, error.stack);
      
      // Return fallback - don't block the conversation
      return {
        shouldProcessMedia: false,
        processedContent: this.getFallbackContent(messageType, mediaData),
        processingMetadata: {
          processingFailed: true,
          error: error.message,
          processingTime: totalTime
        }
      };
    }
  }

  private shouldProcessMediaType(messageType: string): boolean {
    const processableTypes = ['document', 'image', 'video'];
    return processableTypes.includes(messageType);
  }

  private getFallbackContent(messageType: string, mediaData?: MediaData): string {
    const filename = mediaData?.filename || 'arquivo';
    
    switch (messageType) {
      case 'document':
        return `[Documento recebido: ${filename}]`;
      case 'image':
        return `[Imagem recebida: ${filename}]`;
      case 'video':
        return `[Vídeo recebido: ${filename}]`;
      default:
        return `[Arquivo recebido: ${filename}]`;
    }
  }

  private buildEnhancedContent(processedMedia: ProcessedMedia, messageType: string): string {
    let content = '';

    // Add file information
    const filename = processedMedia.originalMediaData.filename || 'arquivo';
    content += `[${this.getFileTypeLabel(messageType)} recebido: ${filename}]\n\n`;

    // Add extracted content if available
    if (processedMedia.extractedText && processedMedia.extractedText.trim()) {
      content += '--- CONTEÚDO EXTRAÍDO ---\n';
      content += processedMedia.extractedText;
    }

    // Add table information if available
    if (processedMedia.extractedTables && processedMedia.extractedTables.length > 0) {
      content += `\n\n--- ${processedMedia.extractedTables.length} TABELA(S) ENCONTRADA(S) ---\n`;
      content += '[Dados de tabelas disponíveis para análise]';
    }

    // Add image information if available
    if (processedMedia.extractedImages && processedMedia.extractedImages.length > 0) {
      content += `\n\n--- ${processedMedia.extractedImages.length} IMAGEM(NS) EXTRAÍDA(S) ---\n`;
      content += '[Imagens extraídas do documento disponíveis]';
    }

    // Add processing metadata for context
    if (processedMedia.metadata.extractionDetails) {
      const details = processedMedia.metadata.extractionDetails;
      content += '\n\n--- INFORMAÇÕES DO ARQUIVO ---\n';
      
      if (details.pageCount) {
        content += `Páginas: ${details.pageCount}\n`;
      }
      if (details.elementsFound) {
        content += `Elementos encontrados: ${details.elementsFound}\n`;
      }
      if (details.tablesCount) {
        content += `Tabelas: ${details.tablesCount}\n`;
      }
      if (details.imagesCount) {
        content += `Imagens: ${details.imagesCount}\n`;
      }
    }

    return content.trim();
  }

  private getFileTypeLabel(messageType: string): string {
    switch (messageType) {
      case 'document':
        return 'Documento';
      case 'image':
        return 'Imagem';
      case 'video':
        return 'Vídeo';
      default:
        return 'Arquivo';
    }
  }

  // Utility method for testing
  async testMediaProcessing(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const serviceTest = await this.mediaProcessingService.testServices();
      
      return {
        success: serviceTest.adobePdf.success && serviceTest.mediaUpload.success,
        message: 'Media processing services are working',
        details: serviceTest
      };
    } catch (error) {
      return {
        success: false,
        message: `Media processing test failed: ${error.message}`
      };
    }
  }
}
