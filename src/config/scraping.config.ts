/**
 * Scraping platform providers
 */
export type ScrapingPlatformProvider = 'scrapingdog' | 'scrapfly';

/**
 * Scraping module configuration
 */
export interface ScrapingConfig {
  /**
   * Platform provider selection
   */
  platform: {
    /**
     * Active scraping platform provider
     */
    provider: ScrapingPlatformProvider;
  };

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
   * Scrapfly API configuration
   */
  scrapfly: {
    /**
     * Scrapfly API key
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
   * Media configuration for filtering and downloading
   */
  media: {
    /**
     * Minimum relevance score for media to be downloaded (0-1)
     */
    minRelevanceScore: number;

    /**
     * Minimum image dimensions to auto-approve (skip relevance check)
     */
    minImageDimensions: {
      width: number;
      height: number;
    };

    /**
     * Supported media formats
     */
    supportedFormats: string[];

    /**
     * Minimum file size in KB
     */
    minFileSizeKb: number;
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

  /**
   * Protected fields that cannot be modified by scraping
   * These fields are manually curated and should not be overwritten
   */
  protectedFields: string[];
}

/**
 * Create scraping configuration from environment variables
 */
export function createScrapingConfigFromEnv(): ScrapingConfig {
  return {
    platform: {
      provider: (process.env.SCRAPING_PLATFORM_PROVIDER as ScrapingPlatformProvider) || 'scrapingdog',
    },
    scrapingdog: {
      apiKey: process.env.SCRAPINGDOG_API_KEY || '',
    },
    scrapfly: {
      apiKey: process.env.SCRAPFLY_API_KEY || '',
    },
    delay: {
      betweenRequestsMs: parseInt(process.env.SCRAPING_DELAY_BETWEEN_REQUESTS_MS || '4000', 10),
    },
    media: {
      minRelevanceScore: parseFloat(process.env.SCRAPING_MEDIA_MIN_RELEVANCE_SCORE || '0.7'),
      minImageDimensions: {
        width: parseInt(process.env.SCRAPING_MEDIA_MIN_IMAGE_WIDTH || '420', 10),
        height: parseInt(process.env.SCRAPING_MEDIA_MIN_IMAGE_HEIGHT || '420', 10),
      },
      supportedFormats: (process.env.SCRAPING_MEDIA_SUPPORTED_FORMATS || 'jpg,jpeg,png,avif,webp,mp4,webm,avi').split(','),
      minFileSizeKb: parseInt(process.env.SCRAPING_MEDIA_MIN_SIZE_KB || '50', 10),
    },
    retry: {
      maxAttempts: parseInt(process.env.SCRAPING_RETRY_MAX_ATTEMPTS || '3', 10),
      delayMs: parseInt(process.env.SCRAPING_RETRY_DELAY_MS || '1000', 10),
      backoffMultiplier: parseFloat(process.env.SCRAPING_RETRY_BACKOFF || '2'),
    },
    protectedFields: ['name', 'url', 'video', 'highlight', 'featured_image', 'type'],
  };
}

/**
 * Default scraping configuration
 */
export const DEFAULT_SCRAPING_CONFIG: ScrapingConfig = {
  platform: {
    provider: 'scrapingdog',
  },
  scrapingdog: {
    apiKey: '',
  },
  scrapfly: {
    apiKey: '',
  },
  delay: {
    betweenRequestsMs: 4000,
  },
  media: {
    minRelevanceScore: 0.7,
    minImageDimensions: {
      width: 420,
      height: 420,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'avif', 'webp', 'mp4', 'webm', 'avi'],
    minFileSizeKb: 50,
  },
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
  },
  protectedFields: ['name', 'url', 'video', 'highlight', 'featured_image', 'type'],
};
