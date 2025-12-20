import { Inject, Injectable, Logger } from '@nestjs/common';
import { ScrapflyService } from './scrapfly.service';
import { IScrapingPlatform } from '../interfaces/scraping-platform.interface';
import { ScrapingConfig } from '../../config/scraping.config';
import { ScrapingDogService } from './scrapingdog.service';

/**
 * Factory for creating the appropriate scraping platform service
 * based on global configuration (ScrapingDog or Scrapfly)
 */
@Injectable()
export class ScrapingPlatformFactory {
  private readonly logger = new Logger(ScrapingPlatformFactory.name);

  constructor(
    @Inject('SCRAPING_CONFIG') private readonly scrapingConfig: ScrapingConfig,
    private readonly scrapingDogService: ScrapingDogService,
    private readonly scrapflyService: ScrapflyService,
  ) {}

  /**
   * Get the configured scraping platform service
   * @returns Platform service instance (ScrapingDog or Scrapfly)
   */
  getPlatformService(): IScrapingPlatform {
    const provider = this.scrapingConfig.platform?.provider || 'scrapingdog';

    this.logger.debug(`Using scraping platform: ${provider}`);

    switch (provider) {
      case 'scrapfly':
        if (!this.scrapflyService.isConfigured()) {
          this.logger.warn('Scrapfly not configured, falling back to ScrapingDog');
          return this.scrapingDogService;
        }
        return this.scrapflyService;

      case 'scrapingdog':
      default:
        if (!this.scrapingDogService.isConfigured()) {
          this.logger.error('ScrapingDog not configured - scraping will fail');
        }
        return this.scrapingDogService;
    }
  }
}
