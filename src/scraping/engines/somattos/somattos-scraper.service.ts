import { Injectable } from '@nestjs/common';
import { BaseScraper } from '../../core/base-scraper';
import { ScrapingPlatformFactory } from '../../core/scraping-platform.factory';
import { RetryService } from '../../core/retry.service';
import { SomattosParserService } from './somattos-parser.service';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { ScrapingPlatformOptions } from '../../interfaces/scraper-config.interface';

/**
 * Scraper implementation for Somattos platform
 * Handles scraping of kondo data from somattos.com.br
 */
@Injectable()
export class SomattosScraperService extends BaseScraper {
  platform = 'somattos';

  constructor(
    platformFactory: ScrapingPlatformFactory,
    retryService: RetryService,
    private readonly somattosParser: SomattosParserService,
  ) {
    super(platformFactory, retryService);
  }

  /**
   * Get platform configuration for Somattos
   */
  protected getScrapingOptions(): ScrapingPlatformOptions {
    return {
      dynamic: true,        // Enable JavaScript rendering for dynamic content
      premium: false,       // Use standard proxy pool
      country: 'br',        // Target Brazilian servers
    };
  }

  /**
   * Parse Somattos HTML content
   */
  protected async parseHtml(html: string): Promise<Partial<ScrapedKondoDto>> {
    return this.somattosParser.parse(html);
  }

  /**
   * Extract media URLs from Somattos page
   */
  protected async extractMediaUrls(html: string, url: string): Promise<string[]> {
    return this.somattosParser.extractMediaUrls(html);
  }
}
