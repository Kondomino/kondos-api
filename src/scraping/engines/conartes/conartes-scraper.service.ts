import { Injectable } from '@nestjs/common';
import { BaseScraper } from '../../core/base-scraper';
import { ScrapingDogService } from '../../core/scrapingdog.service';
import { RetryService } from '../../core/retry.service';
import { ConartesParserService } from './conartes-parser.service';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { ScrapingDogOptions } from '../../interfaces/scraper-config.interface';
import { CONARTES_CONFIG } from './conartes.config';

@Injectable()
export class ConartesScraperService extends BaseScraper {
  platform = 'conartes';

  constructor(
    scrapingDogService: ScrapingDogService,
    retryService: RetryService,
    private readonly conartesParser: ConartesParserService,
  ) {
    super(scrapingDogService, retryService);
  }

  protected getScrapingOptions(): ScrapingDogOptions {
    return CONARTES_CONFIG.scrapingOptions;
  }

  protected async parseHtml(html: string): Promise<Partial<ScrapedKondoDto>> {
    return this.conartesParser.parse(html);
  }

  protected async extractMediaUrls(html: string): Promise<string[]> {
    return this.conartesParser.extractMediaUrls(html);
  }
}
