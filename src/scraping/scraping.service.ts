import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kondo, KondoStatus } from '../kondo/entities/kondo.entity';
import { Media } from '../media/entities/media.entity';
import { KONDO_REPOSITORY_PROVIDER } from '../core/constants';
import { SomattosScraperService } from './engines/somattos/somattos-scraper.service';
import { isSomattosUrl } from './engines/somattos/somattos.config';
import { ScrapeResult, ScrapeError } from './dto/scraping-result.dto';
import { ScrapeOptions } from './interfaces/scraper-config.interface';
import { ScrapedKondoDto } from './dto/scraped-kondo.dto';

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
    private readonly configService: ConfigService,
    // Add other platform scrapers here as they are implemented
  ) {
    this.delayBetweenRequestsMs = this.configService.get<number>('SCRAPING_DELAY_BETWEEN_REQUESTS_MS') || 4000;
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
    this.logger.debug(`   URL: ${kondo.url}`);

    try {
      // Determine platform and get appropriate scraper
      this.logger.debug(`   Selecting scraper...`);
      const scraper = this.getScraper(kondo.url, options?.platform);
      this.logger.debug(`   Scraper selected: ${scraper.constructor.name}`);

      // Scrape data
      this.logger.debug(`   Fetching and parsing data...`);
      const scrapedData = await scraper.scrape(kondo.url);
      this.logger.debug(`   Scraped ${Object.keys(scrapedData).length} fields`);

      // Apply delay between requests (unless skipDelay is set)
      if (!options?.skipDelay) {
        await this.applyDelay();
      }

      // Save to database (unless dry run)
      if (!options?.dryRun) {
        this.logger.debug(`   Saving to database...`);
        await this.saveScrapedData(kondo.id, scrapedData);
        this.logger.log(`✅ Success: ${kondo.name}`);
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
  private getScraper(url: string, platformFilter?: string) {
    // If platform filter is specified, validate it matches
    if (platformFilter === 'somattos' || isSomattosUrl(url)) {
      return this.somattosScraperService;
    }

    // Add more platform detection here
    // if (is5AndarUrl(url)) return this.andarScraperService;

    throw new Error(`No scraper found for URL: ${url}`);
  }

  /**
   * Apply configured delay between scraping requests
   */
  private async applyDelay(): Promise<void> {
    this.logger.debug(`   Waiting ${this.delayBetweenRequestsMs}ms before next request...`);
    return new Promise((resolve) => setTimeout(resolve, this.delayBetweenRequestsMs));
  }

  /**
   * Save scraped data to database
   */
  private async saveScrapedData(
    kondoId: number,
    data: ScrapedKondoDto,
  ): Promise<void> {
    const { medias, scrapedAt, sourceUrl, ...kondoData } = data;

    // Update Kondo entity
    await this.kondoRepository.update(kondoData, {
      where: { id: kondoId },
    });

    this.logger.debug(`   Updated kondo ${kondoId} with scraped data`);

    // Create Media records
    if (medias && medias.length > 0) {
      const mediaRecords = medias.map((url) => ({
        kondoId,
        filename: this.extractFilename(url),
        storage_url: url,
        type: this.detectMediaType(url),
        status: 'draft' as const,
      }));

      await Media.bulkCreate(mediaRecords);
      this.logger.debug(`   Created ${medias.length} media records`);
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

    if (urlLower.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/)) {
      return 'video';
    }

    if (urlLower.includes('youtube') || urlLower.includes('vimeo')) {
      return 'video';
    }

    return 'image';
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
    
    if (result.errors.length > 0) {
      this.logger.log('\n❌ Errors:');
      result.errors.forEach((error) => {
        this.logger.log(`   Kondo ${error.kondoId}: ${error.error}`);
      });
    }
    
    this.logger.log('='.repeat(50) + '\n');
  }
}
