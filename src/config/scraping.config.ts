/**
 * Scraping module configuration
 */
export interface ScrapingConfig {
  /**
   * ScrapingDog API configuration
   */
  scrapingdog: {
    /**
     * ScrapingDog API key
     */
    apiKey: string;
  };

  /**
   * Delay configuration between scraping requests
   */
  delay: {
    /**
     * Delay in milliseconds between consecutive scraping requests
     */
    betweenRequestsMs: number;
  };

  /**
   * Retry configuration for failed scraping attempts
   */
  retry: {
    /**
     * Maximum number of retry attempts
     */
    maxAttempts: number;

    /**
     * Initial delay in milliseconds before first retry
     */
    delayMs: number;

    /**
     * Multiplier for exponential backoff
     */
    backoffMultiplier: number;
  };
}

/**
 * Create scraping configuration from environment variables
 */
export function createScrapingConfigFromEnv(): ScrapingConfig {
  return {
    scrapingdog: {
      apiKey: process.env.SCRAPINGDOG_API_KEY || '',
    },
    delay: {
      betweenRequestsMs: parseInt(process.env.SCRAPING_DELAY_BETWEEN_REQUESTS_MS || '4000', 10),
    },
    retry: {
      maxAttempts: parseInt(process.env.SCRAPING_RETRY_MAX_ATTEMPTS || '3', 10),
      delayMs: parseInt(process.env.SCRAPING_RETRY_DELAY_MS || '1000', 10),
      backoffMultiplier: parseFloat(process.env.SCRAPING_RETRY_BACKOFF || '2'),
    },
  };
}

/**
 * Default scraping configuration
 */
export const DEFAULT_SCRAPING_CONFIG: ScrapingConfig = {
  scrapingdog: {
    apiKey: '',
  },
  delay: {
    betweenRequestsMs: 4000,
  },
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
  },
};
