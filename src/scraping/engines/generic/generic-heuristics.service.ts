import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { MediaRelevanceScorerService } from '../../core/media-relevance-scorer.service';
import { CACHE_CONFIG, PLACEHOLDER_PATTERNS, FAKE_KEYWORDS } from './generic.config';
import { WixUrlTransformerService } from './transformers/wix-url-transformer.service';
import { ImgixUrlTransformerService } from './transformers/imgix-url-transformer.service';
import { ICdnTransformer } from './transformers/cdn-transformer.interface';

/**
 * Results from cache skip detection
 */
export interface CacheEntry {
  url: string;
  etag?: string;
  lastModified?: string;
  htmlChecksum: string;
  timestamp: Date;
  mediaCount: number;
  mediaHashes: string[];
}

/**
 * Results from duplicate detection
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  hash: string;
  firstSeenAt?: Date;
}

/**
 * Results from placeholder detection
 */
export interface PlaceholderCheckResult {
  isPlaceholder: boolean;
  reason: string;
}

/**
 * Pagination detection results
 */
export interface PaginationInfo {
  hasPagination: boolean;
  nextUrl?: string;
  type: 'button' | 'link' | 'query-param' | 'none';
}

/**
 * Service for applying heuristics to improve scraping quality
 * Handles: caching, deduplication, placeholder detection, validation
 */
@Injectable()
export class GenericHeuristicsService {
  private readonly logger = new Logger(GenericHeuristicsService.name);
  private cacheDir: string;
  private cdnTransformers: ICdnTransformer[];

  constructor(
    private readonly mediaScorer: MediaRelevanceScorerService,
    private readonly wixTransformer: WixUrlTransformerService,
    private readonly imgixTransformer: ImgixUrlTransformerService,
  ) {
    this.cacheDir = CACHE_CONFIG.directory;
    this.ensureCacheDir();
    
    // Register all CDN transformers
    this.cdnTransformers = [
      this.wixTransformer,
      this.imgixTransformer,
    ];
  }

  /**
   * Check if site content hasn't changed (skip scraping)
   * Uses ETag and Last-Modified headers + HTML checksum
   */
  shouldSkipUnchangedSite(
    url: string,
    responseHeaders: Record<string, string>,
    html: string
  ): boolean {
    const cached = this.loadCache(url);

    if (!cached) {
      // No cache yet, can't skip
      return false;
    }

    // ETag match = exact same response from server
    if (
      CACHE_CONFIG.enableEtagMatching &&
      cached.etag &&
      cached.etag === responseHeaders['etag']
    ) {
      const lastScraped = new Date(cached.timestamp).toISOString().split('T')[0];
      this.logger.log(
        `[HEURISTICS] Skipping unchanged site (ETag match, last: ${lastScraped})`
      );
      return true;
    }

    // Last-Modified + checksum = content unchanged
    if (
      CACHE_CONFIG.enableChecksumMatching &&
      cached.lastModified &&
      cached.lastModified === responseHeaders['last-modified']
    ) {
      const newChecksum = this.md5(html);
      if (cached.htmlChecksum === newChecksum) {
        this.logger.log(
          `[HEURISTICS] Skipping unchanged site (checksum match)`
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Update cache with new scraping results
   */
  updateCache(
    url: string,
    responseHeaders: Record<string, string>,
    html: string,
    mediaCount: number,
    mediaHashes: string[]
  ): void {
    const entry: CacheEntry = {
      url,
      etag: responseHeaders['etag'],
      lastModified: responseHeaders['last-modified'],
      htmlChecksum: this.md5(html),
      timestamp: new Date(),
      mediaCount,
      mediaHashes,
    };

    this.saveCache(url, entry);
  }

  /**
   * Detect if an image is a duplicate based on content hash
   * Downloads first 1KB of image for fingerprinting
   */
  async detectDuplicate(
    imageUrl: string,
    previousImageHashes: string[]
  ): Promise<DuplicateCheckResult> {
    try {
      const hash = await this.getImageFingerprint(imageUrl);

      if (previousImageHashes.includes(hash)) {
        this.logger.debug(
          `[HEURISTICS] Duplicate image detected, hash: ${hash.substring(0, 8)}...`
        );
        return { isDuplicate: true, hash };
      }

      return { isDuplicate: false, hash };
    } catch (error) {
      // If fingerprinting fails, assume not duplicate
      this.logger.debug(
        `[HEURISTICS] Could not fingerprint image ${imageUrl}: ${error.message}`
      );
      return { isDuplicate: false, hash: '' };
    }
  }

  /**
   * Get image fingerprint (MD5 of first 1KB)
   * Avoids downloading full image while still detecting visual duplicates
   */
  private async getImageFingerprint(url: string): Promise<string> {
    // For MVP, use URL as simple hash (can enhance later with actual image downloads)
    // This prevents most obvious duplicates (same URL)
    return this.md5(url);
  }

  /**
   * Detect placeholder images (icons, UI elements)
   */
  detectPlaceholder(
    url: string,
    width?: number,
    height?: number,
    alt?: string
  ): PlaceholderCheckResult {
    // Check size
    if (
      width &&
      height &&
      width < PLACEHOLDER_PATTERNS.minSize.width &&
      height < PLACEHOLDER_PATTERNS.minSize.height
    ) {
      return {
        isPlaceholder: true,
        reason: `Size ${width}x${height} (too small)`,
      };
    }

    // Check URL patterns
    for (const pattern of PLACEHOLDER_PATTERNS.filenames) {
      if (pattern.test(url)) {
        return {
          isPlaceholder: true,
          reason: `URL matches placeholder pattern: ${url.substring(0, 50)}...`,
        };
      }
    }

    // Check alt text
    if (alt) {
      const altLower = alt.toLowerCase();
      for (const keyword of PLACEHOLDER_PATTERNS.altTexts) {
        if (altLower.includes(keyword)) {
          return {
            isPlaceholder: true,
            reason: `Alt text: "${alt}"`,
          };
        }
      }
    }

    return { isPlaceholder: false, reason: 'Passed all checks' };
  }

  /**
   * Normalize URL to ensure it has a proper protocol
   * Handles protocol-relative URLs (//domain.com/image.jpg)
   * 
   * @param url - URL to normalize
   * @returns Normalized URL with https:// protocol
   */
  private normalizeUrlProtocol(url: string): string {
    if (!url) return url;
    
    // Handle protocol-relative URLs (//domain.com/image.jpg)
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    // Already has protocol or is relative
    return url;
  }

  /**
   * Transform CDN URLs to highest quality versions
   * Upgrades Wix, Imgix, and other CDN URLs to remove thumbnails/blur
   * Also normalizes protocol-relative URLs
   * 
   * @param urls - Array of media URLs
   * @returns Array of transformed URLs
   */
  transformCdnUrls(urls: string[]): string[] {
    this.logger.debug(`[HEURISTICS] Processing ${urls.length} URLs for CDN transformation`);
    
    const transformed = urls.map((url) => {
      // First, normalize protocol-relative URLs
      let normalizedUrl = this.normalizeUrlProtocol(url);
      
      // Try each CDN transformer
      for (const transformer of this.cdnTransformers) {
        if (transformer.isCdnUrl(normalizedUrl)) {
          const upgraded = transformer.transformToHighQuality(normalizedUrl);
          
          if (upgraded !== normalizedUrl) {
            this.logger.log(
              `[HEURISTICS] Upgraded ${transformer.getCdnName()} URL: ${this.shortenUrl(normalizedUrl)} → ${this.shortenUrl(upgraded)}`
            );
          }
          
          return upgraded;
        }
      }
      
      // No transformer matched, return normalized URL
      return normalizedUrl;
    });

    const transformedCount = transformed.filter((url, i) => url !== urls[i]).length;
    
    if (transformedCount > 0) {
      this.logger.log(`[HEURISTICS] Transformed ${transformedCount}/${urls.length} CDN URLs to high quality`);
    }

    return transformed;
  }

  /**
   * Sort media URLs by relevance score
   * Uses MediaRelevanceScorerService to rank URLs
   */
  async sortMediaByRelevance(
    urls: string[],
    propertyDomain?: string
  ): Promise<string[]> {
    const scored = urls.map((url) => ({
      url,
      score: this.mediaScorer.scoreMediaUrl(url, propertyDomain),
    }));

    const sorted = scored
      .sort((a, b) => b.score - a.score)
      .map((item) => item.url);

    const logEntry = scored
      .slice(0, 5) // Show top 5
      .map((s) => `${s.url.substring(0, 30)}...:${s.score.toFixed(2)}`)
      .join(', ');

    this.logger.debug(
      `[HEURISTICS] Media sorted by relevance: [${logEntry}${scored.length > 5 ? ', ...' : ''}]`
    );

    return sorted;
  }

  /**
   * Detect pagination in HTML
   * Looks for "next" links and query parameters
   */
  detectPagination(
    $: any,
    baseUrl: string
  ): PaginationInfo {
    // Look for "next" indicators
    const nextSelectors = [
      'a.next',
      'a[rel="next"]',
      'button[data-page-next]',
      '.pagination a:last-child',
      'a[aria-label*="next"]',
    ];

    for (const selector of nextSelectors) {
      const nextLink = $(selector).first();
      if (nextLink.length > 0) {
        const href = nextLink.attr('href');
        if (href) {
          const nextUrl = this.resolveUrl(href, baseUrl);
          this.logger.log(
            `[HEURISTICS] Pagination detected (link): ${nextUrl.substring(0, 50)}...`
          );
          return {
            hasPagination: true,
            nextUrl,
            type: 'link',
          };
        }
      }
    }

    // Check for query params (page=, offset=, start=)
    try {
      const url = new URL(baseUrl);
      if (
        url.searchParams.has('page') ||
        url.searchParams.has('offset') ||
        url.searchParams.has('start')
      ) {
        this.logger.log('[HEURISTICS] Pagination detected (query param)');
        return { hasPagination: true, type: 'query-param' };
      }
    } catch (error) {
      // Invalid URL, skip pagination check
    }

    return { hasPagination: false, type: 'none' };
  }

  /**
   * Remove fake commodities and placeholder text
   */
  removeFakeCommodities(text: string): string {
    let cleaned = text;

    for (const keyword of FAKE_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    }

    cleaned = cleaned
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (cleaned !== text) {
      this.logger.debug(
        `[HEURISTICS] Removed fake commodities from: "${text.substring(0, 50)}..."`
      );
    }

    return cleaned;
  }

  /**
   * Resolve relative URLs to absolute
   */
  private resolveUrl(href: string, baseUrl: string): string {
    if (href.startsWith('http')) {
      return href;
    }

    try {
      return new URL(href, baseUrl).href;
    } catch (error) {
      return href;
    }
  }

  /**
   * MD5 hash utility
   */
  private md5(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Shorten URL for logging (first 60 chars)
   */
  private shortenUrl(url: string): string {
    return url.length > 60 ? `${url.substring(0, 60)}...` : url;
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Load cache entry for URL
   */
  private loadCache(url: string): CacheEntry | null {
    try {
      const domain = new URL(url).hostname;
      const cacheFile = path.join(this.cacheDir, `${domain}.json`);

      if (!fs.existsSync(cacheFile)) {
        return null;
      }

      const data = fs.readFileSync(cacheFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save cache entry for URL
   */
  private saveCache(url: string, entry: CacheEntry): void {
    try {
      const domain = new URL(url).hostname;
      const cacheFile = path.join(this.cacheDir, `${domain}.json`);

      fs.writeFileSync(cacheFile, JSON.stringify(entry, null, 2), 'utf-8');
    } catch (error) {
      this.logger.warn(`Failed to save cache: ${error.message}`);
    }
  }
}
