import { Injectable, Logger, Inject } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from '../../core/base-scraper';
import { ScrapingPlatformFactory } from '../../core/scraping-platform.factory';
import { RetryService } from '../../core/retry.service';
import { ScrapingPlatformOptions } from '../../interfaces/scraper-config.interface';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { ScrapingFileLogger } from '../../logger/scraping-file-logger';
import { GenericParserService } from './generic-parser.service';
import { GenericHeuristicsService } from './generic-heuristics.service';
import { GENERIC_SCRAPING_OPTIONS } from './generic.config';
import { ScrapingConfig } from '../../../config/scraping.config';
import { SPADetectorService } from '../../core/spa-detector.service';
import { ManualDataExtractorService } from '../../core/manual-data-extractor.service';
import { StructuredMediaExtractorService } from '../../core/structured-media-extractor.service';

/**
 * Scraper for generic/unknown real estate platforms
 * Serves as fallback when URL doesn't match specific engine patterns
 * Uses two-phase extraction: manual first (cheap), JS rendering fallback (expensive)
 */
@Injectable()
export class GenericScraperService extends BaseScraper {
  platform = 'generic';

  private currentUrl: string = '';
  private isSPA: boolean = false;
  private useJsRendering: boolean = false;
  private extractionMetadata: {
    method: 'manual' | 'js-rendered';
    source?: string;
    confidence?: number;
    rawData?: any;
  } = { method: 'manual' };

  constructor(
    platformFactory: ScrapingPlatformFactory,
    retryService: RetryService,
    private readonly parser: GenericParserService,
    private readonly heuristics: GenericHeuristicsService,
    private readonly fileLogger: ScrapingFileLogger,
    private readonly spaDetector: SPADetectorService,
    private readonly manualExtractor: ManualDataExtractorService,
    private readonly structuredMediaExtractor: StructuredMediaExtractorService,
    @Inject('SCRAPING_CONFIG') private readonly scrapingConfig: ScrapingConfig,
  ) {
    super(platformFactory, retryService);
  }

  /**
   * Override scrape to implement two-phase extraction:
   * Phase 1: Manual extraction (no JS) - cheap and fast
   * Phase 2: JS rendering (if Phase 1 fails + SPA detected) - expensive but thorough
   */
  async scrape(url: string): Promise<ScrapedKondoDto> {
    this.currentUrl = url;
    this.useJsRendering = false;
    this.extractionMetadata = { method: 'manual' };

    this.logger.log(`[PHASE 1] Starting manual extraction (no JS)...`);
    this.fileLogger.info(
      `[PHASE 1] Attempting manual extraction without JS rendering`,
      'GenericScraper'
    );

    // Attempt manual extraction
    const manualResult = await this.attemptManualExtraction(url);

    if (manualResult.success) {
      this.logger.log(
        `[PHASE 1] ✓ Manual extraction successful (confidence: ${manualResult.confidence.toFixed(2)})`
      );
      this.fileLogger.info(
        `[PHASE 1] Manual extraction successful - confidence: ${manualResult.confidence.toFixed(2)}, method: ${manualResult.source || 'heuristics'}`,
        'GenericScraper'
      );

      // Store metadata for later persistence
      this.extractionMetadata = {
        method: 'manual',
        source: manualResult.source,
        confidence: manualResult.confidence,
        rawData: manualResult.rawData,
      };

      // Attach metadata to result
      manualResult.scrapedData.extractionMetadata = this.extractionMetadata;

      // Return result from manual extraction
      return manualResult.scrapedData;
    }

    // Phase 1 failed - check if we should escalate to Phase 2
    if (!manualResult.needsJsRendering) {
      this.logger.warn(
        `[PHASE 1] Manual extraction failed (confidence: ${manualResult.confidence.toFixed(2)}) but SPA not detected - returning partial results`
      );
      this.fileLogger.warn(
        `[PHASE 1] Manual extraction incomplete (confidence: ${manualResult.confidence.toFixed(2)}) - no JS rendering needed`,
        'GenericScraper'
      );
      return manualResult.scrapedData;
    }

    // Escalate to Phase 2 - JS rendering
    this.logger.warn(
      `[PHASE 1] Manual extraction failed (confidence: ${manualResult.confidence.toFixed(2)}) - escalating to Phase 2`
    );
    this.logger.log(`[PHASE 2] Starting JS rendering (expensive)...`);
    this.fileLogger.warn(
      `[PHASE 1] Failed with confidence ${manualResult.confidence.toFixed(2)} - escalating to Phase 2`,
      'GenericScraper'
    );
    this.fileLogger.info(
      `[PHASE 2] Starting JS rendering extraction (SPA detected: framework=${manualResult.framework})`,
      'GenericScraper'
    );

    this.useJsRendering = true;
    this.isSPA = true;
    this.extractionMetadata = { method: 'js-rendered' };

    const jsResult = await super.scrape(url);

    // Store metadata for JS-rendered extraction
    this.extractionMetadata = {
      method: 'js-rendered',
      confidence: 1.0, // Full JS rendering assumed to be complete
    };

    // Attach metadata to result
    jsResult.extractionMetadata = this.extractionMetadata;

    this.logger.log(
      `[PHASE 2] ✓ JS rendering complete (${jsResult.medias?.length || 0} medias extracted)`
    );
    this.fileLogger.info(
      `[PHASE 2] JS rendering complete - extracted ${jsResult.medias?.length || 0} medias`,
      'GenericScraper'
    );

    return jsResult;
  }

  /**
   * Attempt manual extraction without JS rendering
   * Returns success status, confidence score, and scraped data
   */
  private async attemptManualExtraction(url: string): Promise<{
    success: boolean;
    confidence: number;
    needsJsRendering: boolean;
    framework?: string;
    source?: string;
    rawData?: any;
    scrapedData: ScrapedKondoDto;
  }> {
    try {
      // Fetch HTML without JS rendering
      const html = await this.fetchHtml(url, { dynamic: false });

      // Detect if site is SPA
      const spaDetection = this.spaDetector.detectSPA(html);

      if (spaDetection.isSPA) {
        this.logger.debug(
          `[SPA-DETECT] SPA detected (confidence: ${spaDetection.confidence.toFixed(2)}, framework: ${spaDetection.framework || 'unknown'}, indicators: ${spaDetection.indicators.join(', ')})`
        );
        this.fileLogger.debug(
          `SPA detected - framework: ${spaDetection.framework || 'unknown'}, confidence: ${spaDetection.confidence.toFixed(2)}, indicators: ${spaDetection.indicators.join(', ')}`,
          'SPADetector'
        );
      }

      // Try manual data extraction
      const extractionResult = this.manualExtractor.extractData(html);

      if (extractionResult.success) {
        this.logger.debug(
          `[MANUAL-EXTRACT] Data extracted via ${extractionResult.method} (source: ${extractionResult.source}, confidence: ${extractionResult.confidence.toFixed(2)})`
        );
        this.fileLogger.debug(
          `Manual extraction via ${extractionResult.method} - source: ${extractionResult.source}, confidence: ${extractionResult.confidence.toFixed(2)}`,
          'ManualExtractor'
        );
      }

      // Extract media URLs - try structured data first, fallback to HTML
      let mediaUrls: string[] = [];

      if (extractionResult.success && extractionResult.data) {
        // Try extracting media from structured data first
        mediaUrls = this.structuredMediaExtractor.extract(
          extractionResult.data,
          extractionResult.source
        );

        if (mediaUrls.length > 0) {
          this.logger.log(
            `[STRUCTURED-MEDIA] ✓ Extracted ${mediaUrls.length} URLs from ${extractionResult.source}`
          );
          this.fileLogger.info(
            `Extracted ${mediaUrls.length} media URLs from structured data (${extractionResult.source})`,
            'StructuredMediaExtractor'
          );
        }
      }

      // Fallback to HTML scraping if no structured data media found
      if (mediaUrls.length === 0) {
        this.logger.debug('[STRUCTURED-MEDIA] No media in structured data, trying HTML scraping');
        this.fileLogger.debug(
          'No media found in structured data, falling back to HTML scraping',
          'StructuredMediaExtractor'
        );
        mediaUrls = await this.extractMediaUrls(html, url);
      }

      // Apply heuristics (dedup, placeholder removal, sorting)
      mediaUrls = await this.applyMediaHeuristics(mediaUrls, html);

      // Check if confidence meets threshold
      const meetsThreshold = extractionResult.confidence >= 
        this.scrapingConfig.extractionConfidence.manualExtractionThreshold;

      if (meetsThreshold) {
        // Success - parse the data and continue with standard flow
        const parsed = await this.parseHtml(html);

        return {
          success: true,
          confidence: extractionResult.confidence,
          needsJsRendering: false,
          framework: spaDetection.framework,
          source: extractionResult.source,
          rawData: extractionResult.data,
          scrapedData: {
            ...parsed,
            medias: mediaUrls,
          } as ScrapedKondoDto,
        };
      }

      // Confidence too low - return failure with metadata
      const parsed = await this.parseHtml(html);

      return {
        success: false,
        confidence: extractionResult.confidence,
        needsJsRendering: spaDetection.needsJsRendering,
        framework: spaDetection.framework,
        source: extractionResult.source,
        rawData: extractionResult.data,
        scrapedData: {
          ...parsed,
          medias: mediaUrls,
        } as ScrapedKondoDto,
      };

    } catch (error) {
      this.logger.error(`[MANUAL-EXTRACT] Error during manual extraction: ${error.message}`);
      this.fileLogger.error(
        `Manual extraction error: ${error.message}`,
        'ManualExtractor'
      );

      // Return failure - will not trigger JS rendering due to exception
      return {
        success: false,
        confidence: 0,
        needsJsRendering: false,
        scrapedData: {} as ScrapedKondoDto,
      };
    }
  }

  /**
   * Fetch HTML with or without JS rendering
   */
  private async fetchHtml(url: string, options: { dynamic: boolean }): Promise<string> {
    const scrapingOptions: ScrapingPlatformOptions = {
      dynamic: options.dynamic,
      premium: GENERIC_SCRAPING_OPTIONS.premium,
      country: GENERIC_SCRAPING_OPTIONS.country,
      asp: GENERIC_SCRAPING_OPTIONS.premium,
    };

    const platform = this.platformFactory.getPlatformService();
    
    const response = await this.retryService.withRetry(
      async () => {
        this.logger.debug(`[HTTP] Fetching ${url} (dynamic=${options.dynamic})...`);
        return await platform.fetchHtml(url, scrapingOptions);
      }
    );

    return response.html;
  }

  /**
   * Get extraction metadata for persistence
   */
  getExtractionMetadata() {
    return this.extractionMetadata;
  }

  /**
   * Get platform configuration with SPA-aware settings
   */
  protected getScrapingOptions(): ScrapingPlatformOptions {
    const baseOptions: ScrapingPlatformOptions = {
      dynamic: this.useJsRendering, // Use JS rendering only in Phase 2
      premium: GENERIC_SCRAPING_OPTIONS.premium,
      country: GENERIC_SCRAPING_OPTIONS.country,
      asp: GENERIC_SCRAPING_OPTIONS.premium,
    };

    // Add SPA-specific configuration if using JS rendering
    if (this.useJsRendering && this.isSPA) {
      const renderingWait = this.scrapingConfig.spa.maxWaitTimeMs;
      const waitForSelector = this.scrapingConfig.spa.waitForSelectors[0];
      const timeout = renderingWait + 30000; // Add 30s buffer

      this.logger.debug(
        `[SPA-CONFIG] render_js=true, wait_for_selector="${waitForSelector}", rendering_wait=${renderingWait}ms, timeout=${timeout}ms`
      );

      return {
        ...baseOptions,
        dynamic: true,
        waitForSelector,
        renderingWait,
        timeout,
      };
    }

    return baseOptions;
  }

  /**
   * Parse HTML to extract kondo data
   */
  protected async parseHtml(html: string): Promise<Partial<ScrapedKondoDto>> {
    this.logger.debug('[GENERIC-PARSER] Extracting fields...');

    const parsed = this.parser.parse(html);

    const fieldCount = Object.keys(parsed).filter((k) => parsed[k]).length;
    this.logger.log(`[GENERIC-PARSER] Extracted ${fieldCount} fields`);
    this.fileLogger.debug(
      `Extracted ${fieldCount} fields from generic site`,
      'GenericParser'
    );

    return parsed;
  }

  /**
   * Extract media URLs from HTML
   * Applies heuristics for deduplication, placeholder removal, sorting
   */
  protected async extractMediaUrls(html: string, url: string): Promise<string[]> {
    this.logger.debug('[GENERIC-SCRAPER] Extracting media URLs...');

    const rawUrls = this.parser.extractMediaUrls(html);
    this.logger.debug(
      `[GENERIC-SCRAPER] Found ${rawUrls.length} raw media URLs`
    );
    this.fileLogger.debug(
      `Found ${rawUrls.length} raw media URLs`,
      'GenericScraper'
    );

    // Apply heuristics
    return this.applyMediaHeuristics(rawUrls, html);
  }

  /**
   * Apply heuristics to media URLs:
   * - Transform CDN URLs to high quality
   * - Deduplicate (hash-based)
   * - Remove placeholders (size/name check)
   * - Sort by relevance score
   * - Detect pagination
   */
  private async applyMediaHeuristics(
    urls: string[],
    html: string
  ): Promise<string[]> {
    const $ = cheerio.load(html);
    const filtered: string[] = [];
    const imageHashes: string[] = [];

    this.logger.debug(
      `[GENERIC-HEURISTICS] Processing ${urls.length} media URLs...`
    );
    this.fileLogger.debug(
      `Processing ${urls.length} media URLs for heuristics`,
      'GenericHeuristics'
    );

    // STEP 0: Transform CDN URLs to high quality (NEW)
    const transformedUrls = this.heuristics.transformCdnUrls(urls);

    for (const url of transformedUrls) {
      // 1. Detect placeholder
      const placeholderCheck = this.heuristics.detectPlaceholder(url);
      if (placeholderCheck.isPlaceholder) {
        this.logger.debug(
          `[GENERIC-HEURISTICS] Skipped placeholder: ${placeholderCheck.reason}`
        );
        this.fileLogger.debug(
          `Skipped placeholder: ${url}`,
          'GenericHeuristics'
        );
        continue;
      }

      // 2. Detect duplicate
      const dupCheck = await this.heuristics.detectDuplicate(url, imageHashes);
      if (dupCheck.isDuplicate) {
        this.logger.debug(`[GENERIC-HEURISTICS] Skipped duplicate: ${url}`);
        this.fileLogger.debug(`Skipped duplicate image`, 'GenericHeuristics');
        continue;
      }

      if (dupCheck.hash) {
        imageHashes.push(dupCheck.hash);
      }

      // Pass filter
      filtered.push(url);
    }

    // 3. Sort by relevance
    const sourceUrl = this.getCurrentUrl();
    const domain = this.extractDomain(sourceUrl);
    const sorted = await this.heuristics.sortMediaByRelevance(filtered, domain);

    // 4. Detect pagination
    const paginationInfo = this.heuristics.detectPagination($, sourceUrl);
    if (paginationInfo.hasPagination) {
      this.fileLogger.debug(
        `Pagination detected (type: ${paginationInfo.type})`,
        'GenericHeuristics'
      );
    }

    const skipped = urls.length - sorted.length;
    this.logger.log(
      `[GENERIC-SCRAPER] Final media count: ${sorted.length} (${skipped} filtered)`
    );
    this.fileLogger.info(
      `Extracted ${sorted.length} media URLs after heuristics (${skipped} filtered)`,
      'GenericScraper'
    );

    return sorted;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url?: string): string {
    if (!url) {
      return '';
    }

    try {
      return new URL(url).hostname;
    } catch (error) {
      return '';
    }
  }

  /**
   * Get the current URL being scraped (stored during scrape flow)
   */
  private getCurrentUrl(): string {
    return this.currentUrl || '';
  }
}
