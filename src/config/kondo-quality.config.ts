export interface KondoQualityConfig {
  threshold: number;
  contentWeights: {
    basicInfo: number;
    pricing: number;
    conveniences: number;
    additionalDetails: number;
  };
  mediaWeights: {
    images: number;
    imageQuality: number;
    videos: number;
    mediaRecency: number;
  };
}

export interface QualityScores {
  contentQuality: number;
  mediaQuality: number;
  overallQuality: number;
}

export interface QualityAssessment extends QualityScores {
  kondoId: number;
  meetsThreshold: boolean;
  lastUpdated: Date;
  breakdown: {
    content: {
      basicInfo: number;
      pricing: number;
      conveniences: number;
      details: number;
    };
    media: {
      images: number;
      quality: number;
      videos: number;
      recency: number;
    };
  };
}

export const DEFAULT_KONDO_QUALITY_CONFIG: KondoQualityConfig = {
  threshold: 0.7,
  contentWeights: {
    basicInfo: 0.2,
    pricing: 0.3,
    conveniences: 0.3,
    additionalDetails: 0.2,
  },
  mediaWeights: {
    images: 0.4,
    imageQuality: 0.3,
    videos: 0.2,
    mediaRecency: 0.1,
  },
};

/**
 * Validates that the quality configuration is properly structured
 */
export function validateKondoQualityConfig(config: KondoQualityConfig): void {
  // Validate threshold
  if (config.threshold < 0.0 || config.threshold > 1.0) {
    throw new Error('KONDO_QUALITY_THRESHOLD must be between 0.0 and 1.0');
  }

  // Validate content weights sum to 1.0 (with small tolerance for floating point)
  const contentSum = Object.values(config.contentWeights).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(contentSum - 1.0) > 0.001) {
    throw new Error(`Content weights must sum to 1.0, got ${contentSum}`);
  }

  // Validate media weights sum to 1.0 (with small tolerance for floating point)
  const mediaSum = Object.values(config.mediaWeights).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(mediaSum - 1.0) > 0.001) {
    throw new Error(`Media weights must sum to 1.0, got ${mediaSum}`);
  }

  // Validate all weights are positive
  const allWeights = [...Object.values(config.contentWeights), ...Object.values(config.mediaWeights)];
  const hasNegativeWeight = allWeights.some(weight => weight < 0);
  if (hasNegativeWeight) {
    throw new Error('All weights must be non-negative');
  }
}

/**
 * Creates a KondoQualityConfig from environment variables with fallbacks to defaults
 */
export function createKondoQualityConfigFromEnv(): KondoQualityConfig {
  const config: KondoQualityConfig = {
    threshold: parseFloat(process.env.KONDO_QUALITY_THRESHOLD || DEFAULT_KONDO_QUALITY_CONFIG.threshold.toString()),
    contentWeights: {
      basicInfo: parseFloat(process.env.KONDO_CONTENT_WEIGHT_BASIC_INFO || DEFAULT_KONDO_QUALITY_CONFIG.contentWeights.basicInfo.toString()),
      pricing: parseFloat(process.env.KONDO_CONTENT_WEIGHT_PRICING || DEFAULT_KONDO_QUALITY_CONFIG.contentWeights.pricing.toString()),
      conveniences: parseFloat(process.env.KONDO_CONTENT_WEIGHT_CONVENIENCES || DEFAULT_KONDO_QUALITY_CONFIG.contentWeights.conveniences.toString()),
      additionalDetails: parseFloat(process.env.KONDO_CONTENT_WEIGHT_ADDITIONAL_DETAILS || DEFAULT_KONDO_QUALITY_CONFIG.contentWeights.additionalDetails.toString()),
    },
    mediaWeights: {
      images: parseFloat(process.env.KONDO_MEDIA_WEIGHT_IMAGES || DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights.images.toString()),
      imageQuality: parseFloat(process.env.KONDO_MEDIA_WEIGHT_IMAGE_QUALITY || DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights.imageQuality.toString()),
      videos: parseFloat(process.env.KONDO_MEDIA_WEIGHT_VIDEOS || DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights.videos.toString()),
      mediaRecency: parseFloat(process.env.KONDO_MEDIA_WEIGHT_RECENCY || DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights.mediaRecency.toString()),
    },
  };

  validateKondoQualityConfig(config);
  return config;
}
