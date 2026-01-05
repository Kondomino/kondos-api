import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { KondoStatus, KondoTypes } from '../../../kondo/entities/kondo.entity';
import {
  GENERIC_SELECTORS,
  GENERIC_PATTERNS,
  GENERIC_FALLBACKS,
  TYPE_KEYWORDS,
  OG_TAGS,
} from './generic.config';
import { ScrapingFileLogger } from '../../logger/scraping-file-logger';

type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Service for parsing generic HTML pages
 * Extracts Kondo entity fields using progressive fallback strategy
 */
@Injectable()
export class GenericParserService {
  private readonly logger = new Logger(GenericParserService.name);

  constructor(private readonly fileLogger: ScrapingFileLogger) {}

  /**
   * Parse generic HTML to extract Kondo entity fields
   * @param html - Raw HTML content
   * @returns Partial Kondo data
   */
  parse(html: string): Partial<ScrapedKondoDto> {
    const $ = cheerio.load(html);

    try {
      const parsed: Partial<ScrapedKondoDto> = {
        name: this.parseName($),
        description: this.parseDescription($),
        type: this.parseType($),

        // Address
        address_street_and_numbers: this.parseStreet($),
        neighborhood: this.parseNeighborhood($),
        city: this.parseCity($),

        // Financial
        lot_avg_price: this.parsePrice($),
        finance: this.parseFinancing($),

        // Infrastructure
        infra_description: this.parseInfra($),

        // Meta
        status: KondoStatus.DONE,
        active: true,
      };

      this.logger.debug('[GENERIC-PARSER] Parsing complete');
      return parsed;
    } catch (error) {
      this.logger.error(`Error parsing HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract all media URLs from page
   * @param html - Raw HTML content
   * @returns Array of media URLs
   */
  extractMediaUrls(html: string): string[] {
    const $ = cheerio.load(html);
    const images = new Set<string>(); // Use Set for auto-deduplication
    const videos = new Set<string>();

    this.fileLogger.info('Starting media extraction (generic engine)', 'GenericParser');

    try {
      // === PHASE 1: Try specific selectors (higher priority) ===
      const imgSelectors = GENERIC_SELECTORS.images;
      this.fileLogger.debug(`Phase 1: Trying ${imgSelectors.length} specific selectors`, 'GenericParser');
      
      for (const selector of imgSelectors) {
        //console.log(`[GENERIC PARSER] Scanning selector: ${selector}`);
        let selectorMatches = 0;
        $(selector).each((i, el) => {
          console.log(`[GENERIC PARSER] Found element: ` + $.html(el).substring(0, 100));

          const attrs = {
            src: $(el).attr('src'),
            'data-src': $(el).attr('data-src'),
            'data-lazy-src': $(el).attr('data-lazy-src'),
            'data-lazy': $(el).attr('data-lazy'),
            'data-original': $(el).attr('data-original'),
          };

          const src =
            attrs.src ||
            attrs['data-src'] ||
            attrs['data-lazy-src'] ||
            attrs['data-lazy'] ||
            attrs['data-original'];

          if (src) {
            const validationResult = this.isValidMediaUrl(src);
            if (validationResult) {
              images.add(src);
              selectorMatches++;
              this.fileLogger.debug(
                `Phase 1: Found image via selector "${selector}" - ${src}`,
                'GenericParser'
              );
            } else {
              this.fileLogger.debug(
                `Phase 1: Skipped invalid URL from "${selector}" - ${src}`,
                'GenericParser'
              );
            }
          }
          else {
            console.log(`[GENERIC PARSER] No valid src found for element in selector ${selector}`);
            this.fileLogger.debug(`Phase 1: No valid src found for element in selector "${selector}"`, 'GenericParser');
          }
        });
        
        this.fileLogger.debug(
          `Phase 1: Selector "${selector}" matched ${selectorMatches} images`,
          'GenericParser'
        );
        console.log(`[GENERIC PARSER] Selector "${selector}" matched ${selectorMatches} images`);
      }

      const phase1Count = images.size;
      this.logger.debug(
        `[GENERIC-PARSER] Phase 1: ${phase1Count} images from specific selectors`
      );
      this.fileLogger.info(
        `Phase 1 complete: ${phase1Count} images from specific selectors`,
        'GenericParser'
      );

      // === PHASE 2: Universal fallback - catch ALL <img> tags ===
      // This ensures we don't miss any images Scrapfly returns
      this.fileLogger.debug('Phase 2: Starting universal <img> fallback scan', 'GenericParser');
      
      let phase2Attempts = 0;
      let phase2Skipped = 0;
      
      $('img').each((i, el) => {
        phase2Attempts++;
        
        const attrs = {
          src: $(el).attr('src'),
          'data-src': $(el).attr('data-src'),
          'data-lazy-src': $(el).attr('data-lazy-src'),
          'data-lazy': $(el).attr('data-lazy'),
          'data-original': $(el).attr('data-original'),
        };

        const src =
          attrs.src ||
          attrs['data-src'] ||
          attrs['data-lazy-src'] ||
          attrs['data-lazy'] ||
          attrs['data-original'];
        
        if (src) {
          const wasAlreadyFound = images.has(src);
          
          if (this.isValidMediaUrl(src)) {
            if (!wasAlreadyFound) {
              images.add(src);
              this.fileLogger.debug(
                `Phase 2: NEW image found - ${src}`,
                'GenericParser'
              );
            }
          } else {
            phase2Skipped++;
            this.fileLogger.debug(
              `Phase 2: Skipped invalid URL - ${src}`,
              'GenericParser'
            );
          }
        } else {
          phase2Skipped++;
          this.fileLogger.debug(
            `Phase 2: Skipped <img> with no src attributes (index ${i})`,
            'GenericParser'
          );
        }
      });

      const phase2Additional = images.size - phase1Count;
      if (phase2Additional > 0) {
        this.logger.debug(
          `[GENERIC-PARSER] Phase 2: +${phase2Additional} additional images from universal fallback`
        );
        this.fileLogger.info(
          `Phase 2: Found ${phase2Additional} NEW images (${phase2Attempts} total <img> tags scanned, ${phase2Skipped} skipped)`,
          'GenericParser'
        );
      } else {
        this.fileLogger.info(
          `Phase 2: No new images found (${phase2Attempts} <img> tags scanned, all already captured or invalid)`,
          'GenericParser'
        );
      }

      // === Videos ===
      this.fileLogger.debug('Extracting videos from page', 'GenericParser');
      let videoAttempts = 0;
      
      $(GENERIC_SELECTORS.videos.join(', ')).each((i, el) => {
        videoAttempts++;
        const src = $(el).attr('src');
        
        if (src) {
          if (this.isValidMediaUrl(src)) {
            videos.add(src);
            this.fileLogger.debug(
              `Video found - ${src}`,
              'GenericParser'
            );
          } else {
            this.fileLogger.debug(
              `Skipped invalid video URL - ${src}`,
              'GenericParser'
            );
          }
        }
      });
      
      this.fileLogger.info(
        `Video extraction: ${videos.size} videos found from ${videoAttempts} attempts`,
        'GenericParser'
      );

      // Combine and return
      const allMedia = [...images, ...videos];

      this.logger.debug(
        `[GENERIC-PARSER] Found ${allMedia.length} unique media URLs (${images.size} images, ${videos.size} videos)`
      );
      this.fileLogger.info(
        `Media extraction complete: ${allMedia.length} total (${images.size} images, ${videos.size} videos)`,
        'GenericParser'
      );

      // === DEBUG MODE: Dump all <img> tags for forensic analysis ===
      if (process.env.DEBUG_MEDIA_EXTRACTION === 'true') {
        this.dumpMediaDebugInfo($, images, videos);
      }

      return allMedia;
    } catch (error) {
      this.logger.error(`Error extracting media: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse property name
   */
  private parseName($: CheerioRoot): string {
    let name = this.trySelectors($, GENERIC_SELECTORS.name);

    if (!name) {
      name = $('meta[property="og:title"]').attr('content') || '';
    }

    if (!name) {
      name = $('title').text().trim().split('-')[0].trim();
    }

    return name || 'Propriedade';
  }

  /**
   * Parse property description
   */
  private parseDescription($: CheerioRoot): string {
    let description = this.trySelectors($, GENERIC_SELECTORS.description);

    if (!description) {
      description = $('meta[property="og:description"]').attr('content') || '';
    }

    if (!description) {
      description = $('meta[name="description"]').attr('content') || '';
    }

    // Enhanced: Try multiple semantic sections and combine
    if (!description || description.length < 100) {
      const richDescription = this.extractRichDescription($);
      if (richDescription && richDescription.length > description.length) {
        description = richDescription;
      }
    }

    if (!description) {
      // Generic content extraction
      const contentText = $('main, .main, .content, article')
        .first()
        .text()
        .trim();
      description = contentText.substring(0, 500);
    }

    return description || '';
  }

  /**
   * Extract rich description from multiple page sections
   * Useful for SPAs where content is in various containers
   */
  private extractRichDescription($: CheerioRoot): string {
    const descriptions: string[] = [];

    // Try to extract from common description containers
    const containers = [
      'main p',
      'article p',
      '[class*="description"] p',
      '[class*="about"] p',
      '[id*="description"]',
      '[id*="about"]',
      '.text-content',
      '.content p',
    ];

    for (const selector of containers) {
      $(selector).each((i, el) => {
        const text = $(el).text().trim();
        // Only include substantial paragraphs (> 50 chars)
        if (text.length > 50 && !descriptions.includes(text)) {
          descriptions.push(text);
        }
      });

      // Stop if we have 3 good paragraphs
      if (descriptions.length >= 3) {
        break;
      }
    }

    // Combine up to 3 paragraphs with line breaks
    return descriptions.slice(0, 3).join('\n\n');
  }

  /**
   * Parse street address
   */
  private parseStreet($: CheerioRoot): string {
    return this.trySelectors($, GENERIC_SELECTORS.street);
  }

  /**
   * Parse neighborhood
   */
  private parseNeighborhood($: CheerioRoot): string {
    return this.trySelectors($, GENERIC_SELECTORS.neighborhood);
  }

  /**
   * Parse city
   */
  private parseCity($: CheerioRoot): string {
    let city = this.trySelectors($, GENERIC_SELECTORS.city);

    if (!city) {
      city =
        $('meta[property="og:locality"]').attr('content') ||
        $('meta[name="og:locality"]').attr('content') ||
        '';
    }

    return city || GENERIC_FALLBACKS.city;
  }

  /**
   * Parse price
   */
  private parsePrice($: CheerioRoot): number | null {
    const priceText = this.trySelectors($, GENERIC_SELECTORS.price);

    if (priceText) {
      return this.parseNumericPrice(priceText);
    }

    // Try to find price anywhere on page using regex
    const bodyText = $('body').text();
    const matches = bodyText.match(GENERIC_PATTERNS.price);

    if (matches && matches.length > 0) {
      return this.parseNumericPrice(matches[0]);
    }

    return null;
  }

  /**
   * Parse property type
   */
  private parseType($: CheerioRoot): string {
    const pageText = $('body').text().toLowerCase();

    for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (pageText.includes(keyword)) {
          const typeValue = Object.values(KondoTypes).find(
            (t) => t === type || t === this.getKondoType(type)
          );
          if (typeValue) {
            this.logger.debug(`[GENERIC-PARSER] Type detected: ${typeValue}`);
            return typeValue;
          }
        }
      }
    }

    return GENERIC_FALLBACKS.type;
  }

  /**
   * Parse financing availability
   */
  private parseFinancing($: CheerioRoot): boolean {
    const pageText = $('body').text().toLowerCase();

    return (
      pageText.includes('financiamento') ||
      pageText.includes('financia') ||
      pageText.includes('financiável') ||
      pageText.includes('crédito') ||
      pageText.includes('empréstimo')
    );
  }

  /**
   * Parse infrastructure/amenities
   */
  private parseInfra($: CheerioRoot): string {
    const selectors = [
      '.infrastructure',
      '.infraestrutura',
      '.amenities',
      '.comodidades',
      '.facilities',
    ];

    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text) {
        return text;
      }
    }

    return '';
  }

  /**
   * Try multiple selectors in order, return first match
   */
  private trySelectors($: CheerioRoot, selectors: string[]): string {
    for (const selector of selectors) {
      try {
        const text = $(selector).first().text().trim();
        if (text) {
          this.logger.debug(
            `[GENERIC-PARSER] Selector "${selector.substring(0, 30)}..." found (${text.length} chars)`
          );
          return text;
        }
      } catch (error) {
        // Invalid selector, continue
        continue;
      }
    }

    return '';
  }

  /**
   * Parse price string to number
   * Converts "R$ 1.250.000,89" to 1250000.89
   */
  private parseNumericPrice(text: string): number | null {
    try {
      // Remove "R$" and spaces
      let cleaned = text.replace(/R\$\s*/gi, '');

      // Handle both . and , as separators
      // If there's a comma, it's the decimal separator
      if (cleaned.includes(',')) {
        // Replace . with nothing (thousands separator) and , with . (decimal)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // No comma, remove dots
        cleaned = cleaned.replace(/\./g, '');
      }

      const price = parseFloat(cleaned);
      return !isNaN(price) ? price : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convert type name to KondoTypes enum value
   */
  private getKondoType(type: string): string {
    const typeMap = {
      predios: KondoTypes.Predios,
      casas: KondoTypes.Casas,
      chacaras: KondoTypes.Chacaras,
      comercial: KondoTypes.Comercial,
    };

    return typeMap[type] || KondoTypes.Casas;
  }

  /**
   * Check if URL is a valid media URL (not just any string)
   */
  private isValidMediaUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Must start with http or be protocol-relative
    if (!url.match(/^https?:|^\/\//)) {
      return false;
    }

    // Must be reasonable length
    if (url.length > 2000) {
      return false;
    }

    return true;
  }

  /**
   * Dump detailed media extraction debug info to file
   * Only runs when DEBUG_MEDIA_EXTRACTION=true
   */
  private dumpMediaDebugInfo($: any, images: Set<string>, videos: Set<string>): void {
    try {
      const fs = require('fs');
      const path = require('path');

      const debugDir = path.join(process.cwd(), 'test-results', 'generic-scraping', 'debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      // Dump all <img> tags with attributes
      const allImgTags = $('img')
        .map((i, el) => ({
          index: i,
          src: $(el).attr('src'),
          'data-src': $(el).attr('data-src'),
          'data-lazy-src': $(el).attr('data-lazy-src'),
          'data-lazy': $(el).attr('data-lazy'),
          'data-original': $(el).attr('data-original'),
          class: $(el).attr('class'),
          alt: $(el).attr('alt'),
          width: $(el).attr('width'),
          height: $(el).attr('height'),
        }))
        .get();

      const debugInfo = {
        timestamp: new Date().toISOString(),
        summary: {
          totalImgTags: allImgTags.length,
          imagesExtracted: images.size,
          videosExtracted: videos.size,
          extractionRate: `${((images.size / allImgTags.length) * 100).toFixed(1)}%`,
        },
        allImgTags,
        extractedImageUrls: [...images],
        extractedVideoUrls: [...videos],
        skippedImgTags: allImgTags.filter((tag) => {
          const src =
            tag.src ||
            tag['data-src'] ||
            tag['data-lazy-src'] ||
            tag['data-lazy'] ||
            tag['data-original'];
          return !src || !images.has(src);
        }),
      };

      const debugPath = path.join(
        debugDir,
        `debug-media-extraction-${Date.now()}.json`
      );
      fs.writeFileSync(debugPath, JSON.stringify(debugInfo, null, 2), 'utf-8');

      this.logger.log(`[DEBUG] Media extraction debug info saved to: ${debugPath}`);
      this.fileLogger.info(
        `Debug info dumped: ${allImgTags.length} img tags analyzed, ${images.size} extracted`,
        'GenericParser'
      );
    } catch (error) {
      this.logger.error(`Failed to dump debug info: ${error.message}`);
    }
  }
}
