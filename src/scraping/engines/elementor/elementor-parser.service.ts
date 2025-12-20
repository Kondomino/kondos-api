import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import {
  ELEMENTOR_SELECTORS,
  ELEMENTOR_PATTERNS,
  extractHeadingText,
  parseElementorFeatures,
} from './elementor.config';

/**
 * Parser service for Elementor-built websites
 * Handles extraction of kondo data from Elementor page structure
 */
@Injectable()
export class ElementorParserService {
  private readonly logger = new Logger(ElementorParserService.name);

  /**
   * Parse Elementor HTML and extract kondo data
   * All data is typically found in h2.elementor-heading-title elements
   *
   * @param html - Raw HTML content from Elementor page
   * @returns Partial kondo data extracted from page
   */
  parse(html: string): Partial<ScrapedKondoDto> {
    const $ = cheerio.load(html);
    const result: Record<string, any> = {};

    try {
      // Extract all heading titles that contain property information
      const headings = $(ELEMENTOR_SELECTORS.headingTitles)
        .map((_: number, el: any) => extractHeadingText($(el).html() || ''))
        .get()
        .filter((text: string) => text.length > 0);

      this.logger.debug(`Found ${headings.length} heading elements`);

      if (headings.length === 0) {
        this.logger.warn('No heading elements found in Elementor page');
        return result;
      }

      // First heading is typically the property name
      if (headings[0]) {
        result.name = headings[0];
        this.logger.debug(`Extracted name: ${result.name}`);
      }

      // Combine all headings to search for property information
      const allText = headings.join(' | ');

      // Extract address (Brazilian pattern)
      const addressMatch = allText.match(ELEMENTOR_PATTERNS.address);
      if (addressMatch) {
        const street = addressMatch[1].trim();
        const number = addressMatch[2];
        result.address = `${street}, ${number}`;
        this.logger.debug(`Extracted address: ${result.address}`);
      }

      // Extract features and amenities from joined text
      const featuresMatch = allText.match(/(\d+\s+quartos?[^|]*(?:\|[^|]*)*)/i);
      if (featuresMatch) {
        const featureString = featuresMatch[1];
        const amenities = parseElementorFeatures(featureString);

        // Apply extracted amenities to result
        Object.assign(result, amenities);
        this.logger.debug(`Extracted amenities: ${JSON.stringify(amenities)}`);
      }

      // Extract description from subsequent headings or text content
      const descriptionCandidates = headings.slice(1, 3).filter((h: string) => h.length > 20);
      if (descriptionCandidates.length > 0) {
        result.description = descriptionCandidates[0];
        this.logger.debug(`Extracted description: ${result.description.substring(0, 50)}...`);
      }

      // Try to extract additional amenities from all text
      this.extractAmenitiesFromText(allText, result);

      return result as Partial<ScrapedKondoDto>;
    } catch (error) {
      this.logger.error(`Error parsing Elementor HTML: ${error}`);
      return result as Partial<ScrapedKondoDto>;
    }
  }

  /**
   * Normalize relative URLs to absolute URLs
   * @param baseUrl - Base URL of the page
   * @param url - URL to normalize (can be relative or absolute)
   * @returns Absolute URL
   */
  private normalizeUrl(baseUrl: string, url: string): string {
    if (!url) return '';
    try {
      return url.startsWith('http') ? url : new URL(url, baseUrl).href;
    } catch (error) {
      this.logger.debug(`Failed to normalize URL ${url}: ${error.message}`);
      return url;
    }
  }

  /**
   * Extract image URLs from Elementor page
   * Handles swiper carousels and standard img elements with Elementor-specific selectors
   *
   * @param html - Raw HTML content
   * @param baseUrl - Base URL for normalizing relative paths
   * @returns Array of absolute image URLs
   */
  extractMediaUrls(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];
    const seenUrls = new Set<string>();

    try {
      // Elementor-specific selectors from guide
      const elementorSelectors = [
        '.elementor-swiper .swiper-slide img',
        '.elementor-image-carousel-wrapper img',
        '[class*="elementor-"] img',
        '.swiper-slide img',
        '[class*="carousel"] img',
        '[class*="gallery"] img'
      ];

      // Extract images using Elementor selectors
      elementorSelectors.forEach(selector => {
        $(selector).each((_: number, el: any) => {
          const $el = $(el);
          
          // Check src and data-src (lazy loading)
          const src = $el.attr('src') || $el.attr('data-src');
          if (src) {
            const normalizedUrl = this.normalizeUrl(baseUrl, src);
            if (normalizedUrl && !seenUrls.has(normalizedUrl)) {
              urls.push(normalizedUrl);
              seenUrls.add(normalizedUrl);
            }
          }

          // Also check srcset for responsive images (pick largest)
          const srcset = $el.attr('srcset');
          if (srcset) {
            const srcsetUrls = srcset.split(',').map((s: string) => s.trim().split(/\s+/)[0]);
            srcsetUrls.forEach((url: string) => {
              const normalizedUrl = this.normalizeUrl(baseUrl, url);
              if (normalizedUrl && !seenUrls.has(normalizedUrl)) {
                urls.push(normalizedUrl);
                seenUrls.add(normalizedUrl);
              }
            });
          }
        });
      });

      // Fallback: get all images if carousel not found, excluding icons/logos
      if (urls.length === 0) {
        $('img').each((_: number, el: any) => {
          const $el = $(el);
          const src = $el.attr('src') || $el.attr('data-src');
          if (src && !src.includes('icon') && !src.includes('logo')) {
            const normalizedUrl = this.normalizeUrl(baseUrl, src);
            if (normalizedUrl && !seenUrls.has(normalizedUrl)) {
              urls.push(normalizedUrl);
              seenUrls.add(normalizedUrl);
            }
          }
        });
      }

      this.logger.debug(`Extracted ${urls.length} image URLs from Elementor page`);
      return urls;
    } catch (error) {
      this.logger.error(`Error extracting media URLs: ${error}`);
      return urls;
    }
  }

  /**
   * Extract video URLs from Elementor page
   * Supports YouTube, Vimeo embeds, and self-hosted videos (MP4, WebM, etc.)
   *
   * @param html - Raw HTML content
   * @param baseUrl - Base URL for normalizing relative paths
   * @returns Array of absolute video URLs
   */
  extractVideoUrls(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];
    const seenUrls = new Set<string>();

    try {
      // Extract YouTube embeds
      $('.elementor-video-wrapper iframe[src*="youtube"], iframe[src*="youtube"]').each((_: number, el: any) => {
        const src = $(el).attr('src');
        if (src && !seenUrls.has(src)) {
          const normalizedUrl = this.normalizeUrl(baseUrl, src);
          if (normalizedUrl) {
            urls.push(normalizedUrl);
            seenUrls.add(normalizedUrl);
          }
        }
      });

      // Extract Vimeo embeds
      $('.elementor-video-wrapper iframe[src*="vimeo"], iframe[src*="vimeo"]').each((_: number, el: any) => {
        const src = $(el).attr('src');
        if (src && !seenUrls.has(src)) {
          const normalizedUrl = this.normalizeUrl(baseUrl, src);
          if (normalizedUrl) {
            urls.push(normalizedUrl);
            seenUrls.add(normalizedUrl);
          }
        }
      });

      // Extract self-hosted videos (MP4, WebM, etc.)
      $('video').each((_: number, el: any) => {
        const $el = $(el);
        
        // Check video src attribute
        const src = $el.attr('src');
        if (src && !seenUrls.has(src)) {
          const normalizedUrl = this.normalizeUrl(baseUrl, src);
          if (normalizedUrl) {
            urls.push(normalizedUrl);
            seenUrls.add(normalizedUrl);
          }
        }

        // Check source elements inside video
        $el.find('source').each((_: number, sourceEl: any) => {
          const sourceSrc = $(sourceEl).attr('src');
          if (sourceSrc && !seenUrls.has(sourceSrc)) {
            const normalizedUrl = this.normalizeUrl(baseUrl, sourceSrc);
            if (normalizedUrl) {
              urls.push(normalizedUrl);
              seenUrls.add(normalizedUrl);
            }
          }
        });
      });

      this.logger.debug(`Extracted ${urls.length} video URLs from Elementor page`);
      return urls;
    } catch (error) {
      this.logger.error(`Error extracting video URLs: ${error}`);
      return urls;
    }
  }

  /**
   * Extract additional amenities from page text
   * Maps Elementor content text to infra_* boolean fields
   *
   * @param text - Combined text content from page
   * @param result - Result object to update with amenities
   */
  private extractAmenitiesFromText(text: string, result: Record<string, any>): void {
    const amenityMap: Record<string, string[]> = {
      infra_pool: ['piscina', 'pool', 'swimming'],
      infra_gym: ['academia', 'gym', 'fitness', 'ginásio'],
      infra_leisure: ['lazer', 'leisure', 'recreation', 'recreação'],
      infra_parking: ['estacionamento', 'parking', 'garagem', 'garage'],
      infra_playground: ['parquinho', 'playground', 'play area'],
      infra_bbq: ['churrasqueira', 'bbq', 'grill', 'churrasco'],
      infra_garden: ['jardim', 'garden', 'landscape', 'paisagismo'],
      infra_court: ['quadra', 'court', 'tennis', 'ténis'],
    };

    const lowerText = text.toLowerCase();

    for (const [fieldName, keywords] of Object.entries(amenityMap)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        result[fieldName] = true;
      }
    }
  }
}
