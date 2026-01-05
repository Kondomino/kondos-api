import { Injectable, Logger } from '@nestjs/common';
import { ICdnTransformer } from './cdn-transformer.interface';

/**
 * Transformer for Wix CDN URLs (static.wixstatic.com)
 * 
 * Wix serves multiple image versions with different parameters:
 * - Thumbnails: w_147,h_98,blur_2 (blurred, small)
 * - Medium: w_708,h_420 (good quality)
 * - High: w_1920,h_1080 (best quality)
 * 
 * This transformer upgrades any Wix URL to highest quality
 */
@Injectable()
export class WixUrlTransformerService implements ICdnTransformer {
  private readonly logger = new Logger(WixUrlTransformerService.name);
  private readonly CDN_DOMAINS = ['static.wixstatic.com', 'static.parastorage.com'];
  
  // Target dimensions for high-quality images
  private readonly HIGH_QUALITY_WIDTH = 1920;
  private readonly HIGH_QUALITY_HEIGHT = 1080;

  /**
   * Detect if URL is from Wix CDN
   */
  isCdnUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.CDN_DOMAINS.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return this.CDN_DOMAINS.some(domain => url.includes(domain));
    }
  }

  /**
   * Transform Wix URL to highest quality version
   * 
   * Transformations:
   * 1. Remove blur parameters (blur_2, blur_3, etc.)
   * 2. Upgrade dimensions to 1920x1080
   * 3. Keep other parameters (alignment, encoding, etc.)
   * 
   * @param url - Original Wix URL (e.g., with w_147,h_98,blur_2)
   * @returns Transformed URL with high-quality parameters
   */
  transformToHighQuality(url: string): string {
    if (!this.isCdnUrl(url)) {
      return url;
    }

    try {
      let transformed = url;

      // Step 1: Remove blur parameter (blur_2, blur_3, etc.)
      // Pattern: ,blur_2 or ,blur_3 anywhere in the URL
      transformed = transformed.replace(/,blur_\d+/g, '');

      // Step 2: Upgrade dimensions
      // Pattern: /v1/fill/w_147,h_98,... → /v1/fill/w_1920,h_1080,...
      // Matches: w_<number>,h_<number> followed by comma or slash
      const dimensionPattern = /(\/v\d+\/fill\/)w_\d+,h_\d+(,|\/)/;
      
      if (dimensionPattern.test(transformed)) {
        transformed = transformed.replace(
          dimensionPattern,
          `$1w_${this.HIGH_QUALITY_WIDTH},h_${this.HIGH_QUALITY_HEIGHT}$2`
        );
      }

      // Step 3: Remove quality_auto restriction (optional - keeps if present)
      // Quality auto can sometimes reduce quality, but generally safe to keep

      if (transformed !== url) {
        const shortOriginal = this.shortenUrlForLog(url);
        const shortTransformed = this.shortenUrlForLog(transformed);
        this.logger.debug(
          `[WIX] Transformed URL:\n  FROM: ${shortOriginal}\n  TO:   ${shortTransformed}`
        );
      }

      return transformed;
    } catch (error) {
      this.logger.warn(`[WIX] Failed to transform URL: ${error.message}`);
      return url; // Return original on error
    }
  }

  /**
   * Get CDN name
   */
  getCdnName(): string {
    return 'Wix';
  }

  /**
   * Extract dimensions from Wix URL
   * @param url - Wix URL
   * @returns Object with width and height, or null if not found
   */
  extractDimensions(url: string): { width: number; height: number } | null {
    const match = url.match(/w_(\d+),h_(\d+)/);
    if (match) {
      return {
        width: parseInt(match[1], 10),
        height: parseInt(match[2], 10),
      };
    }
    return null;
  }

  /**
   * Check if URL has blur parameter
   */
  hasBlur(url: string): boolean {
    return /,blur_\d+/.test(url);
  }

  /**
   * Shorten URL for logging (keep domain and key parameters)
   */
  private shortenUrlForLog(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      const params = pathParts.find(part => part.includes('w_'));
      
      return `${urlObj.hostname}/.../${params || ''}/${filename.substring(0, 50)}`;
    } catch {
      return url.substring(0, 100);
    }
  }
}
