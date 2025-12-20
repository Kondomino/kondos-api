import { Injectable } from '@nestjs/common';
import { BaseScraper } from '../../core/base-scraper';
import { ScrapingPlatformFactory } from '../../core/scraping-platform.factory';
import { RetryService } from '../../core/retry.service';
import { ConartesParserService } from './conartes-parser.service';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { ScrapingPlatformOptions } from '../../interfaces/scraper-config.interface';
import { CONARTES_CONFIG } from './conartes.config';

@Injectable()
export class ConartesScraperService extends BaseScraper {
  platform = 'conartes';

  constructor(
    platformFactory: ScrapingPlatformFactory,
    retryService: RetryService,
    private readonly conartesParser: ConartesParserService,
  ) {
    super(platformFactory, retryService);
  }

  protected getScrapingOptions(): ScrapingPlatformOptions {
    return CONARTES_CONFIG.scrapingOptions;
  }

  protected async parseHtml(html: string): Promise<Partial<ScrapedKondoDto>> {
    return this.conartesParser.parse(html);
  }

  protected async extractMediaUrls(html: string, url: string): Promise<string[]> {
    return this.conartesParser.extractMediaUrls(html);
  }
}
