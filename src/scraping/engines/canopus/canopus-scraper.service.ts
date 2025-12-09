import { Injectable } from '@nestjs/common';
import { BaseScraper } from '../../core/base-scraper';
import { ScrapingDogService } from '../../core/scrapingdog.service';
import { RetryService } from '../../core/retry.service';
import { CanopusParserService } from './canopus-parser.service';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { ScrapingDogOptions } from '../../interfaces/scraper-config.interface';
import { CANOPUS_CONFIG } from './canopus.config';

@Injectable()
export class CanopusScraperService extends BaseScraper {
  platform = 'canopus';

  constructor(
    scrapingDogService: ScrapingDogService,
    retryService: RetryService,
    private readonly canopusParser: CanopusParserService,
  ) {
    super(scrapingDogService, retryService);
  }

  protected getScrapingOptions(): ScrapingDogOptions {
    return CANOPUS_CONFIG.scrapingOptions;
  }

  protected async parseHtml(html: string): Promise<Partial<ScrapedKondoDto>> {
    return this.canopusParser.parse(html);
  }

  protected async extractMediaUrls(html: string): Promise<string[]> {
    return this.canopusParser.extractMediaUrls(html);
  }
}
