import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Dimension validation result
 */
export interface DimensionValidationResult {
  valid: boolean;
  dimensions?: { width: number; height: number };
  reason?: string;
}

/**
 * Service for validating image dimensions
 * Isolated from main scraping flow for reusability
 */
@Injectable()
export class MediaDimensionValidatorService {
  private readonly logger = new Logger(MediaDimensionValidatorService.name);

  /**
   * Validate image dimensions against minimum requirements
   * Makes HTTP HEAD request to get image dimensions from Content-Length hints
   * Falls back to partial download and header parsing
   * 
   * @param url - Image URL to validate
   * @param minWidth - Minimum required width
   * @param minHeight - Minimum required height
   * @returns Validation result with dimensions if available
   */
  async validateImageDimensions(
    url: string,
    minWidth: number,
    minHeight: number
  ): Promise<DimensionValidationResult> {
    try {
      const dimensions = await this.getImageDimensions(url);

      if (!dimensions) {
        return {
          valid: false,
          reason: 'Unable to determine dimensions'
        };
      }

      const valid = dimensions.width >= minWidth && dimensions.height >= minHeight;

      return {
        valid,
        dimensions,
        reason: valid 
          ? undefined 
          : `Resolution too low: ${dimensions.width}x${dimensions.height} < ${minWidth}x${minHeight}`
      };

    } catch (error) {
      this.logger.debug(`Failed to validate dimensions for ${url}: ${error.message}`);
      return {
        valid: false,
        reason: `Dimension check failed: ${error.message}`
      };
    }
  }

  /**
   * Get image dimensions by downloading and parsing image headers
   * Supports PNG and JPEG formats
   * 
   * @param url - Image URL
   * @returns Dimensions or null if unable to determine
   */
  private async getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
    try {
      // Download first 50KB to parse headers
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'Range': 'bytes=0-51200' // First 50KB
        },
        validateStatus: (status) => (status >= 200 && status < 300) || status === 206
      });

      const buffer = Buffer.from(response.data);
      const format = this.detectImageFormat(buffer);

      if (format === 'png') {
        return this.parsePngDimensions(buffer);
      } else if (format === 'jpeg') {
        return this.parseJpegDimensions(buffer);
      }

      return null;
    } catch (error) {
      this.logger.debug(`Error fetching image dimensions: ${error.message}`);
      return null;
    }
  }

  /**
   * Detect image format from buffer signature
   */
  private detectImageFormat(buffer: Buffer): string | null {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'png';
    }

    // JPEG signature: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'jpeg';
    }

    return null;
  }

  /**
   * Parse PNG dimensions from IHDR chunk
   * PNG IHDR chunk starts at byte 8 and contains width/height at bytes 16-24
   */
  private parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
      if (buffer.length < 24) return null;

      // Width: bytes 16-19 (big-endian)
      const width = buffer.readUInt32BE(16);
      // Height: bytes 20-23 (big-endian)
      const height = buffer.readUInt32BE(20);

      return { width, height };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse JPEG dimensions from SOF marker
   * JPEG SOF (Start of Frame) marker contains width/height information
   */
  private parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
      let offset = 2; // Skip SOI marker (FF D8)

      while (offset < buffer.length - 1) {
        // Find next marker (FF XX)
        if (buffer[offset] !== 0xFF) {
          offset++;
          continue;
        }

        const marker = buffer[offset + 1];
        offset += 2;

        // Skip padding bytes
        if (marker === 0xFF) {
          offset--;
          continue;
        }

        // Check if this is a SOF marker (C0-C3, excluding C4, C8, CC)
        if (marker >= 0xC0 && marker <= 0xC3 && marker !== 0xC4) {
          if (offset + 7 > buffer.length) return null;

          // Height at offset+3 (2 bytes), Width at offset+5 (2 bytes)
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);

          return { width, height };
        }

        // Read segment length and skip to next marker
        if (offset + 2 > buffer.length) return null;
        const segmentLength = buffer.readUInt16BE(offset);
        offset += segmentLength;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
