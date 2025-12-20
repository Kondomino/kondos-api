import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { StorageStreamCdnService } from '../../storage/services/storage-stream-cdn.service';
import { EntryMetadata, MediaFilters } from '../../storage/services/storage-stream-cdn.service';
import { RetryService } from './retry.service';

/**
 * Service for downloading media from URLs and uploading to cloud storage
 */
@Injectable()
export class MediaDownloadService {
  private readonly logger = new Logger(MediaDownloadService.name);

  constructor(
    private readonly storageService: StorageStreamCdnService,
    private readonly retryService: RetryService,
  ) {}

  /**
   * Download media from URL and upload to cloud storage
   * @param url - Media URL to download
   * @param kondoId - Kondo ID for storage organization
   * @param filters - Media filter configuration
   * @returns CDN URL and filename, or error
   */
  async downloadAndUploadMedia(
    url: string,
    kondoId: number,
    filters: MediaFilters,
  ): Promise<{ cdnUrl: string; filename: string } | null> {
    try {
      this.logger.debug(`[Download] Starting download: ${url}`);

      // Download with retry
      const { stream, metadata } = await this.retryService.withRetry(async () => {
        return this.fetchMediaStream(url);
      });

      // Upload to storage
      const result = await this.storageService.processStreamEntry(stream, metadata, filters);

      if (result.success && result.cdnUrl) {
        this.logger.log(`[Download] Successfully uploaded: ${result.cdnUrl}`);
        return {
          cdnUrl: result.cdnUrl,
          filename: metadata.path,
        };
      } else {
        this.logger.warn(`[Download] Upload skipped: ${result.skippedReason || 'Unknown reason'}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`[Download] Failed to download/upload ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch media stream from URL
   * @param url - Media URL
   * @returns Stream and metadata
   */
  private async fetchMediaStream(
    url: string,
  ): Promise<{ stream: NodeJS.ReadableStream; metadata: EntryMetadata }> {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 30000,
        maxRedirects: 5,
        maxContentLength: 100 * 1024 * 1024, // Max 100MB
        headers: {
          'User-Agent': 'Kondos-API/1.0',
        },
      });

      // Extract content length
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);

      // Generate filename from URL
      const filename = this.generateFilename(url, response.headers['content-type']);

      const metadata: EntryMetadata = {
        path: `kondo-${Date.now()}-${filename}`,
        size: contentLength,
      };

      return {
        stream: response.data,
        metadata,
      };
    } catch (error) {
      this.logger.error(`[Download] Failed to fetch stream from ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate safe filename from URL
   */
  private generateFilename(url: string, contentType?: string): string {
    try {
      const urlObj = new URL(url);
      let filename = urlObj.pathname.split('/').pop() || '';

      // Remove query params
      filename = filename.split('?')[0];

      // Sanitize filename
      filename = filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 100);

      // Ensure extension
      if (!filename.match(/\.\w+$/)) {
        const ext = this.getExtensionFromContentType(contentType || 'image/jpeg');
        filename = `${filename || 'media'}.${ext}`;
      }

      return filename;
    } catch {
      const ext = this.getExtensionFromContentType(contentType || 'image/jpeg');
      return `media-${Date.now()}.${ext}`;
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromContentType(contentType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
    };

    return mimeMap[contentType.split(';')[0]] || 'jpg';
  }
}
