import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { randomUUID } from 'crypto';

export interface SpacesUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  size?: number;
  contentType?: string;
  uploadedAt: Date;
  error?: string;
}

export interface BatchUploadResult {
  success: boolean;
  originalFileUrl?: string;
  extractedImageUrls?: string[];
  failedUploads?: number;
  totalUploads: number;
  uploadTime: number;
  error?: string;
}

@Injectable()
export class DigitalOceanSpacesService {
  private readonly logger = new Logger(DigitalOceanSpacesService.name);
  private readonly s3Client: AWS.S3;
  private readonly bucketName: string;
  private readonly cdnEndpoint: string;
  private readonly originEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('DIGITAL_OCEAN_STORAGE_KEY_ID');
    const secretAccessKey = this.configService.get<string>('DIGITAL_OCEAN_STORAGE_SECRET');
    this.originEndpoint = this.configService.get<string>('DIGITAL_OCEAN_ORIGIN_ENDPOINT');
    this.cdnEndpoint = this.configService.get<string>('DIGITAL_OCEAN_CDN_ENDPOINT');
    this.bucketName = this.extractBucketName(this.originEndpoint);

    if (!accessKeyId || !secretAccessKey || !this.originEndpoint || !this.cdnEndpoint) {
      this.logger.error('DigitalOcean Spaces credentials not properly configured');
      throw new Error('DigitalOcean Spaces credentials are required');
    }

    // Convert bucket-specific endpoint to region endpoint for S3 client
    const regionEndpoint = this.convertToRegionEndpoint(this.originEndpoint);
    
    this.s3Client = new AWS.S3({
      endpoint: regionEndpoint,
      accessKeyId,
      secretAccessKey,
      s3ForcePathStyle: false, // Use virtual-hosted style for DigitalOcean Spaces
      signatureVersion: 'v4',
    });

    this.logger.log(`DigitalOcean Spaces service initialized - bucket: ${this.bucketName}`);
    this.logger.log(`Using region endpoint: ${regionEndpoint}`);
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
    metadata: Record<string, string> = {}
  ): Promise<SpacesUploadResult> {
    const uploadStart = Date.now();

    try {
      this.logger.log(`[DO-SPACES] Starting upload: ${key} (${buffer.length} bytes, ${contentType})`);

      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read', // Make files publicly accessible via CDN
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'kondos-api',
        },
      };

      await this.s3Client.upload(uploadParams).promise();
      const uploadTime = Date.now() - uploadStart;
      const cdnUrl = this.generateCdnUrl(key);

      this.logger.log(`[DO-SPACES] Upload successful in ${uploadTime}ms: ${key} -> ${cdnUrl}`);

      return {
        success: true,
        url: cdnUrl,
        key,
        size: buffer.length,
        contentType,
        uploadedAt: new Date(),
      };
    } catch (error) {
      const uploadTime = Date.now() - uploadStart;
      this.logger.error(`[DO-SPACES] Upload failed after ${uploadTime}ms: ${key} - ${error.message}`, error.stack);

      return {
        success: false,
        size: buffer.length,
        contentType,
        uploadedAt: new Date(),
        error: error.message,
      };
    }
  }

  async uploadMultipleFiles(files: Array<{
    buffer: Buffer;
    key: string;
    contentType: string;
    metadata?: Record<string, string>;
  }>): Promise<SpacesUploadResult[]> {
    const batchStart = Date.now();
    this.logger.log(`[DO-SPACES-BATCH] Starting batch upload: ${files.length} files`);

    const uploadPromises = files.map(file =>
      this.uploadFile(file.buffer, file.key, file.contentType, file.metadata)
    );

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success).length;
    const totalTime = Date.now() - batchStart;

    this.logger.log(`[DO-SPACES-BATCH] Batch complete in ${totalTime}ms: ${successful}/${files.length} files successful`);

    return results;
  }

  async uploadProcessedMedia(params: {
    originalBuffer: Buffer;
    originalFilename: string;
    originalContentType: string;
    extractedImages?: Buffer[];
    messageId: string;
    agencyId: number;
  }): Promise<BatchUploadResult> {
    const batchStart = Date.now();
    
    try {
      this.logger.log(`[DO-SPACES-MEDIA] Processing media upload for agency ${params.agencyId}, message ${params.messageId}`);

      const files: Array<{
        buffer: Buffer;
        key: string;
        contentType: string;
        metadata: Record<string, string>;
      }> = [];

      // Prepare original file upload
      const originalKey = this.generateFileKey(
        params.agencyId,
        'original',
        this.getFileTypeFromContentType(params.originalContentType),
        params.originalFilename,
        params.messageId
      );

      files.push({
        buffer: params.originalBuffer,
        key: originalKey,
        contentType: params.originalContentType,
        metadata: {
          messageId: params.messageId,
          agencyId: params.agencyId.toString(),
          fileType: 'original',
          originalFilename: params.originalFilename,
        },
      });

      // Prepare extracted images uploads
      if (params.extractedImages && params.extractedImages.length > 0) {
        params.extractedImages.forEach((imageBuffer, index) => {
          const imageKey = this.generateFileKey(
            params.agencyId,
            'extracted',
            'images',
            `${params.messageId}_image_${index}.jpg`,
            params.messageId
          );

          files.push({
            buffer: imageBuffer,
            key: imageKey,
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
      const uploadResults = await this.uploadMultipleFiles(files);
      
      // Process results
      const originalResult = uploadResults[0];
      const imageResults = uploadResults.slice(1);
      
      const successful = uploadResults.filter(r => r.success).length;
      const failed = uploadResults.length - successful;
      const totalTime = Date.now() - batchStart;

      const result: BatchUploadResult = {
        success: successful > 0, // Success if at least original file uploaded
        originalFileUrl: originalResult.success ? originalResult.url : undefined,
        extractedImageUrls: imageResults.filter(r => r.success).map(r => r.url!),
        failedUploads: failed,
        totalUploads: uploadResults.length,
        uploadTime: totalTime,
      };

      if (failed > 0) {
        const errors = uploadResults.filter(r => !r.success).map(r => r.error).join('; ');
        result.error = `${failed} uploads failed: ${errors}`;
      }

      this.logger.log(`[DO-SPACES-MEDIA] Batch upload complete: ${successful}/${uploadResults.length} successful in ${totalTime}ms`);
      
      return result;
    } catch (error) {
      const totalTime = Date.now() - batchStart;
      this.logger.error(`[DO-SPACES-MEDIA] Batch upload failed after ${totalTime}ms: ${error.message}`, error.stack);

      return {
        success: false,
        failedUploads: 1,
        totalUploads: 1,
        uploadTime: totalTime,
        error: error.message,
      };
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      this.logger.log(`[DO-SPACES] Deleting file: ${key}`);

      await this.s3Client.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();

      this.logger.log(`[DO-SPACES] File deleted successfully: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`[DO-SPACES] Failed to delete file ${key}: ${error.message}`);
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      this.logger.log('[DO-SPACES] Testing connection...');

      // Test with a small buffer upload and delete
      const testKey = `test/${randomUUID()}.txt`;
      const testBuffer = Buffer.from('Kondos API test file', 'utf-8');

      const uploadResult = await this.uploadFile(testBuffer, testKey, 'text/plain', {
        test: 'true'
      });

      if (uploadResult.success) {
        // Clean up test file
        await this.deleteFile(testKey);

        return {
          success: true,
          message: 'DigitalOcean Spaces connection successful',
          details: {
            bucket: this.bucketName,
            cdnEndpoint: this.cdnEndpoint,
            uploadTime: 'tested',
          },
        };
      } else {
        return {
          success: false,
          message: `Connection test failed: ${uploadResult.error}`,
        };
      }
    } catch (error) {
      this.logger.error('[DO-SPACES] Connection test failed:', error);
      return {
        success: false,
        message: `Connection test error: ${error.message}`,
      };
    }
  }

  private generateFileKey(
    agencyId: number,
    category: 'original' | 'extracted',
    fileType: string,
    filename: string,
    messageId?: string
  ): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-'); // YYYY-MM-DDTHH-MM-SS
    const messagePrefix = messageId ? `${messageId}_` : '';
    
    return `agencies/${agencyId}/${category}/${fileType}/${messagePrefix}${timestamp}_${filename}`;
  }

  private generateCdnUrl(key: string): string {
    return `${this.cdnEndpoint}/${key}`;
  }

  private getFileTypeFromContentType(contentType: string): string {
    if (contentType.startsWith('image/')) return 'images';
    if (contentType.startsWith('video/')) return 'videos';
    if (contentType === 'application/pdf') return 'documents';
    return 'other';
  }

  private extractBucketName(endpoint: string): string {
    // Extract bucket name from endpoint like "https://kondo-spaces-storage.nyc3.digitaloceanspaces.com"
    const match = endpoint.match(/https:\/\/([^.]+)\./);
    if (match && match[1]) {
      return match[1];
    }
    throw new Error(`Could not extract bucket name from endpoint: ${endpoint}`);
  }

  private convertToRegionEndpoint(bucketEndpoint: string): string {
    // Convert from "https://kondo-spaces-storage.nyc3.digitaloceanspaces.com"
    // to "https://nyc3.digitaloceanspaces.com"
    const match = bucketEndpoint.match(/https:\/\/[^.]+\.([^.]+\.digitaloceanspaces\.com)/);
    if (match && match[1]) {
      return `https://${match[1]}`;
    }
    throw new Error(`Could not extract region endpoint from: ${bucketEndpoint}`);
  }

  // Utility methods for getting file info
  getPublicUrl(key: string): string {
    return this.generateCdnUrl(key);
  }

  getBucketName(): string {
    return this.bucketName;
  }

  getCdnEndpoint(): string {
    return this.cdnEndpoint;
  }
}
