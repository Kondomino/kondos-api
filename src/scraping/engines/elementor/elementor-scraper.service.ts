import { Injectable } from '@nestjs/common';
import { BaseScraper } from '../../core/base-scraper';
import { ScrapingPlatformFactory } from '../../core/scraping-platform.factory';
import { RetryService } from '../../core/retry.service';
import { ElementorParserService } from './elementor-parser.service';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { ScrapingPlatformOptions } from '../../interfaces/scraper-config.interface';
import { ELEMENTOR_CONFIG } from './elementor.config';

/**
 * Scraper for Elementor (WordPress) websites
 * Extends BaseScraper to use platform factory for ScrapingDog or Scrapfly
 */
@Injectable()
export class ElementorScraperService extends BaseScraper {
  platform = 'elementor';

  constructor(
    platformFactory: ScrapingPlatformFactory,
    retryService: RetryService,
    private readonly parserService: ElementorParserService,
  ) {
    super(platformFactory, retryService);
  }

  protected getScrapingOptions(): ScrapingPlatformOptions {
    return ELEMENTOR_CONFIG.scrapingOptions;
  }

  protected async parseHtml(html: string): Promise<Partial<ScrapedKondoDto>> {
    return this.parserService.parse(html);
  }

  protected async extractMediaUrls(html: string, url: string): Promise<string[]> {
    const imageUrls = this.parserService.extractMediaUrls(html, url);
    const videoUrls = this.parserService.extractVideoUrls(html, url);
    return [...imageUrls, ...videoUrls];
  }
}
