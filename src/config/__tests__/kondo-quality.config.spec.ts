import {
  KondoQualityConfig,
  DEFAULT_KONDO_QUALITY_CONFIG,
  validateKondoQualityConfig,
  createKondoQualityConfigFromEnv,
} from '../kondo-quality.config';

describe('KondoQualityConfig', () => {
  describe('validateKondoQualityConfig', () => {
    it('should validate default configuration without errors', () => {
      expect(() => validateKondoQualityConfig(DEFAULT_KONDO_QUALITY_CONFIG)).not.toThrow();
    });

    it('should throw error when threshold is below 0.0', () => {
      const config = { ...DEFAULT_KONDO_QUALITY_CONFIG, threshold: -0.1 };
      expect(() => validateKondoQualityConfig(config)).toThrow(
        'KONDO_QUALITY_THRESHOLD must be between 0.0 and 1.0'
      );
    });

    it('should throw error when threshold is above 1.0', () => {
      const config = { ...DEFAULT_KONDO_QUALITY_CONFIG, threshold: 1.1 };
      expect(() => validateKondoQualityConfig(config)).toThrow(
        'KONDO_QUALITY_THRESHOLD must be between 0.0 and 1.0'
      );
    });

    it('should accept threshold at boundaries (0.0 and 1.0)', () => {
      const config1 = { ...DEFAULT_KONDO_QUALITY_CONFIG, threshold: 0.0 };
      const config2 = { ...DEFAULT_KONDO_QUALITY_CONFIG, threshold: 1.0 };
      
      expect(() => validateKondoQualityConfig(config1)).not.toThrow();
      expect(() => validateKondoQualityConfig(config2)).not.toThrow();
    });

    it('should throw error when content weights do not sum to 1.0', () => {
      const config = {
        ...DEFAULT_KONDO_QUALITY_CONFIG,
        contentWeights: {
          basicInfo: 0.3,
          pricing: 0.3,
          conveniences: 0.3,
          additionalDetails: 0.2, // Sum = 1.1
        },
      };
      
      expect(() => validateKondoQualityConfig(config)).toThrow(
        /Content weights must sum to 1\.0, got 1\.0?9+/
      );
    });

    it('should throw error when media weights do not sum to 1.0', () => {
      const config = {
        ...DEFAULT_KONDO_QUALITY_CONFIG,
        mediaWeights: {
          images: 0.5,
          imageQuality: 0.3,
          videos: 0.1,
          mediaRecency: 0.05, // Sum = 0.95
        },
      };
      
      expect(() => validateKondoQualityConfig(config)).toThrow(
        'Media weights must sum to 1.0, got 0.95'
      );
    });

    it('should allow small floating point tolerance in weight sums', () => {
      const config = {
        ...DEFAULT_KONDO_QUALITY_CONFIG,
        contentWeights: {
          basicInfo: 0.2001, // Small floating point difference
          pricing: 0.3,
          conveniences: 0.3,
          additionalDetails: 0.1999,
        },
      };
      
      expect(() => validateKondoQualityConfig(config)).not.toThrow();
    });

    it('should throw error when any weight is negative', () => {
      const config = {
        ...DEFAULT_KONDO_QUALITY_CONFIG,
        contentWeights: {
          basicInfo: -0.1,
          pricing: 0.4,
          conveniences: 0.4,
          additionalDetails: 0.3,
        },
      };
      
      expect(() => validateKondoQualityConfig(config)).toThrow(
        'All weights must be non-negative'
      );
    });
  });

  describe('createKondoQualityConfigFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should use default values when no environment variables are set', () => {
      // Clear relevant env vars
      delete process.env.KONDO_QUALITY_THRESHOLD;
      delete process.env.KONDO_CONTENT_WEIGHT_BASIC_INFO;
      
      const config = createKondoQualityConfigFromEnv();
      
      expect(config).toEqual(DEFAULT_KONDO_QUALITY_CONFIG);
    });

    it('should use environment variable for threshold', () => {
      process.env.KONDO_QUALITY_THRESHOLD = '0.8';
      
      const config = createKondoQualityConfigFromEnv();
      
      expect(config.threshold).toBe(0.8);
      expect(config.contentWeights).toEqual(DEFAULT_KONDO_QUALITY_CONFIG.contentWeights);
      expect(config.mediaWeights).toEqual(DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights);
    });

    it('should use environment variables for content weights', () => {
      process.env.KONDO_CONTENT_WEIGHT_BASIC_INFO = '0.1';
      process.env.KONDO_CONTENT_WEIGHT_PRICING = '0.4';
      process.env.KONDO_CONTENT_WEIGHT_CONVENIENCES = '0.4';
      process.env.KONDO_CONTENT_WEIGHT_ADDITIONAL_DETAILS = '0.1';
      
      const config = createKondoQualityConfigFromEnv();
      
      expect(config.contentWeights).toEqual({
        basicInfo: 0.1,
        pricing: 0.4,
        conveniences: 0.4,
        additionalDetails: 0.1,
      });
    });

    it('should use environment variables for media weights', () => {
      process.env.KONDO_MEDIA_WEIGHT_IMAGES = '0.5';
      process.env.KONDO_MEDIA_WEIGHT_IMAGE_QUALITY = '0.2';
      process.env.KONDO_MEDIA_WEIGHT_VIDEOS = '0.2';
      process.env.KONDO_MEDIA_WEIGHT_RECENCY = '0.1';
      
      const config = createKondoQualityConfigFromEnv();
      
      expect(config.mediaWeights).toEqual({
        images: 0.5,
        imageQuality: 0.2,
        videos: 0.2,
        mediaRecency: 0.1,
      });
    });

    it('should throw error when environment variables create invalid configuration', () => {
      process.env.KONDO_QUALITY_THRESHOLD = '1.5'; // Invalid threshold
      
      expect(() => createKondoQualityConfigFromEnv()).toThrow(
        'KONDO_QUALITY_THRESHOLD must be between 0.0 and 1.0'
      );
    });

    it('should throw error when content weights from env vars do not sum to 1.0', () => {
      process.env.KONDO_CONTENT_WEIGHT_BASIC_INFO = '0.5';
      process.env.KONDO_CONTENT_WEIGHT_PRICING = '0.5';
      process.env.KONDO_CONTENT_WEIGHT_CONVENIENCES = '0.5';
      process.env.KONDO_CONTENT_WEIGHT_ADDITIONAL_DETAILS = '0.5'; // Sum = 2.0
      
      expect(() => createKondoQualityConfigFromEnv()).toThrow(
        'Content weights must sum to 1.0, got 2'
      );
    });

    it('should handle partial environment variable overrides', () => {
      process.env.KONDO_QUALITY_THRESHOLD = '0.8';
      process.env.KONDO_CONTENT_WEIGHT_BASIC_INFO = '0.1';
      // Other weights should use defaults, but they need to sum to 1.0
      process.env.KONDO_CONTENT_WEIGHT_PRICING = '0.3';
      process.env.KONDO_CONTENT_WEIGHT_CONVENIENCES = '0.3';
      process.env.KONDO_CONTENT_WEIGHT_ADDITIONAL_DETAILS = '0.3';
      
      const config = createKondoQualityConfigFromEnv();
      
      expect(config.threshold).toBe(0.8);
      expect(config.contentWeights.basicInfo).toBe(0.1);
      expect(config.contentWeights.pricing).toBe(0.3);
      expect(config.mediaWeights).toEqual(DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights);
    });
  });

  describe('Default Configuration Structure', () => {
    it('should have valid default configuration structure', () => {
      expect(DEFAULT_KONDO_QUALITY_CONFIG).toHaveProperty('threshold');
      expect(DEFAULT_KONDO_QUALITY_CONFIG).toHaveProperty('contentWeights');
      expect(DEFAULT_KONDO_QUALITY_CONFIG).toHaveProperty('mediaWeights');
      
      expect(DEFAULT_KONDO_QUALITY_CONFIG.contentWeights).toHaveProperty('basicInfo');
      expect(DEFAULT_KONDO_QUALITY_CONFIG.contentWeights).toHaveProperty('pricing');
      expect(DEFAULT_KONDO_QUALITY_CONFIG.contentWeights).toHaveProperty('conveniences');
      expect(DEFAULT_KONDO_QUALITY_CONFIG.contentWeights).toHaveProperty('additionalDetails');
      
      expect(DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights).toHaveProperty('images');
      expect(DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights).toHaveProperty('imageQuality');
      expect(DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights).toHaveProperty('videos');
      expect(DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights).toHaveProperty('mediaRecency');
    });

    it('should have content weights that sum to 1.0', () => {
      const sum = Object.values(DEFAULT_KONDO_QUALITY_CONFIG.contentWeights)
        .reduce((acc, weight) => acc + weight, 0);
      
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should have media weights that sum to 1.0', () => {
      const sum = Object.values(DEFAULT_KONDO_QUALITY_CONFIG.mediaWeights)
        .reduce((acc, weight) => acc + weight, 0);
      
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should have threshold of 0.7', () => {
      expect(DEFAULT_KONDO_QUALITY_CONFIG.threshold).toBe(0.7);
    });
  });
});
