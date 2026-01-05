/**
 * Scraping platform providers
 */
export type ScrapingPlatformProvider = 'scrapingdog' | 'scrapfly';

/**
 * Protected field configuration mode
 */
export type ProtectedFieldMode = 'never' | 'if-empty' | 'quality-check';

/**
 * Protected field configuration
 */
export interface ProtectedFieldConfig {
  field: string;
  mode: ProtectedFieldMode;
}

/**
 * SPA (Single Page Application) detection and handling configuration
 */
export interface SPAConfig {
  /**
   * CSS selectors to wait for before considering page loaded
   */
  waitForSelectors: string[];

  /**
   * Maximum time to wait for selectors (milliseconds)
   */
  maxWaitTimeMs: number;

  /**
   * Whether to retry scraping if no images found on SPA
   */
  retryOnEmpty: boolean;

  /**
   * Extended wait time for retry attempt (milliseconds)
   */
  retryWaitTimeMs: number;
}

/**
 * Extraction confidence scoring configuration
 */
export interface ExtractionConfidenceConfig {
  /**
   * Minimum confidence threshold for manual extraction to be considered successful
   */
  manualExtractionThreshold: number;

  /**
   * Confidence weights for data richness scoring
   */
  confidenceWeights: {
    /**
     * Weight for data size (max contribution)
     */
    size: number;
    
    /**
     * Weight for object depth/nesting (max contribution)
     */
    depth: number;
    
    /**
     * Weight for property-relevant keywords (max contribution)
     */
    keywords: number;
  };

  /**
   * Minimum text content length to not be considered an SPA shell
   */
  minTextContentLength: number;

  /**
   * Keywords to check for in extracted data to boost confidence
   */
  relevantKeywords: string[];
}

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
   * SPA (Single Page Application) handling configuration
   */
  spa: SPAConfig;

  /**
   * Extraction confidence scoring configuration
   */
  extractionConfidence: ExtractionConfidenceConfig;

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
   * Supports both simple string format and advanced config with modes:
   * - 'never': Never allow overwriting
   * - 'if-empty': Only allow if existing value is empty/null
   * - 'quality-check': Allow but subject to quality validation
   */
  protectedFields: Array<string | ProtectedFieldConfig>;
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
    spa: {
      waitForSelectors: (process.env.SCRAPING_SPA_WAIT_SELECTORS || 'img,picture,article,main img').split(','),
      maxWaitTimeMs: parseInt(process.env.SCRAPING_SPA_MAX_WAIT_MS || '10000', 10),
      retryOnEmpty: process.env.SCRAPING_SPA_RETRY_ON_EMPTY !== 'false',
      retryWaitTimeMs: parseInt(process.env.SCRAPING_SPA_RETRY_WAIT_MS || '15000', 10),
    },
    extractionConfidence: {
      manualExtractionThreshold: parseFloat(process.env.SCRAPING_EXTRACTION_THRESHOLD || '0.5'),
      confidenceWeights: {
        size: parseFloat(process.env.SCRAPING_CONFIDENCE_WEIGHT_SIZE || '0.4'),
        depth: parseFloat(process.env.SCRAPING_CONFIDENCE_WEIGHT_DEPTH || '0.3'),
        keywords: parseFloat(process.env.SCRAPING_CONFIDENCE_WEIGHT_KEYWORDS || '0.3'),
      },
      minTextContentLength: parseInt(process.env.SCRAPING_MIN_TEXT_CONTENT_LENGTH || '500', 10),
      relevantKeywords: (process.env.SCRAPING_RELEVANT_KEYWORDS || 'image,photo,gallery,description,amenity,feature,price,location,address,title,lazer,diferenciais').split(','),
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
    protectedFields: [
      // Never overwrite these fields (manually curated)
      { field: 'name', mode: 'never' as const },
      { field: 'url', mode: 'never' as const },
      { field: 'highlight', mode: 'never' as const },
      { field: 'type', mode: 'never' as const },
      
      // Only update if empty
      { field: 'featured_image', mode: 'if-empty' as const },
      { field: 'video', mode: 'if-empty' as const },
      
      // Allow updates with quality checks
      { field: 'description', mode: 'quality-check' as const },
      { field: 'address_street_and_numbers', mode: 'quality-check' as const },
    ],
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
  spa: {
    waitForSelectors: ['img', 'picture', 'article', 'main img'],
    maxWaitTimeMs: 10000,
    retryOnEmpty: true,
    retryWaitTimeMs: 15000,
  },
  extractionConfidence: {
    manualExtractionThreshold: 0.5,
    confidenceWeights: {
      size: 0.4,
      depth: 0.3,
      keywords: 0.3,
    },
    minTextContentLength: 500,
    relevantKeywords: [
      'image', 'photo', 'gallery', 'description', 'amenity', 
      'feature', 'price', 'location', 'address', 'title',
      'lazer', 'diferenciais', 'empreendimento', 'unidades'
    ],
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
  protectedFields: [
    // Never overwrite these fields (manually curated)
    { field: 'name', mode: 'never' as const },
    { field: 'url', mode: 'never' as const },
    { field: 'highlight', mode: 'never' as const },
    { field: 'type', mode: 'never' as const },
    
    // Only update if empty
    { field: 'featured_image', mode: 'if-empty' as const },
    { field: 'video', mode: 'if-empty' as const },
    
    // Allow updates with quality checks
    { field: 'description', mode: 'quality-check' as const },
    { field: 'address_street_and_numbers', mode: 'quality-check' as const },
  ],
};
