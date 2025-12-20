import { Injectable, Logger } from '@nestjs/common';

/**
 * Service for scoring media URLs for relevance to property listings
 * Scores 0-1 based on URL analysis, domain, format, and content indicators
 */
@Injectable()
export class MediaRelevanceScorerService {
  private readonly logger = new Logger(MediaRelevanceScorerService.name);

  // MATCH keywords - instant approval (+0.7 score boost)
  // These keywords confirm the media is definitely property-related
  private readonly MATCH_KEYWORDS = [
    'area',
    'comum',
    'conveniencia',
    'playground',
    'piscina',
    'churrasqueira',
    'barbecue',
    'gourmet',
    'hall',
    'entrance',
    'lounge',
    'building',
    'predio',
    'lobby',
    'exterior',
    'fachada',
    'rua',
    'street',
    'condominio',
  ];

  // Positive keywords indicating property/real estate media
  private readonly POSITIVE_KEYWORDS = [
    'galeria',
    'foto',
    'fotos',
    'image',
    'images',
    'property',
    'kondo',
    'empreendimento',
    'imovel',
    'imóvel',
    'sala',
    'quarto',
    'suite',
    'cozinha',
    'banheiro',
    'varanda',
    'lazer',
  ];

  // Negative keywords indicating non-property media
  private readonly NEGATIVE_KEYWORDS = [
    'logo',
    'icon',
    'avatar',
    'team',
    'user',
    'profile',
    'background',
    'banner',
    'ads',
    'advertisement',
    'institutio',
    'default',
    'placeholder',
    'thumbnail',
    'thumb',
    'social',
    'employee',
    'staff',
    'office',
    'company',
    'apartamento',
    'planta',
    'blueprint',
    'artboard'
  ];

  // External video platforms to exclude
  private readonly EXTERNAL_VIDEO_PLATFORMS = [
    'youtube.com',
    'youtu.be',
    'vimeo.com',
    'dailymotion.com',
    'twitch.tv',
    'instagram.com',
    'facebook.com',
    'tiktok.com',
  ];

  /**
   * Score a media URL for relevance to property listing
   * @param url - Media URL to score
   * @param propertyDomain - Domain of the property being scraped (for context)
   * @returns Score 0-1
   */
  scoreMediaUrl(url: string, propertyDomain?: string): number {
    try {
      const urlLower = url.toLowerCase();

      // External videos always score 0
      if (this.isExternalVideoUrl(urlLower)) {
        this.logger.debug(`[Score] External video URL rejected: ${url}`);
        return 0;
      }

      // Calculate component scores
      const fileExtScore = this.scoreFileExtension(urlLower);
      const pathScore = this.scoreUrlPath(urlLower);
      const domainScore = this.scoreDomain(urlLower, propertyDomain);
      const lengthScore = this.scoreUrlLength(urlLower);

      // Weighted average
      const finalScore =
        fileExtScore * 0.2 +  // 20% weight
        pathScore * 0.4 +     // 40% weight
        domainScore * 0.3 +   // 30% weight
        lengthScore * 0.1;    // 10% weight

      return Math.min(1, Math.max(0, finalScore)); // Clamp 0-1
    } catch (error) {
      this.logger.error(`[Score] Error scoring URL ${url}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Score file extension (0-1)
   */
  private scoreFileExtension(url: string): number {
    // Images - high score
    if (/\.(jpe?g|png|avif)(\?.*)?$/i.test(url)) return 1.0;
    if (/\.(webp|gif)(\?.*)?$/i.test(url)) return 0.7;

    // Videos - medium-high score (if local, verified elsewhere)
    if (/\.(mp4|webm|mov|avi)(\?.*)?$/i.test(url)) return 0.8;

    // Suspicious formats
    if (/\.(svg|ico|bmp)(\?.*)?$/i.test(url)) return 0.2;

    // No extension or unknown
    return 0.5;
  }

  /**
   * Score URL path/filename (0-1)
   * Analyzes keywords and structure
   */
  private scoreUrlPath(url: string): number {
    const path = url.split('?')[0]; // Remove query params
    const pathLower = path.toLowerCase();

    let score = 0.5; // Base score

    // Check MATCH keywords first - instant approval
    const matchKeywordFound = this.MATCH_KEYWORDS.some((kw) =>
      pathLower.includes(kw)
    );
    if (matchKeywordFound) {
      score += 0.7; // Instant high score boost
      this.logger.debug(`[Score] MATCH keyword found, boosting score`);
    }

    // Count positive keywords
    const positiveMatches = this.POSITIVE_KEYWORDS.filter((kw) =>
      pathLower.includes(kw)
    ).length;
    score += positiveMatches * 0.1; // +10% per positive keyword

    // Count negative keywords - heavily penalize
    const negativeMatches = this.NEGATIVE_KEYWORDS.filter((kw) =>
      pathLower.includes(kw)
    ).length;
    score -= negativeMatches * 0.15; // -15% per negative keyword

    // Filename quality check
    const filename = path.split('/').pop() || '';
    if (filename.length > 50) {
      score -= 0.1; // Excessively long filename
    }
    if (/[\s#%&]/.test(filename)) {
      score -= 0.1; // Suspicious characters
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score domain/path structure (0-1)
   */
  private scoreDomain(url: string, propertyDomain?: string): number {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      // Same domain as property = high score
      if (propertyDomain) {
        const propDomainLower = propertyDomain.toLowerCase();
        if (domain.includes(propDomainLower) || propDomainLower.includes(domain)) {
          return 0.95;
        }
      }

      // Known CDN providers = high score
      const cdnPatterns = [
        'cdn',
        'cloudflare',
        'cloudfront',
        'akamai',
        'fastly',
        'imgix',
        'imagekit',
        's3',
        'amazonaws',
        'digitalocean',
      ];

      const isCdn = cdnPatterns.some((pattern) => domain.includes(pattern));
      if (isCdn) return 0.85;

      // Property listing sites = medium-high
      const propertyPatterns = ['imovel', 'imóvel', 'property', 'real', 'estate', 'kondo', 'apto', 'apartamento'];
      const isPropertySite = propertyPatterns.some((pattern) => domain.includes(pattern));
      if (isPropertySite) return 0.75;

      // Stock photo/unrelated = low score
      const badPatterns = [
        'stock',
        'shutterstock',
        'getty',
        'adobe',
        'pixabay',
        'unsplash',
        'pexels',
        'gravatar',
        'wordpress',
      ];
      const isBad = badPatterns.some((pattern) => domain.includes(pattern));
      if (isBad) return 0.1;

      // Unknown domain = neutral
      return 0.5;
    } catch {
      return 0.3; // Failed to parse domain
    }
  }

  /**
   * Score URL length/complexity (0-1)
   * Shorter, cleaner URLs = better
   */
  private scoreUrlLength(url: string): number {
    // Remove query params for length check
    const cleanUrl = url.split('?')[0];

    if (cleanUrl.length > 200) return 0.2; // Too long = likely tracking
    if (cleanUrl.length > 150) return 0.4;
    if (cleanUrl.length > 100) return 0.7;
    return 1.0; // Clean, short URLs
  }

  /**
   * Check if URL is from external video platform
   */
  private isExternalVideoUrl(url: string): boolean {
    return this.EXTERNAL_VIDEO_PLATFORMS.some((platform) => url.includes(platform));
  }
}
