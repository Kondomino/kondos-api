import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { SlugifyModule } from '../utils/slugify/slugify.module';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { ScrapeCommand, ScrapeTestCommand } from './scraping.command';
import { ScrapingFileLogger } from './logger/scraping-file-logger';

// Core services
import { ScrapingDogService } from './core/scrapingdog.service';
import { ScrapflyService } from './core/scrapfly.service';
import { ScrapingPlatformFactory } from './core/scraping-platform.factory';
import { RetryService } from './core/retry.service';
import { MediaRelevanceScorerService } from './core/media-relevance-scorer.service';
import { MediaDimensionExtractorService } from './core/media-dimension-extractor.service';
import { MediaDimensionValidatorService } from './core/media-dimension-validator.service';
import { MediaDownloadService } from './core/media-download.service';
import { DataQualityValidatorService } from './core/data-quality-validator.service';
import { DataMergeService } from './core/data-merge.service';
import { SPADetectorService } from './core/spa-detector.service';
import { ManualDataExtractorService } from './core/manual-data-extractor.service';
import { StructuredMediaExtractorService } from './core/structured-media-extractor.service';

// Storage
import { StorageStreamCdnService } from '../storage/services/storage-stream-cdn.service';

// Somattos engine
import { SomattosScraperService } from './engines/somattos/somattos-scraper.service';
import { SomattosParserService } from './engines/somattos/somattos-parser.service';

// Conartes engine
import { ConartesScraperService } from './engines/conartes/conartes-scraper.service';
import { ConartesParserService } from './engines/conartes/conartes-parser.service';

// Canopus engine
import { CanopusScraperService } from './engines/canopus/canopus-scraper.service';
import { CanopusParserService } from './engines/canopus/canopus-parser.service';

// Elementor engine
import { ElementorScraperService } from './engines/elementor/elementor-scraper.service';
import { ElementorParserService } from './engines/elementor/elementor-parser.service';

// Generic fallback engine
import { GenericScraperService } from './engines/generic/generic-scraper.service';
import { GenericParserService } from './engines/generic/generic-parser.service';
import { GenericHeuristicsService } from './engines/generic/generic-heuristics.service';

// Generic CDN transformers
import { WixUrlTransformerService } from './engines/generic/transformers/wix-url-transformer.service';
import { ImgixUrlTransformerService } from './engines/generic/transformers/imgix-url-transformer.service';

// Utils
import { PlatformDetectorService } from './utils/platform-detector.service';

// Providers
import { kondoProviders } from '../kondo/repository/kondo.provider';

/**
 * Scraping module
 * Provides web scraping functionality for external real estate platforms
 */
@Module({
  imports: [
    NestConfigModule,
    ConfigModule,
    DatabaseModule,
    SlugifyModule,
  ],
  controllers: [
    ScrapingController,
  ],
  providers: [
    // Logger
    ScrapingFileLogger,

    // Core services
    ScrapingDogService,
    ScrapflyService,
    ScrapingPlatformFactory,
    RetryService,
    MediaRelevanceScorerService,
    MediaDimensionExtractorService,
    MediaDimensionValidatorService,
    MediaDownloadService,
    DataQualityValidatorService,
    DataMergeService,
    StorageStreamCdnService,
    SPADetectorService,
    ManualDataExtractorService,
    StructuredMediaExtractorService,

    // Somattos engine
    SomattosParserService,
    SomattosScraperService,

    // Conartes engine
    ConartesParserService,
    ConartesScraperService,

    // Canopus engine
    CanopusParserService,
    CanopusScraperService,

    // Elementor engine
    ElementorParserService,
    ElementorScraperService,

    // Generic fallback engine
    GenericParserService,
    GenericHeuristicsService,
    GenericScraperService,
    
    // Generic CDN transformers
    WixUrlTransformerService,
    ImgixUrlTransformerService,

    // Utils
    PlatformDetectorService,

    // Main orchestration
    ScrapingService,

    // CLI command
    ScrapeCommand,
    ScrapeTestCommand,

    // Repository providers
    ...kondoProviders,
  ],
  exports: [
    ScrapingService,
    ScrapingDogService,
    ScrapflyService,
    ScrapingPlatformFactory,
  ],
})
export class ScrapingModule {}
