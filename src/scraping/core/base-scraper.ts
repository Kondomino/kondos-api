import { Logger } from '@nestjs/common';
import { ScrapingDogService } from './scrapingdog.service';
import { RetryService } from './retry.service';
import { ScrapedKondoDto } from '../dto/scraped-kondo.dto';
import { ScrapingDogOptions } from '../interfaces/scraper-config.interface';
import { IScraperEngine } from '../interfaces/scraper-engine.interface';

/**
 * Abstract base class for all platform-specific scrapers
 * Provides common scraping logic with retry handling
 */
export abstract class BaseScraper implements IScraperEngine {
  protected readonly logger: Logger;

  /**
   * Platform identifier (must be implemented by subclasses)
   */
  abstract platform: string;

  constructor(
    protected readonly scrapingDogService: ScrapingDogService,
    protected readonly retryService: RetryService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Main scraping flow with retry logic
   * @param url - URL to scrape
   * @returns Scraped kondo data with media URLs
   */
  async scrape(url: string): Promise<ScrapedKondoDto> {
    this.logger.log(`Starting scrape for: ${url}`);

    return this.retryService.withRetry(async () => {
      // 1. Fetch HTML via ScrapingDog
      const html = await this.scrapingDogService.fetchHtml(
        url,
        this.getScrapingOptions()
      );

      // 2. Parse HTML (platform-specific)
      const kondoData = await this.parseHtml(html);

      // 3. Extract media URLs
      const mediaUrls = await this.extractMediaUrls(html);

      // 4. Build result
      const result: ScrapedKondoDto = {
        ...kondoData,
        medias: mediaUrls,
        scrapedAt: new Date(),
        sourceUrl: url,
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
   * @returns Array of media URLs
   */
  protected abstract extractMediaUrls(html: string): Promise<string[]>;

  /**
   * Get platform-specific ScrapingDog options
   * @returns ScrapingDog configuration
   */
  protected abstract getScrapingOptions(): ScrapingDogOptions;
}
