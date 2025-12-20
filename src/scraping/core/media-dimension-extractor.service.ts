import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Image dimensions
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Service for extracting image dimensions from remote URLs
 * Supports PNG and JPEG by parsing file headers
 */
@Injectable()
export class MediaDimensionExtractorService {
  private readonly logger = new Logger(MediaDimensionExtractorService.name);

  /**
   * Get image dimensions from URL by parsing file headers
   * Supports PNG and JPEG only (most common for real estate)
   * @param url - Image URL
   * @returns Dimensions or null if unable to determine
   */
  async getImageDimensions(url: string): Promise<ImageDimensions | null> {
    try {
      const extension = this.getFileExtension(url).toLowerCase();

      if (extension === 'png') {
        return await this.getPngDimensions(url);
      } else if (extension === 'jpeg' || extension === 'jpg') {
        return await this.getJpegDimensions(url);
      } else if (extension === 'avif') {
        return await this.getAvifDimensions(url);
      }

      // Other formats (webp, gif, etc.) - return null
      this.logger.debug(`[Dimensions] Unsupported format: ${extension}`);
      return null;
    } catch (error) {
      this.logger.debug(`[Dimensions] Error getting dimensions for ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract PNG dimensions from file header
   * PNG IHDR chunk starts at byte 8, width/height at bytes 16-24
   */
  private async getPngDimensions(url: string): Promise<ImageDimensions | null> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'Range': 'bytes=0-23', // Only fetch header
        },
        maxContentLength: 1024 * 100, // Max 100KB for dimension parsing
      });

      const buffer = Buffer.from(response.data);

      // PNG header validation + IHDR chunk
      if (buffer.length < 24 || buffer[0] !== 0x89 || buffer[1] !== 0x50) {
        return null; // Not a valid PNG
      }

      // Width at bytes 16-20, Height at bytes 20-24
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);

      if (width > 0 && height > 0) {
        return { width, height };
      }
      return null;
    } catch (error) {
      this.logger.debug(`[Dimensions] Failed to parse PNG from ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract JPEG dimensions from file header
   * JPEG SOF (Start of Frame) marker contains dimensions
   */
  private async getJpegDimensions(url: string): Promise<ImageDimensions | null> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'Range': 'bytes=0-65535', // Fetch first 64KB for SOF search
        },
        maxContentLength: 1024 * 100, // Max 100KB
      });

      const buffer = Buffer.from(response.data);

      // JPEG starts with FFD8 (SOI marker)
      if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
        return null; // Not a valid JPEG
      }

      // Search for SOF marker (FFC0, FFC1, FFC2, FFC3)
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] === 0xff) {
          const marker = buffer[offset + 1];

          // SOF markers: 0xC0-0xC3
          if (
            (marker >= 0xc0 && marker <= 0xc3) &&
            marker !== 0xc4 &&
            marker !== 0xc8 &&
            marker !== 0xcc
          ) {
            // Height at offset+5 (2 bytes), Width at offset+7 (2 bytes)
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);

            if (width > 0 && height > 0) {
              return { width, height };
            }
            return null;
          }

          // Move to next marker
          if (offset + 3 < buffer.length) {
            const segmentLength = buffer.readUInt16BE(offset + 2);
            offset += 2 + segmentLength;
          } else {
            break;
          }
        } else {
          offset++;
        }
      }

      return null;
    } catch (error) {
      this.logger.debug(`[Dimensions] Failed to parse JPEG from ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract AVIF dimensions from file header
   * AVIF uses similar structure to other image formats
   * Note: This is a simplified implementation that may not work for all AVIF variants
   */
  private async getAvifDimensions(url: string): Promise<ImageDimensions | null> {
    try {
      // AVIF files are complex (HEIF container), but we can try to extract dimensions
      // For now, we'll use a range request to get header information
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'Range': 'bytes=0-16384', // Fetch first 16KB
        },
        maxContentLength: 1024 * 100,
      });

      const buffer = Buffer.from(response.data);

      // AVIF files start with 'ftyp' box after initial bytes
      // This is a basic check - AVIF structure is complex
      if (buffer.length < 20) {
        return null;
      }

      // Look for 'ispe' (Image Spatial Extents) property box which contains dimensions
      const ispeIndex = buffer.indexOf('ispe');
      if (ispeIndex !== -1 && ispeIndex + 12 < buffer.length) {
        // Width and height are 4 bytes each after the ispe marker
        const width = buffer.readUInt32BE(ispeIndex + 4);
        const height = buffer.readUInt32BE(ispeIndex + 8);

        if (width > 0 && height > 0 && width < 50000 && height < 50000) {
          return { width, height };
        }
      }

      // Fallback: AVIF dimension extraction is complex
      // Return null to fall back to relevance scoring
      this.logger.debug(`[Dimensions] Unable to parse AVIF dimensions from ${url}`);
      return null;
    } catch (error) {
      this.logger.debug(`[Dimensions] Failed to parse AVIF from ${url}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract file extension from URL
   */
  private getFileExtension(url: string): string {
    try {
      const path = new URL(url).pathname;
      const ext = path.split('.').pop() || '';
      return ext.split('?')[0]; // Remove query params
    } catch {
      return '';
    }
  }
}
