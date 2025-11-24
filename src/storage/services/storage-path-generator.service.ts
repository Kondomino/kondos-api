import { Injectable } from '@nestjs/common';

export interface StoragePaths {
  rawContentBase: string;
  originalFile: string;
  extractedBase?: string;
  extractedText?: string;
  extractedTables?: string;
  extractedImagesBase?: string;
}

@Injectable()
export class StoragePathGeneratorService {
  
  /**
   * Generates storage paths for raw PDF content
   */
  generatePdfPaths(agencyId: number, messageId: string, originalFilename: string): StoragePaths {
    const baseDir = `raw-content/agency-${agencyId}/pdfs/${messageId}`;
    const sanitizedOriginal = this.sanitizeFilename(originalFilename, 'original.pdf');
    
    return {
      rawContentBase: baseDir,
      originalFile: `${baseDir}/${sanitizedOriginal}`,
      extractedBase: `${baseDir}/extracted`,
      extractedText: `${baseDir}/extracted/text.json`,
      extractedTables: `${baseDir}/extracted/tables.json`,
      extractedImagesBase: `${baseDir}/extracted/images`,
    };
  }

  /**
   * Generates storage paths for raw image content
   */
  generateImagePaths(agencyId: number, messageId: string, originalFilename: string): StoragePaths {
    const fileExtension = this.getFileExtension(originalFilename);
    const baseDir = `raw-content/agency-${agencyId}/images/${messageId}`;
    
    return {
      rawContentBase: baseDir,
      originalFile: `${baseDir}/original${fileExtension}`,
    };
  }

  /**
   * Generates storage paths for raw video content
   */
  generateVideoPaths(agencyId: number, messageId: string, originalFilename: string): StoragePaths {
    const fileExtension = this.getFileExtension(originalFilename);
    const baseDir = `raw-content/agency-${agencyId}/videos/${messageId}`;
    
    return {
      rawContentBase: baseDir,
      originalFile: `${baseDir}/original${fileExtension}`,
    };
  }

  /**
   * Generates path for extracted image from PDF
   */
  generateExtractedImagePath(agencyId: number, messageId: string, imageIndex: number): string {
    return `raw-content/agency-${agencyId}/pdfs/${messageId}/extracted/images/image_${imageIndex}.jpg`;
  }

  /**
   * Generates public URL from storage path
   */
  generatePublicUrl(storagePath: string, baseUrl?: string): string {
    const baseUrlToUse = baseUrl || process.env.DIGITAL_OCEAN_SPACES_CDN_URL || 'https://your-spaces-url.com';
    return `${baseUrlToUse}/${storagePath}`;
  }

  /**
   * Extracts file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  private sanitizeFilename(filename: string, fallback: string): string {
    if (!filename || !filename.trim()) {
      return fallback;
    }
    return filename
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Validates that a storage path follows our raw content structure
   */
  validateRawContentPath(path: string): boolean {
    const rawContentPattern = /^raw-content\/agency-\d+\/(pdfs|images|videos)\/[^/]+\//;
    return rawContentPattern.test(path);
  }

  /**
   * Extracts agency ID from a raw content path
   */
  extractAgencyIdFromPath(path: string): number | null {
    const match = path.match(/^raw-content\/agency-(\d+)\//);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Extracts message ID from a raw content path
   */
  extractMessageIdFromPath(path: string): string | null {
    const match = path.match(/^raw-content\/agency-\d+\/(?:pdfs|images|videos)\/([^/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Determines content type from storage path
   */
  getContentTypeFromPath(path: string): 'pdf' | 'image' | 'video' | null {
    if (path.includes('/pdfs/')) return 'pdf';
    if (path.includes('/images/')) return 'image';
    if (path.includes('/videos/')) return 'video';
    return null;
  }
}
