import { Injectable, Logger } from '@nestjs/common';
import { ScrapingPlatformFactory } from '../core/scraping-platform.factory';

/**
 * Service to detect website platform/framework from HTML
 * Used to select appropriate scraper when URL pattern doesn't match
 * Uses platform factory to support both ScrapingDog and Scrapfly
 */
@Injectable()
export class PlatformDetectorService {
  private readonly logger = new Logger(PlatformDetectorService.name);

  constructor(private readonly platformFactory: ScrapingPlatformFactory) {}

  /**
   * Detect if HTML is WordPress + Elementor
   * Fast detection using meta tags and class patterns
   * 
   * @param html - Raw HTML content
   * @returns true if WordPress + Elementor detected
   */
  isElementorSite(html: string): boolean {
    // Check for Elementor-specific markers
    const elementorMarkers = [
      'elementor-element',
      'elementor-widget',
      'elementor-kit',
      '/elementor/',
      'data-elementor-type',
    ];

    // Also check WordPress markers
    const wpMarkers = [
      'wp-content',
      '/wp-includes/',
      'wordpress',
    ];

    const hasElementor = elementorMarkers.some(marker => html.includes(marker));
    const hasWordPress = wpMarkers.some(marker => html.includes(marker));

    if (hasElementor && hasWordPress) {
      this.logger.debug('Detected WordPress + Elementor site');
      return true;
    }

    return false;
  }

  /**
   * Detect if HTML is Next.js
   * Looks for Next.js-specific markers
   * 
   * @param html - Raw HTML content
   * @returns true if Next.js detected
   */
  isNextJsSite(html: string): boolean {
    const nextMarkers = [
      '__NEXT_DATA__',
      '/_next/static/',
      'data-styled',
      '-sc-', // styled-components hash pattern
    ];

    const isNext = nextMarkers.some(marker => html.includes(marker));
    
    if (isNext) {
      this.logger.debug('Detected Next.js site');
    }

    return isNext;
  }

  /**
   * Detect platform from URL by fetching and analyzing HTML
   * Returns platform identifier or 'unknown'
   * 
   * @param url - URL to fetch and analyze
   * @returns Platform identifier: 'elementor', 'nextjs', or 'unknown'
   */
  async detectPlatform(url: string): Promise<'elementor' | 'nextjs' | 'unknown'> {
    try {
      this.logger.debug(`Fetching HTML to detect platform for: ${url}`);
      
      const platformService = this.platformFactory.getPlatformService();
      const response = await platformService.fetchHtml(url, {
        dynamic: false,
        premium: false,
        country: 'br',
      });

      const html = response.html;

      if (this.isElementorSite(html)) {
        return 'elementor';
      }

      if (this.isNextJsSite(html)) {
        return 'nextjs';
      }

      return 'unknown';
    } catch (error) {
      this.logger.error(`Failed to detect platform for ${url}: ${error.message}`);
      return 'unknown';
    }
  }
}
