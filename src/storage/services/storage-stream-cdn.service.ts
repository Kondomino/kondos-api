import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

/**
 * Media filtering configuration
 */
export interface MediaFilters {
  minSizeKb: number;
  minResolution: { width: number; height: number };
  supportedFormats: string[];
}

/**
 * Entry metadata for filtering
 */
export interface EntryMetadata {
  path: string;
  size: number; // bytes
}

/**
 * Result of stream entry processing
 */
export interface ProcessResult {
  success: boolean;
  cdnUrl?: string; // If uploaded successfully
  skippedReason?: string; // If filtered out
  error?: string; // If failed
}

/**
 * Validation result with details
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
  fileSize?: number;
  resolution?: { width: number; height: number };
}

/**
 * Image dimensions
 */
interface Dimensions {
  width: number;
  height: number;
}

/**
 * Storage service configuration
 */
interface StorageConfig {
  bucket: string;
  cdnEndpoint: string;
  cdnPrefix: string;
}

@Injectable()
export class StorageStreamCdnService {
  private readonly logger = new Logger(StorageStreamCdnService.name);
  private s3: S3;
  private readonly config: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    // Initialize S3 client for DigitalOcean Spaces
    this.s3 = new S3({
      endpoint: this.configService.get<string>('DIGITAL_OCEAN_ORIGIN_ENDPOINT'),
      region: 'us-east-1',
      accessKeyId: this.configService.get<string>('DIGITAL_OCEAN_STORAGE_KEY_ID'),
      secretAccessKey: this.configService.get<string>('DIGITAL_OCEAN_STORAGE_SECRET'),
      signatureVersion: 'v4'
    });

    // Load configuration
    this.config = {
      bucket: this.configService.get<string>('DIGITAL_OCEAN_STORAGE_BUCKET'),
      cdnEndpoint: this.configService.get<string>('DIGITAL_OCEAN_CDN_ENDPOINT'),
      cdnPrefix: 'extracted'
    };

    this.logger.log('[STORAGE] StorageStreamCdnService initialized');
    this.logger.debug(`[STORAGE] CDN Endpoint: ${this.config.cdnEndpoint}`);
    this.logger.debug(`[STORAGE] Bucket: ${this.config.bucket}`);
  }

  /**
   * Main entry point: process a stream entry with filtering and upload
   *
   * @param entry - Readable stream of file content
   * @param metadata - File metadata (path, size)
   * @param filters - Media filter configuration
   * @returns ProcessResult with success status and CDN URL or skip reason
   */
  async processStreamEntry(
    entry: NodeJS.ReadableStream,
    metadata: EntryMetadata,
    filters: MediaFilters
  ): Promise<ProcessResult> {
    try {
      this.logger.debug(`[STREAM] Processing entry: ${metadata.path} (${metadata.size} bytes)`);

      // Validate media against filters
      const validation = await this.validateMedia(metadata, entry, filters);

      if (!validation.valid) {
        this.logger.debug(
          `[STREAM] Entry filtered out: ${metadata.path} - ${validation.reason}`
        );
        return {
          success: false,
          skippedReason: validation.reason
        };
      }

      // Upload to Spaces
      const contentType = this.getMimeType(metadata.path);
      const objectKey = `${this.config.cdnPrefix}/${metadata.path}`;

      this.logger.log(`[STREAM] Uploading: ${objectKey}`);
      const cdnUrl = await this.uploadToSpaces(entry, objectKey, contentType);

      this.logger.log(`[STREAM] Successfully uploaded: ${cdnUrl}`);

      return {
        success: true,
        cdnUrl
      };
    } catch (error) {
      this.logger.error(`[STREAM] Error processing entry ${metadata.path}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate media against filter criteria
   *
   * @param metadata - File metadata
   * @param stream - File stream (for header parsing if needed)
   * @param filters - Filter configuration
   * @returns ValidationResult indicating if file passes all filters
   */
  private async validateMedia(
    metadata: EntryMetadata,
    stream: NodeJS.ReadableStream,
    filters: MediaFilters
  ): Promise<ValidationResult> {
    // Check file type
    const fileExt = this.getFileExtension(metadata.path).toLowerCase();
    if (!filters.supportedFormats.includes(fileExt)) {
      return {
        valid: false,
        reason: `Unsupported format: .${fileExt}`
      };
    }

    // Check file size (convert KB to bytes)
    const minSizeBytes = filters.minSizeKb * 1024;
    if (metadata.size < minSizeBytes) {
      return {
        valid: false,
        reason: `File too small: ${(metadata.size / 1024).toFixed(2)}KB < ${filters.minSizeKb}KB`
      };
    }

    // Resolution validation removed for performance optimization
    // Only file size and format are validated now

    return {
      valid: true,
      fileSize: metadata.size,
      resolution: undefined
    };
  }

  /**
   * Upload file stream to DigitalOcean Spaces
   *
   * @param stream - File stream
   * @param objectKey - S3 object key (with prefix)
   * @param contentType - MIME type
   * @returns CDN URL
   */
  private async uploadToSpaces(
    stream: NodeJS.ReadableStream,
    objectKey: string,
    contentType: string
  ): Promise<string> {
    const params = {
      Bucket: this.config.bucket,
      Key: objectKey,
      Body: stream,
      ACL: 'public-read', // Public permanent access
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable' // Cache forever
    };

    try {
      await this.s3.upload(params).promise();
      return this.constructCdnUrl(objectKey);
    } catch (error) {
      this.logger.error(`[S3] Upload failed for ${objectKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Construct permanent CDN URL from object key
   *
   * @param objectKey - S3 object key
   * @returns Full CDN URL
   */
  public constructCdnUrl(objectKey: string): string {
    const url = `${this.config.cdnEndpoint}/${objectKey}`;
    return url;
  }

  /**
   * Extract image dimensions from stream by parsing headers
   *
   * Supports PNG and JPEG formats by reading file headers.
   * For other formats, returns null.
   *
   * @param stream - Image file stream
   * @param format - File format (jpg, jpeg, png, webp)
   * @returns Dimensions or null if unable to determine
   */
  private async getImageResolution(
    stream: NodeJS.ReadableStream,
    format: string
  ): Promise<Dimensions | null> {
    try {
      if (format === 'png') {
        return this.parsePngDimensions(stream);
      } else if (format === 'jpeg' || format === 'jpg') {
        return this.parseJpegDimensions(stream);
      }
      // For webp and other formats, return null (no resolution check)
      return null;
    } catch (error) {
      this.logger.debug(`[RESOLUTION] Could not parse ${format} dimensions: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse PNG image dimensions from stream header
   *
   * PNG IHDR chunk starts at byte 8 and contains width/height at bytes 16-24
   *
   * @param stream - PNG stream
   * @returns Dimensions or null
   */
  private async parsePngDimensions(stream: NodeJS.ReadableStream): Promise<Dimensions | null> {
    return new Promise((resolve) => {
      let buffer = Buffer.alloc(0);
      let resolved = false;

      stream.on('data', (chunk) => {
        if (!resolved) {
          buffer = Buffer.concat([buffer, chunk]);

          // PNG header is 8 bytes, IHDR chunk starts at byte 8
          // Width is at bytes 16-20 (4 bytes), Height at bytes 20-24 (4 bytes)
          if (buffer.length >= 24) {
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);

            resolved = true;
            stream.pause(); // Stop reading
            resolve({ width, height });
          }
        }
      });

      stream.on('error', () => {
        resolved = true;
        resolve(null);
      });

      stream.on('end', () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      });
    });
  }

  /**
   * Parse JPEG image dimensions from stream header
   *
   * JPEG SOF (Start of Frame) marker contains width/height information
   * This reads the first segment to find SOF marker.
   *
   * @param stream - JPEG stream
   * @returns Dimensions or null
   */
  private async parseJpegDimensions(stream: NodeJS.ReadableStream): Promise<Dimensions | null> {
    return new Promise((resolve) => {
      let buffer = Buffer.alloc(0);
      let resolved = false;

      stream.on('data', (chunk) => {
        if (!resolved) {
          buffer = Buffer.concat([buffer, chunk]);

          // JPEG starts with FFD8 (SOI marker)
          // Then comes FFE0-FFEF (APP markers) or FFC0-FFC3 (SOF markers)
          // Try to find SOF marker (FFC0, FFC1, FFC2, FFC3)

          if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
            let offset = 2;

            while (offset < buffer.length - 8) {
              if (buffer[offset] === 0xff) {
                const marker = buffer[offset + 1];

                // SOF markers are 0xC0-0xC3 (180-195)
                if (marker >= 0xc0 && marker <= 0xc3 && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
                  // Height at offset+5 (2 bytes), Width at offset+7 (2 bytes)
                  const height = buffer.readUInt16BE(offset + 5);
                  const width = buffer.readUInt16BE(offset + 7);

                  resolved = true;
                  stream.pause();
                  resolve({ width, height });
                  return;
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
          }

          // If buffer gets too large, give up
          if (buffer.length > 65536) {
            resolved = true;
            stream.pause();
            resolve(null);
          }
        }
      });

      stream.on('error', () => {
        resolved = true;
        resolve(null);
      });

      stream.on('end', () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      });
    });
  }

  /**
   * Determine MIME type from filename
   *
   * @param filename - File path or name
   * @returns MIME type string
   */
  private getMimeType(filename: string): string {
    if (filename.endsWith('.png')) return 'image/png';
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
    if (filename.endsWith('.webp')) return 'image/webp';
    if (filename.endsWith('.json')) return 'application/json';
    return 'application/octet-stream';
  }

  /**
   * Extract file extension from path
   *
   * @param path - File path
   * @returns Extension without dot
   */
  private getFileExtension(path: string): string {
    return path.split('.').pop() || '';
  }
}
