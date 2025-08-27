import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsAppMediaInfo {
  url: string;
  mimeType: string;
  sha256: string;
  fileSize: number;
  id: string;
}

@Injectable()
export class WhatsAppMediaService {
  private readonly logger = new Logger(WhatsAppMediaService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(private readonly configService: ConfigService) {
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');

    if (!this.accessToken) {
      this.logger.error('WHATSAPP_ACCESS_TOKEN is not configured');
    }
    if (!this.phoneNumberId) {
      this.logger.error('WHATSAPP_PHONE_NUMBER_ID is not configured');
    }

    this.logger.log('WhatsApp Media Service initialized successfully');
  }

  /**
   * Get media information and download URL from WhatsApp API
   * @param mediaId The media ID from the webhook
   * @returns Media information including download URL
   */
  async getMediaInfo(mediaId: string): Promise<WhatsAppMediaInfo> {
    try {
      this.logger.log(`[WA-MEDIA] Getting media info for ID: ${mediaId}`);
      
      const url = `https://graph.facebook.com/v20.0/${mediaId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const mediaInfo = await response.json();
      this.logger.log(`[WA-MEDIA] Media info retrieved: ${JSON.stringify(mediaInfo)}`);

      return {
        url: mediaInfo.url,
        mimeType: mediaInfo.mime_type,
        sha256: mediaInfo.sha256,
        fileSize: mediaInfo.file_size,
        id: mediaInfo.id,
      };
    } catch (error) {
      this.logger.error(`[WA-MEDIA] Failed to get media info for ${mediaId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download media file from WhatsApp
   * @param mediaUrl The media URL from getMediaInfo()
   * @returns Buffer containing the media file
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    try {
      this.logger.log(`[WA-MEDIA] Downloading media from: ${mediaUrl.substring(0, 100)}...`);
      
      const response = await fetch(mediaUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      this.logger.log(`[WA-MEDIA] Media downloaded: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      this.logger.error(`[WA-MEDIA] Failed to download media: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get media info and download in one step
   * @param mediaId The media ID from the webhook
   * @returns Object containing media info and buffer
   */
  async getMediaInfoAndDownload(mediaId: string): Promise<{
    info: WhatsAppMediaInfo;
    buffer: Buffer;
  }> {
    const info = await this.getMediaInfo(mediaId);
    const buffer = await this.downloadMedia(info.url);
    
    return { info, buffer };
  }

  /**
   * Test the WhatsApp Media API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Try to get info for a dummy media ID (this will fail but test the connection)
      await this.getMediaInfo('test-media-id');
      
      return {
        success: false,
        message: 'Unexpected success with test media ID'
      };
    } catch (error) {
      // We expect this to fail, but we can check if it's a proper API response
      if (error.message.includes('WhatsApp API error')) {
        return {
          success: true,
          message: 'WhatsApp Media API is accessible (test failed as expected)',
          details: { error: error.message }
        };
      }
      
      return {
        success: false,
        message: 'WhatsApp Media API connection failed',
        details: { error: error.message }
      };
    }
  }
}
