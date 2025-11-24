import { KondoContentAnalyzerService } from '../../services/kondo-content-analyzer.service';
import { DEFAULT_KONDO_QUALITY_CONFIG } from '../../../config/kondo-quality.config';

// Mock data interfaces for testing (avoiding Sequelize model instantiation)
interface MockKondo {
  id: number;
  name?: string;
  status?: string;
  type?: string;
  description?: string;
  minutes_from_bh?: string;
  cep?: string;
  address_street_and_numbers?: string;
  neighborhood?: string;
  city?: string;
  lot_avg_price?: number;
  condo_rent?: number;
  finance?: boolean;
  finance_tranches?: string;
  entry_value_percentage?: string;
  infra_pool?: boolean;
  infra_gym?: boolean;
  infra_security_team?: boolean;
  infra_parking_lot?: boolean;
  infra_description?: string;
  phone?: string;
  email?: string;
  url?: string;
  total_area?: string;
  lots_available?: boolean;
  lots_min_size?: string;
  video?: string;
  active?: boolean;
  highlight?: boolean;
  slug?: string;
  featured_image?: string;
  [key: string]: any;
}

interface MockMedia {
  type: string;
  status: 'final' | 'draft';
  filename?: string;
  file_size?: number;
  mime_type?: string;
  createdAt?: Date;
}

describe('KondoContentAnalyzerService', () => {
  let service: KondoContentAnalyzerService;

  beforeEach(() => {
    service = new KondoContentAnalyzerService();
  });

  describe('analyzeContentQuality', () => {
    it('should analyze core attributes correctly', () => {
      const kondo: MockKondo = {
        id: 1,
        name: 'Test Kondo',
        status: 'done',
        type: 'predios',
        description: 'A beautiful condominium',
      };

      const breakdown = service.analyzeContentQuality(kondo as any, DEFAULT_KONDO_QUALITY_CONFIG);

      expect(breakdown.basicInfo).toBe(0.4); // 4 core attributes × 0.1 each
      expect(breakdown.pricing).toBe(0); // No other attributes
      expect(breakdown.conveniences).toBe(0); // Not used in new system
      expect(breakdown.details).toBe(0); // No secondary attributes
    });

    it('should analyze secondary attributes correctly', () => {
      const kondo: MockKondo = {
        id: 1,
        minutes_from_bh: '30',
        cep: '30000-000',
        address_street_and_numbers: 'Rua Test, 123',
        neighborhood: 'Centro',
        city: 'Belo Horizonte',
      };

      const breakdown = service.analyzeContentQuality(kondo as any, DEFAULT_KONDO_QUALITY_CONFIG);

      expect(breakdown.basicInfo).toBe(0); // No core attributes
      expect(breakdown.pricing).toBe(0); // No other attributes
      expect(breakdown.conveniences).toBe(0); // Not used in new system
      expect(breakdown.details).toBe(0.25); // 5 secondary attributes × 0.05 each
    });

    it('should analyze other attributes correctly', () => {
      const kondo: MockKondo = {
        id: 1,
        active: true,
        highlight: true,
        slug: 'test-kondo',
        featured_image: 'image.jpg',
        lot_avg_price: 50000,
        condo_rent: 200,
        finance: true,
        lots_available: true,
        infra_pool: true,
        infra_gym: true,
      };

      const breakdown = service.analyzeContentQuality(kondo as any, DEFAULT_KONDO_QUALITY_CONFIG);

      expect(breakdown.basicInfo).toBe(0); // No core attributes
      expect(breakdown.pricing).toBeCloseTo(0.1, 2); // 10 other attributes × 0.01 each
      expect(breakdown.conveniences).toBe(0); // Not used in new system
      expect(breakdown.details).toBe(0); // No secondary attributes
    });

    it('should analyze mixed attributes correctly', () => {
      const kondo: MockKondo = {
        id: 1,
        // Core attributes
        name: 'Test Kondo',
        status: 'done',
        // Secondary attributes
        cep: '30000-000',
        city: 'Belo Horizonte',
        // Other attributes
        active: true,
        finance: true,
        infra_pool: true,
      };

      const breakdown = service.analyzeContentQuality(kondo as any, DEFAULT_KONDO_QUALITY_CONFIG);

      expect(breakdown.basicInfo).toBe(0.2); // 2 core attributes × 0.1 each
      expect(breakdown.pricing).toBe(0.03); // 3 other attributes × 0.01 each
      expect(breakdown.conveniences).toBe(0); // Not used in new system
      expect(breakdown.details).toBe(0.1); // 2 secondary attributes × 0.05 each
    });
  });

  describe('analyzeMediaQuality', () => {
    it('should analyze final status media correctly', () => {
      const medias: MockMedia[] = [
        { type: 'image', status: 'final', mime_type: 'image/jpeg' },
        { type: 'image', status: 'final', mime_type: 'image/png' },
        { type: 'video', status: 'final', mime_type: 'video/mp4' },
      ];

      const breakdown = service.analyzeMediaQuality(
        { id: 1 } as any, 
        medias as any, 
        DEFAULT_KONDO_QUALITY_CONFIG
      );

      expect(breakdown.images).toBe(0.27); // 3 final media × 0.09 each
      expect(breakdown.quality).toBe(0); // Not used in new system
      expect(breakdown.videos).toBe(0); // Not used in new system
      expect(breakdown.recency).toBe(0); // Not used in new system
    });

    it('should ignore draft status media', () => {
      const medias: MockMedia[] = [
        { type: 'image', status: 'draft', mime_type: 'image/jpeg' },
        { type: 'image', status: 'final', mime_type: 'image/png' },
        { type: 'video', status: 'draft', mime_type: 'video/mp4' },
      ];

      const breakdown = service.analyzeMediaQuality(
        { id: 1 } as any, 
        medias as any, 
        DEFAULT_KONDO_QUALITY_CONFIG
      );

      expect(breakdown.images).toBe(0.09); // Only 1 final media × 0.09
    });

    it('should handle mixed media types with final status', () => {
      const medias: MockMedia[] = [
        { type: 'image', status: 'final', filename: 'photo1.jpg' },
        { type: 'image', status: 'final', filename: 'photo2.jpg' },
        { type: 'video', status: 'final', filename: 'tour.mp4' },
        { type: 'image', status: 'draft', filename: 'draft.jpg' },
      ];

      const breakdown = service.analyzeMediaQuality(
        { id: 1 } as any, 
        medias as any, 
        DEFAULT_KONDO_QUALITY_CONFIG
      );

      expect(breakdown.images).toBe(0.27); // 3 final media × 0.09 each
    });

    it('should handle empty media array', () => {
      const breakdown = service.analyzeMediaQuality(
        { id: 1 } as any, 
        [], 
        DEFAULT_KONDO_QUALITY_CONFIG
      );

      expect(breakdown.images).toBe(0);
      expect(breakdown.quality).toBe(0);
      expect(breakdown.videos).toBe(0);
      expect(breakdown.recency).toBe(0);
    });

    it('should handle media array with no final status', () => {
      const medias: MockMedia[] = [
        { type: 'image', status: 'draft', mime_type: 'image/jpeg' },
        { type: 'video', status: 'draft', mime_type: 'video/mp4' },
      ];

      const breakdown = service.analyzeMediaQuality(
        { id: 1 } as any, 
        medias as any, 
        DEFAULT_KONDO_QUALITY_CONFIG
      );

      expect(breakdown.images).toBe(0); // No final media
    });
  });

  describe('calculateContentScore', () => {
    it('should calculate content score correctly using new system', () => {
      const breakdown = {
        basicInfo: 0.4,    // Core attributes
        pricing: 0.1,      // Other attributes
        conveniences: 0,   // Not used
        details: 0.25,     // Secondary attributes
      };

      const score = service.calculateContentScore(breakdown, DEFAULT_KONDO_QUALITY_CONFIG);

      // Expected: 0.4 + 0.1 + 0.25 = 0.75
      expect(score).toBeCloseTo(0.75, 2);
    });

    it('should clamp score between 0 and 1', () => {
      const highBreakdown = {
        basicInfo: 0.8,    // High core score
        pricing: 0.5,      // High other score
        conveniences: 0,   // Not used
        details: 0.3,      // High secondary score
      };

      const score = service.calculateContentScore(highBreakdown, DEFAULT_KONDO_QUALITY_CONFIG);
      // 0.8 + 0.5 + 0.3 = 1.6, should be clamped to 1.0
      expect(score).toBe(1.0);
    });

    it('should handle zero scores correctly', () => {
      const zeroBreakdown = {
        basicInfo: 0,
        pricing: 0,
        conveniences: 0,
        details: 0,
      };

      const score = service.calculateContentScore(zeroBreakdown, DEFAULT_KONDO_QUALITY_CONFIG);
      expect(score).toBe(0);
    });
  });

  describe('calculateMediaScore', () => {
    it('should calculate media score correctly using new system', () => {
      const breakdown = {
        images: 0.27,      // Final media contribution
        quality: 0,        // Not used
        videos: 0,         // Not used
        recency: 0,        // Not used
      };

      const score = service.calculateMediaScore(breakdown, DEFAULT_KONDO_QUALITY_CONFIG);

      // Expected: just the images value (0.27)
      expect(score).toBeCloseTo(0.27, 2);
    });

    it('should handle high media scores and clamp to 1.0', () => {
      const breakdown = {
        images: 1.5,       // Impossible high score to test clamping
        quality: 0,
        videos: 0,
        recency: 0,
      };

      const score = service.calculateMediaScore(breakdown, DEFAULT_KONDO_QUALITY_CONFIG);
      expect(score).toBe(1.0);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate overall score as sum of content and media (capped at 1.0)', () => {
      const contentScore = 0.6;
      const mediaScore = 0.3;

      const overallScore = service.calculateOverallScore(contentScore, mediaScore);

      expect(overallScore).toBeCloseTo(0.9, 2); // 0.6 + 0.3
    });

    it('should clamp overall score to 1.0 when sum exceeds 1.0', () => {
      const contentScore = 0.8;
      const mediaScore = 0.5;

      const overallScore = service.calculateOverallScore(contentScore, mediaScore);

      expect(overallScore).toBe(1.0); // 0.8 + 0.5 = 1.3, clamped to 1.0
    });

    it('should handle zero scores correctly', () => {
      const contentScore = 0;
      const mediaScore = 0;

      const overallScore = service.calculateOverallScore(contentScore, mediaScore);

      expect(overallScore).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle kondo with null/undefined values', () => {
      const kondo: MockKondo = {
        id: 1,
        name: null as any,
        status: undefined,
        type: null as any,
        description: undefined,
        city: undefined,
        lot_avg_price: null as any,
      };

      const breakdown = service.analyzeContentQuality(kondo as any, DEFAULT_KONDO_QUALITY_CONFIG);

      expect(breakdown.basicInfo).toBe(0); // No valid core attributes
      expect(breakdown.pricing).toBe(0); // No valid other attributes
      expect(breakdown.conveniences).toBe(0); // Not used
      expect(breakdown.details).toBe(0); // No valid secondary attributes
    });

    it('should handle media with null/undefined status', () => {
      const medias: MockMedia[] = [
        { type: 'image', status: null as any },
        { type: 'video', status: undefined as any },
        { type: 'image', status: 'final' },
      ];

      const breakdown = service.analyzeMediaQuality(
        { id: 1 } as any, 
        medias as any, 
        DEFAULT_KONDO_QUALITY_CONFIG
      );

      expect(breakdown.images).toBe(0.09); // Only 1 valid final media
      expect(breakdown.quality).toBe(0); // Not used
      expect(breakdown.videos).toBe(0); // Not used
      expect(breakdown.recency).toBe(0); // Not used
    });

    it('should handle empty string values correctly', () => {
      const kondo: MockKondo = {
        id: 1,
        name: '',
        status: '  ',  // Only whitespace
        type: 'predios',
        description: 'Valid description',
        city: '',
        cep: '   ', // Only whitespace
      };

      const breakdown = service.analyzeContentQuality(kondo as any, DEFAULT_KONDO_QUALITY_CONFIG);

      expect(breakdown.basicInfo).toBe(0.2); // Only type and description valid (2 × 0.1)
      expect(breakdown.pricing).toBe(0); // No other attributes
      expect(breakdown.details).toBe(0); // No valid secondary attributes (empty/whitespace strings)
    });
  });

  describe('integration tests with quality threshold', () => {
    it('should fail quality threshold with minimal attributes', () => {
      // Low quality kondo with minimal data - should fail threshold (0.7)
      const lowQualityKondo: MockKondo = {
        id: 1,
        // Core attributes (only 2 out of 4)
        name: 'Basic Kondo',
        type: 'casas',
        // Secondary attributes (only 1 out of 5)
        city: 'Belo Horizonte',
        // Other attributes (only 2)
        active: true,
        finance: true,
      };

      const lowQualityMedia: MockMedia[] = [
        // Only 1 final media
        { type: 'image', status: 'final', filename: 'photo1.jpg' },
        { type: 'image', status: 'draft', filename: 'draft.jpg' }, // Draft doesn't count
      ];

      const contentBreakdown = service.analyzeContentQuality(lowQualityKondo as any, DEFAULT_KONDO_QUALITY_CONFIG);
      const mediaBreakdown = service.analyzeMediaQuality(lowQualityKondo as any, lowQualityMedia as any, DEFAULT_KONDO_QUALITY_CONFIG);
      
      const contentScore = service.calculateContentScore(contentBreakdown, DEFAULT_KONDO_QUALITY_CONFIG);
      const mediaScore = service.calculateMediaScore(mediaBreakdown, DEFAULT_KONDO_QUALITY_CONFIG);
      const overallScore = service.calculateOverallScore(contentScore, mediaScore);

      // Expected scores:
      // Content: 2 core (0.2) + 1 secondary (0.05) + 2 other (0.02) = 0.27
      // Media: 1 final media (0.09) = 0.09
      // Overall: 0.27 + 0.09 = 0.36
      expect(contentScore).toBeCloseTo(0.27, 2);
      expect(mediaScore).toBeCloseTo(0.09, 2);
      expect(overallScore).toBeCloseTo(0.36, 2);
      expect(overallScore).toBeLessThan(DEFAULT_KONDO_QUALITY_CONFIG.threshold); // Should fail 0.7 threshold
    });

    it('should pass quality threshold with comprehensive attributes', () => {
      // High quality kondo with extensive data - should pass threshold (0.7)
      const highQualityKondo: MockKondo = {
        id: 2,
        // Core attributes (all 4)
        name: 'Luxury Condominium Resort',
        status: 'done',
        type: 'predios',
        description: 'A premium residential condominium with world-class amenities and stunning architecture in the heart of Belo Horizonte.',
        
        // Secondary attributes (all 5)
        minutes_from_bh: '15',
        cep: '30112-000',
        address_street_and_numbers: 'Avenida Afonso Pena, 1500',
        neighborhood: 'Centro',
        city: 'Belo Horizonte',
        
        // Other attributes (many filled)
        active: true,
        highlight: true,
        slug: 'luxury-condominium-resort',
        featured_image: 'luxury-main.jpg',
        lot_avg_price: 850000,
        condo_rent: 2500,
        lots_available: true,
        lots_min_size: '400m²',
        finance: true,
        finance_tranches: '120x',
        finance_fees: false,
        entry_value_percentage: '30%',
        infra_description: 'Complete infrastructure with premium amenities including spa, fitness center, and concierge services.',
        infra_lobby_24h: true,
        infra_security_team: true,
        infra_wall: true,
        infra_sports_court: true,
        infra_barbecue_zone: true,
        infra_pool: true,
        infra_living_space: true,
        infra_pet_area: true,
        infra_kids_area: true,
        infra_eletricity: true,
        infra_water: true,
        infra_sidewalks: true,
        infra_internet: true,
        infra_generates_power: true,
        infra_grass_area: true,
        infra_gourmet_area: true,
        infra_parking_lot: true,
        infra_gym: true,
        infra_gardens: true,
        phone: '+55 31 3333-4444',
        email: 'contato@luxurycondo.com.br',
        url: 'https://luxurycondo.com.br',
        total_area: '25000m²',
        video: 'https://youtube.com/watch?v=luxury-tour',
      };

      const highQualityMedia: MockMedia[] = [
        // Multiple final media
        { type: 'image', status: 'final', filename: 'facade.jpg' },
        { type: 'image', status: 'final', filename: 'lobby.jpg' },
        { type: 'image', status: 'final', filename: 'pool.jpg' },
        { type: 'image', status: 'final', filename: 'gym.jpg' },
        { type: 'image', status: 'final', filename: 'apartment.jpg' },
        { type: 'video', status: 'final', filename: 'virtual-tour.mp4' },
        { type: 'video', status: 'final', filename: 'amenities.mp4' },
        { type: 'image', status: 'draft', filename: 'draft-photo.jpg' }, // Draft doesn't count
      ];

      const contentBreakdown = service.analyzeContentQuality(highQualityKondo as any, DEFAULT_KONDO_QUALITY_CONFIG);
      const mediaBreakdown = service.analyzeMediaQuality(highQualityKondo as any, highQualityMedia as any, DEFAULT_KONDO_QUALITY_CONFIG);
      
      const contentScore = service.calculateContentScore(contentBreakdown, DEFAULT_KONDO_QUALITY_CONFIG);
      const mediaScore = service.calculateMediaScore(mediaBreakdown, DEFAULT_KONDO_QUALITY_CONFIG);
      const overallScore = service.calculateOverallScore(contentScore, mediaScore);

      // Expected scores:
      // Content: 4 core (0.4) + 5 secondary (0.25) + ~30 other (0.30) = 0.95, capped at 1.0
      // Media: 7 final media (0.63) = 0.63
      // Overall: 1.0 + 0.63 = 1.63, capped at 1.0
      expect(contentScore).toBe(1.0); // Should be capped at 1.0
      expect(mediaScore).toBeCloseTo(0.63, 2);
      expect(overallScore).toBe(1.0); // Should be capped at 1.0
      expect(overallScore).toBeGreaterThan(DEFAULT_KONDO_QUALITY_CONFIG.threshold); // Should pass 0.7 threshold
    });
  });
});
