import { ScrapingPlatformOptions } from '../interfaces/scraper-config.interface';

/**
 * Response from scraping platform with HTML and metadata
 */
export interface ScrapingPlatformResponse {
  /**
   * HTML content
   */
  html: string;

  /**
   * Platform response metadata
   */
  metadata: {
    /**
     * HTTP status code returned by the target site
     */
    statusCode?: number;

    /**
     * Cost of the request (credits/API units)
     */
    cost?: number;

    /**
     * Whether JavaScript rendering was used
     */
    renderedJs?: boolean;

    /**
     * Response time in milliseconds
     */
    responseTimeMs?: number;

    /**
     * Additional platform-specific metadata
     */
    [key: string]: any;
  };
}

/**
 * Common interface for all scraping platform services
 * Enables swapping between ScrapingDog, Scrapfly, or other providers
 */
export interface IScrapingPlatform {
  /**
   * Fetch HTML content from a URL
   * @param url - Target URL to scrape
   * @param options - Platform-agnostic options (dynamic, premium, country, etc.)
   * @returns HTML content and response metadata
   */
  fetchHtml(url: string, options?: ScrapingPlatformOptions): Promise<ScrapingPlatformResponse>;

  /**
   * Check if the platform service is properly configured
   * @returns true if API key/credentials are available
   */
  isConfigured(): boolean;
}
