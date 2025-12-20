import { Logger } from '@nestjs/common';
import { ScrapingPlatformFactory } from './scraping-platform.factory';
import { RetryService } from './retry.service';
import { ScrapedKondoDto } from '../dto/scraped-kondo.dto';
import { ScrapingPlatformOptions } from '../interfaces/scraper-config.interface';
import { IScraperEngine } from '../interfaces/scraper-engine.interface';
import { IScrapingPlatform } from '../interfaces/scraping-platform.interface';

/**
 * Abstract base class for all platform-specific scrapers
 * Provides common scraping logic with retry handling
 * Now uses factory pattern to support multiple scraping platforms (ScrapingDog, Scrapfly)
 */
export abstract class BaseScraper implements IScraperEngine {
  protected readonly logger: Logger;
  protected readonly platformService: IScrapingPlatform;

  /**
   * Platform identifier (must be implemented by subclasses)
   */
  abstract platform: string;

  constructor(
    protected readonly platformFactory: ScrapingPlatformFactory,
    protected readonly retryService: RetryService,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.platformService = platformFactory.getPlatformService();
  }

  /**
   * Main scraping flow with retry logic
   * @param url - URL to scrape
   * @returns Scraped kondo data with media URLs
   */
  async scrape(url: string): Promise<ScrapedKondoDto> {
    this.logger.log(`Starting scrape for: ${url}`);

    return this.retryService.withRetry(async () => {
      // 1. Fetch HTML via platform service (ScrapingDog or Scrapfly)
      const platformResponse = await this.platformService.fetchHtml(
        url,
        this.getScrapingOptions()
      );

      const { html, metadata } = platformResponse;

      // Log platform response metadata
      this.logger.debug(`Platform response: ${JSON.stringify(metadata)}`);

      // 2. Parse HTML (platform-specific)
      const kondoData = await this.parseHtml(html);

      // 3. Extract media URLs (pass URL for relative path resolution)
      const mediaUrls = await this.extractMediaUrls(html, url);

      
      this.logger.log(`[BASE SCRAPPER] Extracted ${mediaUrls.length} media URLs`);

      // 4. Build result with platform metadata
      const result: ScrapedKondoDto = {
        ...kondoData,
        medias: mediaUrls,
        scrapedAt: new Date(),
        sourceUrl: url,
        platformMetadata: metadata,
      };

      this.logger.log(`Successfully scraped: ${kondoData.name || 'Unknown'}`);
      return result;
    });
  }

  /**
   * Parse HTML content to extract Kondo entity fields
   * @param html - Raw HTML content
   * @returns Partial Kondo data
   */
  protected abstract parseHtml(html: string): Promise<Partial<ScrapedKondoDto>>;

  /**
   * Extract media URLs (images, videos) from HTML
   * @param html - Raw HTML content
   * @param url - Source URL for resolving relative paths
   * @returns Array of media URLs
   */
  protected abstract extractMediaUrls(html: string, url: string): Promise<string[]>;

  /**
   * Get platform-agnostic scraping options
   * @returns Platform configuration (dynamic, premium, country, etc.)
   */
  protected abstract getScrapingOptions(): ScrapingPlatformOptions;
}
