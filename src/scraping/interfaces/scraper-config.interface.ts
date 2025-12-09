/**
 * ScrapingDog API options
 */
export interface ScrapingDogOptions {
  /**
   * Enable JavaScript rendering for dynamic content
   */
  dynamic?: boolean;

  /**
   * Use premium proxy pool
   */
  premium?: boolean;

  /**
   * Country code for geo-targeting (e.g., 'br' for Brazil)
   */
  country?: string;

  /**
   * Additional query parameters to pass to ScrapingDog
   */
  extraParams?: Record<string, string>;
}

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
