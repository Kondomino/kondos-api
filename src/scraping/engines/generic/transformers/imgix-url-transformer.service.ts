import { Injectable, Logger } from '@nestjs/common';
import { ICdnTransformer } from './cdn-transformer.interface';

/**
 * Transformer for Imgix CDN URLs
 * 
 * Imgix serves images with URL parameters for transformations:
 * - ?w=300&h=200&fit=crop (small)
 * - ?w=1200&h=800&fit=crop (medium)
 * - ?w=2400&h=1600&q=90 (high quality)
 * 
 * This transformer upgrades Imgix URLs to highest quality
 */
@Injectable()
export class ImgixUrlTransformerService implements ICdnTransformer {
  private readonly logger = new Logger(ImgixUrlTransformerService.name);
  
  // Imgix typically uses custom domains ending in .imgix.net
  private readonly CDN_PATTERN = /\.imgix\.net/;
  
  // Target dimensions for high-quality images
  private readonly HIGH_QUALITY_WIDTH = 2400;
  private readonly HIGH_QUALITY_HEIGHT = 1600;
  private readonly HIGH_QUALITY_FACTOR = 90; // Quality parameter (0-100)

  /**
   * Detect if URL is from Imgix CDN
   */
  isCdnUrl(url: string): boolean {
    return this.CDN_PATTERN.test(url);
  }

  /**
   * Transform Imgix URL to highest quality version
   * 
   * Transformations:
   * 1. Upgrade width and height parameters
   * 2. Set high quality factor (q=90)
   * 3. Remove quality restrictions (auto=compress, etc.)
   * 4. Keep fit parameter if present
   * 
   * @param url - Original Imgix URL
   * @returns Transformed URL with high-quality parameters
   */
  transformToHighQuality(url: string): string {
    if (!this.isCdnUrl(url)) {
      return url;
    }

    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      // Step 1: Upgrade dimensions
      if (params.has('w') || params.has('h')) {
        params.set('w', this.HIGH_QUALITY_WIDTH.toString());
        params.set('h', this.HIGH_QUALITY_HEIGHT.toString());
      }

      // Step 2: Set high quality
      params.set('q', this.HIGH_QUALITY_FACTOR.toString());

      // Step 3: Remove auto compression
      if (params.has('auto')) {
        const autoValue = params.get('auto');
        if (autoValue === 'compress' || autoValue?.includes('compress')) {
          params.delete('auto');
        }
      }

      // Step 4: Ensure good fit mode (crop or max)
      if (!params.has('fit')) {
        params.set('fit', 'max');
      }

      const transformed = urlObj.toString();

      if (transformed !== url) {
        this.logger.debug(
          `[IMGIX] Transformed URL:\n  FROM: ${this.shortenUrlForLog(url)}\n  TO:   ${this.shortenUrlForLog(transformed)}`
        );
      }

      return transformed;
    } catch (error) {
      this.logger.warn(`[IMGIX] Failed to transform URL: ${error.message}`);
      return url; // Return original on error
    }
  }

  /**
   * Get CDN name
   */
  getCdnName(): string {
    return 'Imgix';
  }

  /**
   * Extract dimensions from Imgix URL
   * @param url - Imgix URL
   * @returns Object with width and height, or null if not found
   */
  extractDimensions(url: string): { width: number; height: number } | null {
    try {
      const urlObj = new URL(url);
      const w = urlObj.searchParams.get('w');
      const h = urlObj.searchParams.get('h');

      if (w && h) {
        return {
          width: parseInt(w, 10),
          height: parseInt(h, 10),
        };
      }
    } catch {
      // Invalid URL
    }
    return null;
  }

  /**
   * Shorten URL for logging
   */
  private shortenUrlForLog(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      return `${urlObj.hostname}/.../${filename}?${urlObj.search.substring(1, 50)}...`;
    } catch {
      return url.substring(0, 100);
    }
  }
}
