/**
 * Generic platform options for any scraping service
 * Compatible with both ScrapingDog and Scrapfly
 */
export interface ScrapingPlatformOptions {
  /**
   * Enable JavaScript rendering for dynamic content
   * ScrapingDog: 'dynamic' parameter
   * Scrapfly: 'render_js' parameter (must be true for wait_for_selector)
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
   * CSS selector to wait for before considering page loaded (for SPAs)
   * Scrapfly: 'wait_for_selector' parameter
   * Note: Requires render_js=true
   */
  waitForSelector?: string;

  /**
   * Time to wait after page load for rendering (milliseconds)
   * Scrapfly: 'rendering_wait' parameter
   * Typical: 3000-8000ms for SPAs
   */
  renderingWait?: number;

  /**
   * Total timeout for the request (milliseconds)
   * Scrapfly: 'timeout' parameter
   * Default: 30000ms, increase for slow SPAs
   */
  timeout?: number;

  /**
   * Enable anti-scraping protection (upgrades proxy/browser)
   * Scrapfly: 'asp' parameter
   * Note: Can be used alongside render_js
   */
  asp?: boolean;

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
