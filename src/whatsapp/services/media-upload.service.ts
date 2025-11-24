/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
  success: boolean;
  url?: string;
  localPath?: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  error?: string;
}

@Injectable()
export class MediaUploadService {
  private readonly logger = new Logger(MediaUploadService.name);
  private readonly uploadsDir: string;
  private readonly baseUrl: string;
  private readonly maxFileSize: number;

  constructor(private readonly configService: ConfigService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = this.configService.get<string>('MEDIA_UPLOAD_BASE_URL') || 'http://localhost:3000/media';
    this.maxFileSize = parseInt(this.configService.get<string>('MEDIA_UPLOAD_MAX_SIZE') || '10485760'); // 10MB default

    // Ensure uploads directory exists
    this.initializeUploadsDirectory();
    
    this.logger.log(`Media Upload Service initialized - uploads dir: ${this.uploadsDir}`);
  }

  async uploadMedia(buffer: Buffer, originalFilename: string, mimeType: string): Promise<UploadResult> {
    const uploadStart = Date.now();
    
    try {
      this.logger.log(`[MEDIA-UPLOAD] Starting upload: ${originalFilename}`);
      this.logger.log(`[MEDIA-UPLOAD] File details: ${buffer.length} bytes, ${mimeType}`);

      // Check file size
      if (buffer.length > this.maxFileSize) {
        this.logger.warn(`[MEDIA-UPLOAD] File too large: ${buffer.length} > ${this.maxFileSize} bytes`);
        return {
          success: false,
          size: buffer.length,
          mimeType,
          uploadedAt: new Date(),
          error: `File size ${buffer.length} exceeds maximum allowed size ${this.maxFileSize}`
        };
      }

      // Generate unique filename
      const fileExtension = path.extname(originalFilename) || this.getExtensionFromMimeType(mimeType);
      const uniqueFilename = `${randomUUID()}${fileExtension}`;
      
      this.logger.log(`[MEDIA-UPLOAD] Generated filename: ${uniqueFilename}`);
      
      // TODO: In the future, this will upload to cloud storage (AWS S3, DigitalOcean Spaces, etc.)
      // For now, save locally
      const saveStart = Date.now();
      const localPath = await this.saveLocally(buffer, uniqueFilename);
      const saveTime = Date.now() - saveStart;
      
      const publicUrl = `${this.baseUrl}/${uniqueFilename}`;
      const totalTime = Date.now() - uploadStart;

      this.logger.log(`[MEDIA-UPLOAD] File saved locally in ${saveTime}ms: ${localPath}`);
      this.logger.log(`[MEDIA-UPLOAD] SUCCESS: ${uniqueFilename} uploaded in ${totalTime}ms -> ${publicUrl}`);

      return {
        success: true,
        url: publicUrl,
        localPath,
        size: buffer.length,
        mimeType,
        uploadedAt: new Date()
      };
    } catch (error) {
      const totalTime = Date.now() - uploadStart;
      this.logger.error(`[MEDIA-UPLOAD] FAILED after ${totalTime}ms: ${originalFilename} - ${error.message}`, error.stack);
      
      return {
        success: false,
        size: buffer.length,
        mimeType,
        uploadedAt: new Date(),
        error: error.message
      };
    }
  }

  async uploadMultipleFiles(files: Array<{ buffer: Buffer; filename: string; mimeType: string }>): Promise<UploadResult[]> {
    const batchStart = Date.now();
    this.logger.log(`[MEDIA-UPLOAD-BATCH] Starting batch upload: ${files.length} files`);
    
    const results = await Promise.all(
      files.map(file => this.uploadMedia(file.buffer, file.filename, file.mimeType))
    );

    const successful = results.filter(r => r.success).length;
    const totalTime = Date.now() - batchStart;
    
    this.logger.log(`[MEDIA-UPLOAD-BATCH] Batch complete in ${totalTime}ms: ${successful}/${files.length} files successful`);

    return results;
  }

  private async initializeUploadsDirectory(): Promise<void> {
    try {
      await fs.promises.mkdir(this.uploadsDir, { recursive: true });
      
      // Create subdirectories for different media types
      const subdirs = ['images', 'documents', 'videos', 'extracted'];
      await Promise.all(
        subdirs.map(subdir => 
          fs.promises.mkdir(path.join(this.uploadsDir, subdir), { recursive: true })
        )
      );
    } catch (error) {
      this.logger.error(`Failed to initialize uploads directory: ${error.message}`);
      throw error;
    }
  }

  private async saveLocally(buffer: Buffer, filename: string): Promise<string> {
    // Determine subdirectory based on file type
    const subdir = this.getSubdirectoryForFile(filename);
    const fullDir = path.join(this.uploadsDir, subdir);
    
    // Ensure subdirectory exists
    await fs.promises.mkdir(fullDir, { recursive: true });
    
    const filePath = path.join(fullDir, filename);
    // @ts-ignore - Buffer is compatible with fs.writeFile despite TypeScript strictness
    await fs.promises.writeFile(filePath, buffer);
    
    return filePath;
  }

  private getSubdirectoryForFile(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const documentExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv'];
    
    if (imageExtensions.includes(extension)) return 'images';
    if (documentExtensions.includes(extension)) return 'documents';
    if (videoExtensions.includes(extension)) return 'videos';
    
    return 'other';
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'text/plain': '.txt',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };

    return mimeToExtension[mimeType] || '.bin';
  }

  // Future cloud storage methods (placeholders)
  
  /**
   * TODO: Implement AWS S3 upload
   */
  private async uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    this.logger.warn(`[MEDIA-UPLOAD] S3 upload pending implementation (key=${key}, size=${buffer.length}, mime=${mimeType})`);
    throw new Error('S3 upload not implemented yet');
  }

  /**
   * TODO: Implement DigitalOcean Spaces upload
   */
  private async uploadToSpaces(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    this.logger.warn(`[MEDIA-UPLOAD] Spaces upload pending implementation (key=${key}, size=${buffer.length}, mime=${mimeType})`);
    throw new Error('Spaces upload not implemented yet');
  }

  /**
   * TODO: Implement Google Cloud Storage upload
   */
  private async uploadToGCS(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    this.logger.warn(`[MEDIA-UPLOAD] GCS upload pending implementation (key=${key}, size=${buffer.length}, mime=${mimeType})`);
    throw new Error('GCS upload not implemented yet');
  }

  // Utility methods

  async getFileInfo(filename: string): Promise<{ exists: boolean; size?: number; path?: string }> {
    try {
      const filePath = path.join(this.uploadsDir, filename);
      const stats = await fs.promises.stat(filePath);
      
      return {
        exists: true,
        size: stats.size,
        path: filePath
      };
    } catch (error) {
      return { exists: false };
    }
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadsDir, filename);
      await fs.promises.unlink(filePath);
      this.logger.log(`Deleted file: ${filename}`);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to delete file ${filename}: ${error.message}`);
      return false;
    }
  }
}
