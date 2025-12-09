import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { ScrapingService } from './scraping.service';
import { ScrapeCommand } from './scraping.command';

// Core services
import { ScrapingDogService } from './core/scrapingdog.service';
import { RetryService } from './core/retry.service';

// Somattos engine
import { SomattosScraperService } from './engines/somattos/somattos-scraper.service';
import { SomattosParserService } from './engines/somattos/somattos-parser.service';

// Providers
import { kondoProviders } from '../kondo/repository/kondo.provider';

/**
 * Scraping module
 * Provides web scraping functionality for external real estate platforms
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  providers: [
    // Core services
    ScrapingDogService,
    RetryService,

    // Somattos engine
    SomattosParserService,
    SomattosScraperService,

    // Main orchestration
    ScrapingService,

    // CLI command
    ScrapeCommand,

    // Repository providers
    ...kondoProviders,
  ],
  exports: [
    ScrapingService,
    ScrapingDogService,
  ],
})
export class ScrapingModule {}
