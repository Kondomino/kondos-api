import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from '../../core/base-scraper';
import { ScrapingPlatformFactory } from '../../core/scraping-platform.factory';
import { RetryService } from '../../core/retry.service';
import { ScrapingPlatformOptions } from '../../interfaces/scraper-config.interface';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { ScrapingFileLogger } from '../../logger/scraping-file-logger';
import { GenericParserService } from './generic-parser.service';
import { GenericHeuristicsService } from './generic-heuristics.service';
import { GENERIC_SCRAPING_OPTIONS } from './generic.config';

/**
 * Scraper for generic/unknown real estate platforms
 * Serves as fallback when URL doesn't match specific engine patterns
 * Uses heuristics for quality filtering
 */
@Injectable()
export class GenericScraperService extends BaseScraper {
  platform = 'generic';

  constructor(
    platformFactory: ScrapingPlatformFactory,
    retryService: RetryService,
    private readonly parser: GenericParserService,
    private readonly heuristics: GenericHeuristicsService,
    private readonly fileLogger: ScrapingFileLogger,
  ) {
    super(platformFactory, retryService);
  }

  /**
   * Get platform configuration
   */
  protected getScrapingOptions(): ScrapingPlatformOptions {
    return {
      dynamic: GENERIC_SCRAPING_OPTIONS.dynamic,
      premium: GENERIC_SCRAPING_OPTIONS.premium,
      country: GENERIC_SCRAPING_OPTIONS.country,
    };
  }

  /**
   * Parse HTML to extract kondo data
   */
  protected async parseHtml(html: string): Promise<Partial<ScrapedKondoDto>> {
    this.logger.debug('[GENERIC-PARSER] Extracting fields...');

    const parsed = this.parser.parse(html);

    const fieldCount = Object.keys(parsed).filter((k) => parsed[k]).length;
    this.logger.log(`[GENERIC-PARSER] Extracted ${fieldCount} fields`);
    this.fileLogger.debug(
      `Extracted ${fieldCount} fields from generic site`,
      'GenericParser'
    );

    return parsed;
  }

  /**
   * Extract media URLs from HTML
   * Applies heuristics for deduplication, placeholder removal, sorting
   */
  protected async extractMediaUrls(html: string, url: string): Promise<string[]> {
    this.logger.debug('[GENERIC-SCRAPER] Extracting media URLs...');

    const rawUrls = this.parser.extractMediaUrls(html);
    this.logger.debug(
      `[GENERIC-SCRAPER] Found ${rawUrls.length} raw media URLs`
    );
    this.fileLogger.debug(
      `Found ${rawUrls.length} raw media URLs`,
      'GenericScraper'
    );

    // Apply heuristics
    return this.applyMediaHeuristics(rawUrls, html);
  }

  /**
   * Apply heuristics to media URLs:
   * - Deduplicate (hash-based)
   * - Remove placeholders (size/name check)
   * - Sort by relevance score
   * - Detect pagination
   */
  private async applyMediaHeuristics(
    urls: string[],
    html: string
  ): Promise<string[]> {
    const $ = cheerio.load(html);
    const filtered: string[] = [];
    const imageHashes: string[] = [];

    this.logger.debug(
      `[GENERIC-HEURISTICS] Processing ${urls.length} media URLs...`
    );
    this.fileLogger.debug(
      `Processing ${urls.length} media URLs for heuristics`,
      'GenericHeuristics'
    );

    for (const url of urls) {
      // 1. Detect placeholder
      const placeholderCheck = this.heuristics.detectPlaceholder(url);
      if (placeholderCheck.isPlaceholder) {
        this.logger.debug(
          `[GENERIC-HEURISTICS] Skipped placeholder: ${placeholderCheck.reason}`
        );
        this.fileLogger.debug(
          `Skipped placeholder: ${url}`,
          'GenericHeuristics'
        );
        continue;
      }

      // 2. Detect duplicate
      const dupCheck = await this.heuristics.detectDuplicate(url, imageHashes);
      if (dupCheck.isDuplicate) {
        this.logger.debug(`[GENERIC-HEURISTICS] Skipped duplicate: ${url}`);
        this.fileLogger.debug(`Skipped duplicate image`, 'GenericHeuristics');
        continue;
      }

      if (dupCheck.hash) {
        imageHashes.push(dupCheck.hash);
      }

      // Pass filter
      filtered.push(url);
    }

    // 3. Sort by relevance
    const sourceUrl = this.getCurrentUrl();
    const domain = this.extractDomain(sourceUrl);
    const sorted = await this.heuristics.sortMediaByRelevance(filtered, domain);

    // 4. Detect pagination
    const paginationInfo = this.heuristics.detectPagination($, sourceUrl);
    if (paginationInfo.hasPagination) {
      this.fileLogger.debug(
        `Pagination detected (type: ${paginationInfo.type})`,
        'GenericHeuristics'
      );
    }

    const skipped = urls.length - sorted.length;
    this.logger.log(
      `[GENERIC-SCRAPER] Final media count: ${sorted.length} (${skipped} filtered)`
    );
    this.fileLogger.info(
      `Extracted ${sorted.length} media URLs after heuristics (${skipped} filtered)`,
      'GenericScraper'
    );

    return sorted;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url?: string): string {
    if (!url) {
      return '';
    }

    try {
      return new URL(url).hostname;
    } catch (error) {
      return '';
    }
  }

  /**
   * Get the current URL being scraped (stored during scrape flow)
   */
  private getCurrentUrl(): string {
    // This would be set by BaseScraper or passed through context
    // For now, return empty string (domain extraction will use fallback)
    return '';
  }
}
