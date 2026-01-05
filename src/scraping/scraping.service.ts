import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Kondo, KondoStatus } from '../kondo/entities/kondo.entity';
import { Media } from '../media/entities/media.entity';
import { KONDO_REPOSITORY_PROVIDER } from '../core/constants';
import { SomattosScraperService } from './engines/somattos/somattos-scraper.service';
import { isSomattosUrl } from './engines/somattos/somattos.config';
import { ConartesScraperService } from './engines/conartes/conartes-scraper.service';
import { isConartesUrl } from './engines/conartes/conartes.config';
import { CanopusScraperService } from './engines/canopus/canopus-scraper.service';
import { isCanopusUrl } from './engines/canopus/canopus.config';
import { ElementorScraperService } from './engines/elementor/elementor-scraper.service';
import { GenericScraperService } from './engines/generic/generic-scraper.service';
import { PlatformDetectorService } from './utils/platform-detector.service';
import { ScrapeResult, ScrapeError } from './dto/scraping-result.dto';
import { ScrapeOptions } from './interfaces/scraper-config.interface';
import { ScrapedKondoDto } from './dto/scraped-kondo.dto';
import { MediaRelevanceScorerService } from './core/media-relevance-scorer.service';
import { MediaDimensionExtractorService } from './core/media-dimension-extractor.service';
import { MediaDimensionValidatorService } from './core/media-dimension-validator.service';
import { MediaDownloadService } from './core/media-download.service';
import { ScrapingConfig } from '../config/scraping.config';
import { ScrapingFileLogger } from './logger/scraping-file-logger';
import { SlugifyService } from '../utils/slugify/slugify.service';
import { DataQualityValidatorService } from './core/data-quality-validator.service';
import { DataMergeService } from './core/data-merge.service';
import { ScrapeKondoRequestDto } from './dto/scrape-kondo-request.dto';
import { ScrapeKondoResponseDto, MediaStats } from './dto/scrape-kondo-response.dto';

/**
 * Scored media record for featured image selection
 */
interface ScoredMediaRecord {
  mediaRecord: any;
  score: number;
  filename: string;
}

/**
 * Main orchestration service for scraping operations
 * Coordinates finding kondos, delegating to platform-specific scrapers, and saving results
 */
@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly delayBetweenRequestsMs: number;

  constructor(
    @Inject(KONDO_REPOSITORY_PROVIDER)
    private readonly kondoRepository: typeof Kondo,
    private readonly somattosScraperService: SomattosScraperService,
    private readonly conartesScraperService: ConartesScraperService,
    private readonly canopusScraperService: CanopusScraperService,
    private readonly elementorScraperService: ElementorScraperService,
    private readonly genericScraperService: GenericScraperService,
    private readonly platformDetector: PlatformDetectorService,
    @Inject('SCRAPING_CONFIG') private readonly scrapingConfig: ScrapingConfig,
    private readonly mediaScorer: MediaRelevanceScorerService,
    private readonly mediaDimensionExtractor: MediaDimensionExtractorService,
    private readonly mediaDimensionValidator: MediaDimensionValidatorService,
    private readonly mediaDownloader: MediaDownloadService,
    private readonly fileLogger: ScrapingFileLogger,
    private readonly slugifyService: SlugifyService,
    private readonly qualityValidator: DataQualityValidatorService,
    private readonly dataMerge: DataMergeService,
    // Add other platform scrapers here as they are implemented
  ) {
    this.delayBetweenRequestsMs = this.scrapingConfig.delay?.betweenRequestsMs ?? 4000;
    this.fileLogger.info(`ScrapingService initialized with delay: ${this.delayBetweenRequestsMs}ms`, 'ScrapingService');
  }

  /**
   * Scrape all kondos with status = 'scraping'
   * @param options - Optional filters and configuration
   * @returns Summary of scraping results
   */
  async scrapeAllPending(options?: ScrapeOptions): Promise<ScrapeResult> {
    this.logger.log('🚀 Starting scraping process...');
    this.logger.log(`Options: platform=${options?.platform}, kondoId=${options?.kondoId}, dryRun=${options?.dryRun}, verbose=${options?.verbose}`);

    const whereClause: any = {
      status: KondoStatus.SCRAPING,
    };

    if (options?.kondoId) {
      whereClause.id = options.kondoId;
      this.logger.log(`Filtering by kondo ID: ${options.kondoId}`);
    }

    this.logger.log(`Querying kondos with status='SCRAPING'...`);
    const kondos = await this.kondoRepository.findAll({
      where: whereClause,
    });

    this.logger.log(`✅ Found ${kondos.length} kondos to scrape`);

    if (kondos.length === 0) {
      this.logger.warn('⚠️  No kondos found with status=SCRAPING. Nothing to do.');
      return {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
      };
    }

    const result: ScrapeResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      totalFieldsChanged: 0,
      totalProtectedIgnored: 0,
    };

    for (const kondo of kondos) {
      try {
        await this.scrapeKondo(kondo, options, result);
      } catch (error) {
        this.logger.error(`Unexpected error scraping kondo ${kondo.id}: ${error.message}`);
        result.failed++;
        result.errors.push({
          kondoId: kondo.id,
          error: error.message,
          url: kondo.url,
        });
      }
    }

    this.logSummary(result);
    return result;
  }

  /**
   * Scrape a single random kondo with status = 'scraping'
   * Useful for quick green-flow checks
   */
  async scrapeRandomPending(options?: ScrapeOptions): Promise<ScrapeResult> {
    this.logger.log('🎲 Selecting one random kondo with status=SCRAPING...');

    const whereClause: any = {
      status: KondoStatus.SCRAPING,
    };

    const sequelizeInstance = this.kondoRepository.sequelize;
    const randomOrder = sequelizeInstance ? [sequelizeInstance.random() as any] : undefined;

    const kondo = await this.kondoRepository.findOne({
      where: whereClause,
      order: randomOrder,
    });

    if (!kondo) {
      this.logger.warn('⚠️  No kondos found with status=SCRAPING. Nothing to do.');
      return {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
      };
    }

    const result: ScrapeResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      totalFieldsChanged: 0,
      totalProtectedIgnored: 0,
    };

    await this.scrapeKondo(kondo, { ...options, skipDelay: options?.skipDelay ?? true }, result);

    this.logSummary(result);
    return result;
  }

  /**
   * Scrape a single kondo by ID (API method)
   * Uses smart merging with data quality validation
   * 
   * @param kondoId - ID of kondo to scrape
   * @param options - Scraping options
   * @returns Detailed scraping response
   */
  async scrapeKondoById(
    kondoId: number,
    options?: ScrapeKondoRequestDto,
  ): Promise<ScrapeKondoResponseDto> {
    this.logger.log(`🔍 Scraping kondo ${kondoId} via API...`);

    // Fetch kondo from database
    const kondo = await this.kondoRepository.findOne({
      where: { id: kondoId },
    });

    if (!kondo) {
      throw new NotFoundException(`Kondo with ID ${kondoId} not found`);
    }

    // Validate URL
    if (!kondo.url) {
      return {
        success: false,
        kondoId,
        error: 'Kondo has no URL to scrape',
      };
    }

    try {
      // Determine platform and get scraper
      const scraper = await this.getScraper(kondo.url, options?.forceEngine);
      const platform = scraper.constructor.name.replace('ScraperService', '');
      
      this.logger.log(`   Platform: ${platform}`);
      this.logger.log(`   URL: ${kondo.url}`);

      // Scrape data
      const scrapedData = await scraper.scrape(kondo.url);
      this.logger.log(`   ✓ Extracted ${scrapedData.medias?.length || 0} media URLs`);

      // Validate scraped data quality
      const validation = this.qualityValidator.validateScrapedData(scrapedData);
      if (validation.warnings.length > 0) {
        this.logger.warn(`   ⚠️ Validation warnings: ${validation.warnings.length}`);
        validation.warnings.forEach((w) => this.logger.warn(`     - ${w}`));
      }
      if (!validation.valid) {
        this.logger.error(`   ❌ Validation failed: ${validation.issues.length} issues`);
        validation.issues.forEach((i) => this.logger.error(`     - ${i}`));
      }

      // Process and save (unless dry run)
      let stats: ScrapeKondoResponseDto['stats'];
      let updatedFields: string[] = [];
      let rejections: any[] = [];
      let changes: any = {};
      let mediaStats: MediaStats | undefined;
      let featuredImage: string | undefined;

      if (!options?.dryRun) {
        const saveResult = await this.saveScrapedDataWithMerge(kondoId, scrapedData);
        
        stats = {
          fieldsUpdated: saveResult.fieldsUpdated,
          protectedSkipped: saveResult.protectedSkipped,
          qualityRejected: saveResult.qualityRejected,
          mediaUploaded: saveResult.mediaCount,
          media: saveResult.mediaStats,
        };
        
        updatedFields = saveResult.updatedFields;
        rejections = saveResult.rejections;
        changes = options?.verbose ? saveResult.changes : undefined;
        mediaStats = saveResult.mediaStats;
        featuredImage = saveResult.featuredImage;

        this.logger.log(`   ✓ Updated ${stats.fieldsUpdated} fields`);
        this.logger.log(`   ✓ Saved ${stats.mediaUploaded} media files`);
        if (stats.qualityRejected > 0) {
          this.logger.warn(`   ⚠️  Rejected ${stats.qualityRejected} fields (quality issues)`);
        }
        if (featuredImage) {
          this.logger.log(`   ✓ Featured image: ${featuredImage}`);
        }
      } else {
        this.logger.log(`   ℹ️  Dry run - no data saved`);
      }

      return {
        success: true,
        kondoId,
        platform,
        stats,
        updatedFields,
        changes,
        rejections: rejections.length > 0 ? rejections : undefined,
        validationIssues: validation.issues.length > 0 ? validation.issues : undefined,
        validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        featuredImage,
        dryRun: options?.dryRun,
      };
    } catch (error) {
      this.logger.error(`❌ Scraping failed: ${error.message}`);
      this.fileLogger.error(`API scraping failed for kondo ${kondoId}`, 'ScrapingService', error);
      
      throw error;
    }
  }


  /**
   * Scrape a single kondo
   */
  private async scrapeKondo(
    kondo: Kondo,
    options: ScrapeOptions,
    result: ScrapeResult,
  ): Promise<void> {
    // Validate URL
    if (!kondo.url) {
      this.logger.warn(`⚠️  Kondo ${kondo.id} (${kondo.name}) has no URL, skipping...`);
      result.skipped++;
      return;
    }

    this.logger.log(`\n🔍 [${result.success + result.failed + 1}] Scraping: ${kondo.name} (ID: ${kondo.id})`);
    this.logger.log(`   Status: ${kondo.status}`);
    this.logger.log(`   URL: ${kondo.url}`);

    try {
      // Determine platform and get appropriate scraper
      this.logger.debug(`   Selecting scraper...`);
      const scraper = await this.getScraper(kondo.url, options?.platform);
      this.logger.log(`   Platform: ${scraper.constructor.name.replace('ScraperService', '')}`);

      // Scrape data
      this.logger.log(`   Fetching and parsing data...`);
      const scrapedData = await scraper.scrape(kondo.url);
      this.logger.log(`   ✓ Extracted ${scrapedData.medias?.length || 0} media URLs`);
      this.logger.debug(`   Scraped ${Object.keys(scrapedData).length} fields`);
      this.fileLogger.info(`Extracted ${scrapedData.medias?.length || 0} media URLs from ${kondo.name}`, 'ScrapingService');

      // Apply delay between requests (unless skipDelay is set)
      if (!options?.skipDelay) {
        await this.applyDelay();
      }

      // Save to database (unless dry run)
      if (!options?.dryRun) {
        this.logger.log(`   Saving to database...`);
        const { mediaCount, fieldsChanged, protectedIgnored } = await this.saveScrapedData(kondo.id, scrapedData);
        this.logger.log(`   ✓ Saved ${mediaCount} media files to cloud`);
        this.logger.log(`   ✓ Updated ${fieldsChanged} fields${protectedIgnored > 0 ? ` (${protectedIgnored} protected fields ignored)` : ''}`);
        this.logger.log(`✅ Success: ${kondo.name}`);
        this.fileLogger.info(`Successfully scraped and saved kondo ${kondo.id}: ${kondo.name} (${mediaCount} media, ${fieldsChanged} fields updated)`, 'ScrapingService');
        
        // Track statistics
        result.totalFieldsChanged = (result.totalFieldsChanged || 0) + fieldsChanged;
        result.totalProtectedIgnored = (result.totalProtectedIgnored || 0) + protectedIgnored;
      } else {
        this.logger.log(`✅ Success (dry-run): ${kondo.name}`);
        this.logger.debug(`   Would save: ${JSON.stringify(scrapedData, null, 2)}`);
      }

      result.success++;

    } catch (error) {
      this.logger.error(`❌ Failed: ${kondo.name} - ${error.message}`);
      if (options?.verbose) {
        this.logger.error(`Stack: ${error.stack}`);
      }
      
      // Log detailed error info to file
      if (error.name === 'SequelizeValidationError' || error.errors) {
        this.fileLogger.logValidationError(kondo.id, kondo.name, error);
      } else {
        this.fileLogger.error(`Failed to scrape kondo ${kondo.id}`, 'ScrapingService', error);
      }
      
      result.failed++;
      result.errors.push({
        kondoId: kondo.id,
        error: error.message,
        url: kondo.url,
      });
    }
  }

  /**
   * Determine which scraper to use based on URL
   */
  private async getScraper(url: string, platformFilter?: string) {
    // If platform filter is specified, validate it matches
    if (platformFilter === 'somattos' || isSomattosUrl(url)) {
      return this.somattosScraperService;
    }

    if (platformFilter === 'conartes' || isConartesUrl(url)) {
      return this.conartesScraperService;
    }

    if (platformFilter === 'canopus' || isCanopusUrl(url)) {
      return this.canopusScraperService;
    }

    // If no URL pattern matched, try HTML-based detection
    try {
      this.logger.log(`[ScrapingService] No URL pattern matched for ${url}, attempting HTML detection...`);
      this.fileLogger.info(`No URL pattern matched, attempting HTML detection for: ${url}`, 'ScrapingService');
      
      const platform = await this.platformDetector.detectPlatform(url);
      
      if (platform === 'elementor') {
        this.logger.log(`[ScrapingService] Detected Elementor platform for: ${url}`);
        this.fileLogger.info(`Detected Elementor platform for: ${url}`, 'ScrapingService');
        return this.elementorScraperService;
      }
      
      if (platform === 'nextjs') {
        this.logger.log(`[ScrapingService] Detected Next.js platform for: ${url}`);
        this.fileLogger.info(`Detected Next.js platform for: ${url}`, 'ScrapingService');
        return this.canopusScraperService;
      }
    } catch (error) {
      this.logger.warn(`[ScrapingService] HTML detection failed for ${url}: ${error.message}`);
      this.fileLogger.warn(`HTML detection failed for ${url}: ${error.message}`, 'ScrapingService');
    }

    // Fallback to generic scraper if detection fails or platform is unknown
    this.logger.log(
      `[ScrapingService] Using generic fallback scraper for: ${url}`
    );
    this.fileLogger.info(`Using generic fallback scraper for: ${url}`, 'ScrapingService');
    return this.genericScraperService;
  }

  /**
   * Apply configured delay between scraping requests
   */
  private async applyDelay(): Promise<void> {
    this.logger.debug(`   Waiting ${this.delayBetweenRequestsMs}ms before next request...`);
    return new Promise((resolve) => setTimeout(resolve, this.delayBetweenRequestsMs));
  }

  /**
   * Save scraped data using smart merge strategy (for API calls)
   * Uses DataMergeService and DataQualityValidator to protect data quality
   * 
   * @returns Detailed save result with statistics
   */
  private async saveScrapedDataWithMerge(
    kondoId: number,
    data: ScrapedKondoDto,
  ): Promise<{
    mediaCount: number;
    fieldsUpdated: number;
    protectedSkipped: number;
    qualityRejected: number;
    updatedFields: string[];
    rejections: any[];
    changes: Record<string, any>;
    mediaStats?: MediaStats;
    featuredImage?: string;
  }> {
    const { medias, scrapedAt, sourceUrl, platformMetadata, extractionMetadata, ...kondoData } = data;

    // Fetch existing kondo
    const existingKondo = await this.kondoRepository.findOne({
      where: { id: kondoId },
    });

    if (!existingKondo) {
      this.logger.error(`   Kondo ${kondoId} not found in database`);
      throw new NotFoundException(`Kondo ${kondoId} not found`);
    }

    // Handle slug: preserve existing, generate if missing
    if (existingKondo.slug) {
      delete kondoData.slug;
      this.logger.debug(`   Preserving existing slug: ${existingKondo.slug}`);
    } else if (!kondoData.slug) {
      kondoData.slug = this.slugifyService.run(existingKondo.name);
      this.logger.debug(`   Generated new slug: ${kondoData.slug}`);
    }

    // Map 'address' to 'address_street_and_numbers'
    if ('address' in kondoData && typeof kondoData.address === 'string') {
      kondoData.address_street_and_numbers = kondoData.address;
      delete kondoData.address;
    }

    // Smart merge with quality validation
    const mergeResult = this.dataMerge.mergeData(
      existingKondo,
      { ...kondoData } as any,
      this.scrapingConfig.protectedFields,
    );

    // Process media (before updating DB)
    let mediaCount = 0;
    let mediaStats: MediaStats | undefined;
    let featuredImage: string | undefined;
    
    if (medias && medias.length > 0) {
      this.logger.log(`   Processing ${medias.length} media URLs...`);
      const { mediaRecords, stats, scoredImages } = await this.filterAndDownloadMedia(
        medias,
        kondoId,
        sourceUrl,
      );

      if (mediaRecords.length > 0) {
        await Media.bulkCreate(mediaRecords);
        mediaCount = mediaRecords.length;
        mediaStats = stats;

        // Auto-select featured image if not set
        if (!existingKondo.featured_image) {
          featuredImage = this.selectFeaturedImage(scoredImages);
          if (featuredImage) {
            mergeResult.updates.featured_image = featuredImage;
            this.logger.log(`   ✓ Featured image set: ${featuredImage}`);
          }
        }
      }

      this.fileLogger.logMediaExtraction(kondoId, existingKondo.name, stats);
    }

    // Calculate changes for logging
    const changes = this.calculateChanges(existingKondo, mergeResult.updates);

    // Add extraction metadata to updates if available
    if (extractionMetadata) {
      if (extractionMetadata.rawData) {
        mergeResult.updates.scraped_raw_data = extractionMetadata.rawData;
      }
      if (extractionMetadata.source) {
        mergeResult.updates.scraped_data_source = extractionMetadata.source;
      }
      if (extractionMetadata.method) {
        mergeResult.updates.scraped_extraction_method = extractionMetadata.method;
      }
      if (extractionMetadata.confidence !== undefined) {
        mergeResult.updates.scraped_extraction_confidence = extractionMetadata.confidence;
      }
      mergeResult.updates.scraped_at = new Date();

      this.logger.debug(
        `   Extraction metadata: method=${extractionMetadata.method}, confidence=${extractionMetadata.confidence?.toFixed(2) || 'N/A'}, source=${extractionMetadata.source || 'N/A'}`
      );
      this.fileLogger.debug(
        `Extraction metadata stored - method: ${extractionMetadata.method}, confidence: ${extractionMetadata.confidence?.toFixed(2) || 'N/A'}, source: ${extractionMetadata.source || 'N/A'}`,
        'ScrapingService'
      );
    }

    // Update database
    if (Object.keys(mergeResult.updates).length > 0) {
      await this.kondoRepository.update(mergeResult.updates, {
        where: { id: kondoId },
      });
    }

    // Log changes
    if (Object.keys(changes).length > 0 || mergeResult.rejected.length > 0) {
      this.fileLogger.logKondoChanges(
        kondoId,
        existingKondo.name,
        changes,
        mergeResult.rejected.map((r) => r.field),
      );
    }

    // Log platform metadata
    if (platformMetadata) {
      this.fileLogger.logPlatformResponse(kondoId, platformMetadata);
    }

    return {
      mediaCount,
      fieldsUpdated: mergeResult.accepted.length,
      protectedSkipped: mergeResult.rejected.filter((r) => r.reason.includes('Protected')).length,
      qualityRejected: mergeResult.rejected.filter((r) => !r.reason.includes('Protected')).length,
      updatedFields: mergeResult.accepted,
      rejections: mergeResult.rejected,
      changes,
      mediaStats,
      featuredImage,
    };
  }

  /**
   * Save scraped data to database (legacy method for CLI)
   * Filters and downloads media before saving
   * Handles slug: preserves existing slug, generates new one if null
   * @returns Object with media count, fields changed count, and protected fields count
   */
  private async saveScrapedData(
    kondoId: number,
    data: ScrapedKondoDto,
  ): Promise<{ mediaCount: number; fieldsChanged: number; protectedIgnored: number }> {
    const { medias, scrapedAt, sourceUrl, platformMetadata, ...kondoData } = data;

    // Fetch existing kondo to calculate changes
    const existingKondo = await this.kondoRepository.findOne({
      where: { id: kondoId },
    });

    if (!existingKondo) {
      this.logger.error(`   Kondo ${kondoId} not found in database`);
      return { mediaCount: 0, fieldsChanged: 0, protectedIgnored: 0 };
    }

    // Handle slug: preserve existing slug, generate new one if null
    if (existingKondo.slug) {
      console.log(`   Existing slug found: ${existingKondo.slug}`);
      // Slug already exists - preserve it by removing from update payload
      delete kondoData.slug;
      this.logger.debug(`   Preserving existing slug: ${existingKondo.slug}`);
    } else if (!kondoData.slug) {
      console.log(`   No slug found, generating from name: ${existingKondo.name}`);
      // No existing slug and no slug in scraped data - generate from name
      kondoData.slug = this.slugifyService.run(existingKondo.name);
      this.logger.debug(`   Generated new slug: ${kondoData.slug}`);
    } else {
      // Slug provided in scraped data and no existing slug - use it
      this.logger.debug(`   Using scraped slug: ${kondoData.slug}`);
    }

    console.log(`   Final slug to save: ${kondoData.slug}`);

    // Map scraped field names to database field names
    // 'address' is a virtual getter in Kondo entity, map to actual DB field
    if ('address' in kondoData && typeof kondoData.address === 'string') {
      kondoData.address_street_and_numbers = kondoData.address;
      delete kondoData.address;
      this.logger.debug(`   Mapped 'address' field to 'address_street_and_numbers'`);
    }

    // Filter out protected fields and track violations
    const { filteredData, ignoredFields } = this.filterProtectedFields(kondoData);

    console.log('B - Filtered data to be saved:', filteredData);
    
    // Process media: filter and download (BEFORE calculating changes and updating DB)
    let mediaCount = 0;
    if (medias && medias.length > 0) {
      this.logger.log(`   Processing ${medias.length} media URLs...`);
      const { mediaRecords, stats, scoredImages } = await this.filterAndDownloadMedia(medias, kondoId, sourceUrl);

      if (mediaRecords.length > 0) {
        await Media.bulkCreate(mediaRecords);
        mediaCount = mediaRecords.length;
        this.logger.debug(`   Created ${mediaCount} media records`);
        
        // Auto-select featured image from best-scoring image (only if not already set)
        if (!existingKondo.featured_image) {
          const featuredImageFilename = this.selectFeaturedImage(scoredImages);
          if (featuredImageFilename) {
            filteredData.featured_image = featuredImageFilename;
            this.logger.log(`   ✓ Featured image set: ${featuredImageFilename}`);
          }
        } else {
          this.logger.debug(`   Featured image already set: ${existingKondo.featured_image} (preserved)`);
        }
      } else {
        this.logger.warn(`   ⚠️  No media passed filtering/download`);
      }

      // Log media extraction statistics to file
      this.fileLogger.logMediaExtraction(kondoId, existingKondo.name, stats);
    } else {
      // Log when no media URLs found
      this.fileLogger.logMediaExtraction(kondoId, existingKondo.name, {
        totalDiscovered: 0,
        imagesDiscovered: 0,
        videosDiscovered: 0,
        imagesUploaded: 0,
        videosDownloaded: 0,
        videosEmbedded: 0,
        totalSaved: 0,
      });
    }

    // Calculate changes (NOW includes featured_image if it was set)
    const changes = this.calculateChanges(existingKondo, filteredData);

    console.log('C - Calculated changes:', changes);

    const fieldsChanged = Object.keys(changes).length;
    const protectedIgnored = ignoredFields.length;

    // Log platform response metadata
    if (platformMetadata) {
      this.fileLogger.logPlatformResponse(kondoId, platformMetadata);
    }

    // Log changes to file
    if (fieldsChanged > 0 || protectedIgnored > 0) {
      this.fileLogger.logKondoChanges(
        kondoId,
        existingKondo.name,
        changes,
        ignoredFields
      );
    }

    // Update Kondo entity (with featured_image included if set)
    await this.kondoRepository.update(filteredData, {
      where: { id: kondoId },
    });

    this.logger.debug(`   Updated kondo ${kondoId}: ${fieldsChanged} fields changed`);
    
    return { mediaCount, fieldsChanged, protectedIgnored };
  }

  /**
   * Filter out protected fields from scraped data (legacy - for CLI)
   * Now supports enhanced protected field config
   * @returns Filtered data and list of ignored fields
   */
  private filterProtectedFields(data: any): { filteredData: any; ignoredFields: string[] } {
    const filteredData = { ...data };
    const ignoredFields: string[] = [];

    console.log('   Protected fields to check:', this.scrapingConfig.protectedFields);

    this.scrapingConfig.protectedFields.forEach((item) => {
      // Handle both string and object format
      const field = typeof item === 'string' ? item : item.field;
      const mode = typeof item === 'string' ? 'never' : item.mode;
      
      // For CLI, only filter 'never' mode fields
      if (mode === 'never' && field in filteredData) {
        ignoredFields.push(field);
        delete filteredData[field];
      }
    });

    if (ignoredFields.length > 0) {
      this.logger.debug(`   Protected fields filtered: ${ignoredFields.join(', ')}`);
    }

    console.log('   Ignored protected fields:', ignoredFields);
    console.log('   Filtered data to be saved:', filteredData);
    return { filteredData, ignoredFields };
  }

  /**
   * Calculate field changes between existing and new data
   * @returns Object with field changes { fieldName: { before, after } }
   */
  private calculateChanges(existingKondo: Kondo, newData: any): Record<string, { before: any; after: any }> {
    const changes: Record<string, { before: any; after: any }> = {};

    Object.keys(newData).forEach((key) => {
      const oldValue = existingKondo[key];
      const newValue = newData[key];

      // Only track actual changes (handle null/undefined as equivalent for comparison)
      const oldNormalized = oldValue === undefined ? null : oldValue;
      const newNormalized = newValue === undefined ? null : newValue;

      if (oldNormalized !== newNormalized) {
        // For objects/arrays, do deep comparison
        if (typeof oldNormalized === 'object' && typeof newNormalized === 'object') {
          if (JSON.stringify(oldNormalized) !== JSON.stringify(newNormalized)) {
            changes[key] = { before: oldValue, after: newValue };
          }
        } else {
          changes[key] = { before: oldValue, after: newValue };
        }
      }
    });

    return changes;
  }

  /**
   * Filter media by relevance/dimensions and download to cloud storage
   * Also tracks scored images for featured image selection
   */
  private async filterAndDownloadMedia(
    mediaUrls: string[],
    kondoId: number,
    propertyUrl?: string,
  ): Promise<{ mediaRecords: any[], stats: any, scoredImages: ScoredMediaRecord[] }> {
    const mediaConfig = this.scrapingConfig.media;
    const mediaRecords = [];
    const scoredImages: ScoredMediaRecord[] = [];
    
    // Track statistics
    const stats = {
      totalDiscovered: mediaUrls.length,
      imagesDiscovered: 0,
      videosDiscovered: 0,
      imagesUploaded: 0,
      videosDownloaded: 0,
      videosEmbedded: 0,
      totalSaved: 0,
    };

    // Count discovered media by type and log all URLs
    this.logger.log(`   [Media] Starting to process ${mediaUrls.length} discovered media URLs...`);
    mediaUrls.forEach((url, index) => {
      const type = this.detectMediaType(url);
      const filename = this.extractFilename(url);
      if (type === 'image') {
        stats.imagesDiscovered++;
      } else if (type === 'video') {
        stats.videosDiscovered++;
        this.logger.log(`   [Media] VIDEO found [${index + 1}/${mediaUrls.length}]: ${filename}`);
      }
    });

    // Process media in parallel batches (3-5 concurrent)
    const batchSize = 4;
    for (let i = 0; i < mediaUrls.length; i += batchSize) {
      const batch = mediaUrls.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((url) => this.processMediaUrl(url, kondoId, propertyUrl, mediaConfig))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          const { record, score } = result.value;
          mediaRecords.push(record);
          
          // Track images with scores for featured image selection
          if (record.type === 'image') {
            scoredImages.push({
              mediaRecord: record,
              score: score,
              filename: record.filename,
            });
            stats.imagesUploaded++;
          } else if (record.type === 'video') {
            // Check if it's embedded or downloaded
            if (this.isEmbeddedVideo(record.storage_url)) {
              stats.videosEmbedded++;
            } else {
              stats.videosDownloaded++;
            }
          }
        }
      }
    }

    stats.totalSaved = mediaRecords.length;

    return { mediaRecords, stats, scoredImages };
  }

  /**
   * Process a single media URL: score, check dimensions, download if passes
   * Returns both the media record and its relevance score for featured image selection
   */
  private async processMediaUrl(
    url: string,
    kondoId: number,
    propertyUrl: string | undefined,
    mediaConfig: any,
  ): Promise<{ record: any; score: number } | null> {
    const filename = this.extractFilename(url);
    try {
      const mediaType = this.detectMediaType(url);
      this.logger.log(`   [Media] Processing: ${filename} (${mediaType})`);

      // Score media for relevance
      const relevanceScore = this.mediaScorer.scoreMediaUrl(url, this.extractDomain(propertyUrl));
      this.logger.debug(`   [Media] Relevance score: ${relevanceScore.toFixed(3)} (threshold: ${mediaConfig.minRelevanceScore})`);

      // IMAGE: check dimensions first
      if (mediaType === 'image') {
        this.logger.debug(`   [Media] Validating image dimensions...`);
        const validation = await this.mediaDimensionValidator.validateImageDimensions(
          url,
          mediaConfig.minImageDimensions.width,
          mediaConfig.minImageDimensions.height
        );

        if (validation.dimensions) {
          this.logger.debug(
            `   [Media] Dimensions: ${validation.dimensions.width}x${validation.dimensions.height} (min: ${mediaConfig.minImageDimensions.width}x${mediaConfig.minImageDimensions.height})`
          );
        }

        // If dimensions >= minimum, auto-approve
        if (validation.valid) {
          this.logger.log(
            `   [Media] ✅ ACCEPTED - ${filename} → Dimensions ${validation.dimensions?.width}x${validation.dimensions?.height} (auto-approved)`
          );
          const record = await this.downloadMediaAndCreateRecord(url, kondoId, mediaConfig);
          return record ? { record, score: relevanceScore } : null;
        }

        // If dimensions check failed, check relevance score as fallback
        if (relevanceScore >= mediaConfig.minRelevanceScore) {
          this.logger.log(`   [Media] ✅ ACCEPTED - ${filename} → Score ${relevanceScore.toFixed(3)} passed (≥${mediaConfig.minRelevanceScore})`);
          const record = await this.downloadMediaAndCreateRecord(url, kondoId, mediaConfig);
          return record ? { record, score: relevanceScore } : null;
        }

        this.logger.warn(
          `   [Media] ❌ REJECTED - ${filename} → ${validation.reason}, score ${relevanceScore.toFixed(3)} < ${mediaConfig.minRelevanceScore}`
        );
        this.fileLogger.debug(
          `Media rejected: ${filename} - ${validation.reason}, score ${relevanceScore.toFixed(3)}`,
          'ScrapingService'
        );
        return null;
      }

      // VIDEO: YouTube/Vimeo stored directly, self-hosted videos downloaded
      if (mediaType === 'video') {
        // Embedded videos (YouTube/Vimeo): store URL directly without download
        if (this.isEmbeddedVideo(url)) {
          this.logger.debug(`   [Media] Detected embedded video (YouTube/Vimeo)`);
          if (relevanceScore >= mediaConfig.minRelevanceScore) {
            this.logger.log(`   [Media] ✅ ACCEPTED - ${filename} → Embedded video score ${relevanceScore.toFixed(3)} (stored as URL)`);
            const record = this.createEmbeddedVideoRecord(url, kondoId);
            return { record, score: relevanceScore };
          }
          this.logger.warn(`   [Media] ❌ REJECTED - ${filename} → Embedded video score ${relevanceScore.toFixed(3)} < ${mediaConfig.minRelevanceScore}`);
          return null;
        }

        // Self-hosted video: download and upload
        this.logger.debug(`   [Media] Self-hosted video detected, will attempt download`);
        if (relevanceScore >= mediaConfig.minRelevanceScore) {
          this.logger.log(`   [Media] ✅ ATTEMPTING - ${filename} → Video score ${relevanceScore.toFixed(3)} (≥${mediaConfig.minRelevanceScore})`);
          const record = await this.downloadMediaAndCreateRecord(url, kondoId, mediaConfig);
          if (!record) {
            this.logger.warn(`   [Media] ❌ DOWNLOAD FAILED - ${filename} → Check logs for details`);
          }
          return record ? { record, score: relevanceScore } : null;
        }

        this.logger.warn(`   [Media] ❌ REJECTED - ${filename} → Video score ${relevanceScore.toFixed(3)} < ${mediaConfig.minRelevanceScore}`);
        return null;
      }

      // OTHER: check relevance score
      if (relevanceScore >= mediaConfig.minRelevanceScore) {
        this.logger.log(`   [Media] ✅ ACCEPTED - ${filename} → Score ${relevanceScore.toFixed(3)} passed`);
        const record = await this.downloadMediaAndCreateRecord(url, kondoId, mediaConfig);
        return record ? { record, score: relevanceScore } : null;
      }

      this.logger.warn(`   [Media] ❌ REJECTED - ${filename} → Score ${relevanceScore.toFixed(3)} < ${mediaConfig.minRelevanceScore}`);
      return null;
    } catch (error) {
      this.logger.error(`   [Media] ❌ ERROR - ${filename}: ${error.message}`);
      this.fileLogger.error(`Media processing error for ${filename}`, 'ScrapingService', error);
      return null;
    }
  }

  /**
   * Download media and create Media record with CDN URL
   */
  private async downloadMediaAndCreateRecord(
    url: string,
    kondoId: number,
    mediaConfig: any,
  ): Promise<any | null> {
    const filename = this.extractFilename(url);
    this.logger.debug(`   [Media] Downloading: ${filename}...`);
    
    const result = await this.mediaDownloader.downloadAndUploadMedia(url, kondoId, {
      minSizeKb: mediaConfig.minFileSizeKb,
      minResolution: mediaConfig.minImageDimensions,
      supportedFormats: mediaConfig.supportedFormats,
    });

    if (result) {
      this.logger.debug(`   [Media] ✓ Upload successful: ${result.filename} → CDN`);
      return {
        kondoId,
        filename: result.filename,
        storage_url: result.cdnUrl, // Store CDN URL, not original
        type: this.detectMediaType(url),
        status: 'final' as const,
      };
    }

    this.logger.warn(`   [Media] Download/upload failed for: ${filename}`);
    this.fileLogger.warn(`Media download failed: ${filename} from ${url}`, 'ScrapingService');

    return null;
  }

  /**
   * Check if URL is an embedded video (YouTube/Vimeo)
   */
  private isEmbeddedVideo(url: string): boolean {
    const urlLower = url.toLowerCase();
    return (
      urlLower.includes('youtube.com') ||
      urlLower.includes('youtu.be') ||
      urlLower.includes('vimeo.com')
    );
  }

  /**
   * Create Media record for embedded video (store URL directly)
   */
  private createEmbeddedVideoRecord(url: string, kondoId: number): any {
    return {
      kondoId,
      filename: this.extractFilename(url),
      storage_url: url, // Store YouTube/Vimeo URL directly
      type: 'video',
      status: 'final' as const,
    };
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url?: string): string | undefined {
    if (!url) return undefined;
    try {
      return new URL(url).hostname;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract filename from URL
   */
  private extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'unknown';
      return filename;
    } catch {
      return `scraped-${Date.now()}`;
    }
  }

  /**
   * Detect media type from URL
   */
  private detectMediaType(url: string): string {
    const urlLower = url.toLowerCase();

    // All video formats accepted
    if (urlLower.match(/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)(\?.*)?$/)) {
      return 'video';
    }

    if (urlLower.includes('youtube') || urlLower.includes('vimeo')) {
      return 'video';
    }

    return 'image';
  }

  /**
   * Select the best-scoring image as featured image
   * Returns filename of best image or null if none available
   */
  private selectFeaturedImage(scoredImages: ScoredMediaRecord[]): string | null {
    if (scoredImages.length === 0) {
      this.logger.debug(`   [Featured] No images available for selection`);
      return null;
    }
    
    // Sort by score descending and select winner
    const sorted = [...scoredImages].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    
    this.logger.log(
      `   [Featured] Selected: ${winner.filename} ` +
      `(score: ${winner.score.toFixed(3)}, ranked #1 of ${scoredImages.length})`
    );
    
    return winner.mediaRecord.filename;
  }

  /**
   * Log scraping summary
   */
  private logSummary(result: ScrapeResult): void {
    this.logger.log('\n' + '='.repeat(50));
    this.logger.log('📊 Scraping Summary');
    this.logger.log('='.repeat(50));
    this.logger.log(`✅ Success:  ${result.success}`);
    this.logger.log(`❌ Failed:   ${result.failed}`);
    this.logger.log(`⏭️  Skipped:  ${result.skipped}`);
    
    if (result.totalFieldsChanged !== undefined && result.success > 0) {
      const avg = (result.totalFieldsChanged / result.success).toFixed(1);
      this.logger.log(`📊 Total fields updated: ${result.totalFieldsChanged} (avg ${avg} per kondo)`);
    }
    
    if (result.totalProtectedIgnored !== undefined && result.totalProtectedIgnored > 0) {
      this.logger.log(`🔒 Protected fields ignored: ${result.totalProtectedIgnored}`);
    }
    
    if (result.errors.length > 0) {
      this.logger.log('\n❌ Errors:');
      result.errors.forEach((error) => {
        this.logger.log(`   Kondo ${error.kondoId}: ${error.error}`);
      });
    }
    
    this.logger.log('='.repeat(50) + '\n');
    
    // Also log to file
    this.fileLogger.logSummary(
      result.success, 
      result.failed, 
      result.skipped, 
      result.errors,
      result.totalFieldsChanged,
      result.totalProtectedIgnored
    );
  }
}
