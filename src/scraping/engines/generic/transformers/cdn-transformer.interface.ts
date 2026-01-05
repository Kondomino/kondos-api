/**
 * Interface for CDN URL transformers
 * Each CDN (Wix, Imgix, Cloudinary, etc.) implements this interface
 */
export interface ICdnTransformer {
  /**
   * Detect if URL belongs to this CDN
   * @param url - URL to check
   * @returns true if URL is from this CDN
   */
  isCdnUrl(url: string): boolean;

  /**
   * Transform CDN URL to highest quality version
   * Removes blur, upgrades dimensions, removes quality restrictions
   * 
   * @param url - Original URL (potentially thumbnail/low-quality)
   * @returns Transformed URL (high-quality)
   */
  transformToHighQuality(url: string): string;

  /**
   * Get CDN name for logging
   */
  getCdnName(): string;
}
