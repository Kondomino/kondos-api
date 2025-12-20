/**
 * Generic platform options for any scraping service
 * Compatible with both ScrapingDog and Scrapfly
 */
export interface ScrapingPlatformOptions {
  /**
   * Enable JavaScript rendering for dynamic content
   * ScrapingDog: 'dynamic' parameter
   * Scrapfly: 'asp' parameter (anti-scraping protection + JS)
   */
  dynamic?: boolean;

  /**
   * Use premium/residential proxy pool
   * ScrapingDog: 'premium' parameter
   * Scrapfly: 'proxy_pool' parameter
   */
  premium?: boolean;

  /**
   * Country code for geo-targeting (e.g., 'br' for Brazil)
   * Both platforms: 'country' parameter
   */
  country?: string;

  /**
   * Additional query parameters to pass to the platform
   */
  extraParams?: Record<string, string>;
}

/**
 * @deprecated Use ScrapingPlatformOptions instead
 */
export interface ScrapingDogOptions extends ScrapingPlatformOptions {}

/**
 * Retry configuration
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  delayMs?: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;
}

/**
 * Scraping command options
 */
export interface ScrapeOptions {
  /**
   * Filter by specific platform
   */
  platform?: string;

  /**
   * Scrape only a specific kondo by ID
   */
  kondoId?: number;

  /**
   * Run without writing to database
   */
  dryRun?: boolean;

  /**
   * Enable verbose logging
   */
  verbose?: boolean;

  /**
   * Skip delay between requests (useful for testing)
   */
  skipDelay?: boolean;
}
