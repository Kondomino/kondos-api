import { Injectable, Logger } from '@nestjs/common';
import { Kondo } from '../../kondo/entities/kondo.entity';
import { Media } from '../../media/entities/media.entity';
import { ContentQualityBreakdown, MediaQualityBreakdown } from '../interfaces/quality-assessment.interface';

@Injectable()
export class KondoContentAnalyzerService {
  private readonly logger = new Logger(KondoContentAnalyzerService.name);

  /**
   * Analyzes the content quality of a Kondo based on available data
   * Uses new scoring system: core attributes (0.1 each) + secondary attributes (0.05 each) + other attributes (0.01 each) + media (0.09 each)
   */
  analyzeContentQuality(kondo: Kondo): ContentQualityBreakdown {
    const coreScore = this.assessCoreAttributes(kondo);
    const secondaryScore = this.assessSecondaryAttributes(kondo);
    const otherScore = this.assessOtherAttributes(kondo);
    
    const breakdown: ContentQualityBreakdown = {
      basicInfo: coreScore,
      pricing: otherScore, // Repurposed to hold other attributes score
      conveniences: 0, // Not used in new system  
      details: secondaryScore,
    };

    this.logger.debug(`Content quality breakdown for Kondo ${kondo.id}: ${JSON.stringify(breakdown)}`);
    return breakdown;
  }

  /**
   * Analyzes the media quality of a Kondo based on associated media
   * Uses new scoring system: each 'final' status media adds 0.09 points
   */
  analyzeMediaQuality(kondo: Kondo, medias: Media[]): MediaQualityBreakdown {
    const mediaScore = this.assessFinalMediaCount(medias);
    
    const breakdown: MediaQualityBreakdown = {
      images: mediaScore, // Now represents total media contribution
      quality: 0, // Not used in new system
      videos: 0, // Not used in new system
      recency: 0, // Not used in new system
    };

    this.logger.debug(`Media quality breakdown for Kondo ${kondo.id}: ${JSON.stringify(breakdown)}`);
    return breakdown;
  }

  /**
   * Calculates content quality score using new system
   * Core attributes (0.1 each) + Secondary attributes (0.05 each) + Other attributes (0.01 each)
   */
  calculateContentScore(breakdown: ContentQualityBreakdown): number {
    // In new system: basicInfo = core attributes, details = secondary attributes, pricing = other attributes
    const score = breakdown.basicInfo + breakdown.details + breakdown.pricing;
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Calculates media quality score using new system
   * Each 'final' status media adds 0.09 points
   */
  calculateMediaScore(breakdown: MediaQualityBreakdown): number {
    // In new system: images field contains the total media contribution
    const score = breakdown.images;
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Calculates overall quality score using new system
   * Content score + Media score (both already contribute to final 0-1 scale)
   */
  calculateOverallScore(contentScore: number, mediaScore: number): number {
    const totalScore = contentScore + mediaScore;
    return Math.min(1.0, Math.max(0.0, totalScore));
  }

  // Private assessment methods

  /**
   * Assesses core attributes: name, status, type, description
   * Each attribute adds 0.1 points
   */
  private assessCoreAttributes(kondo: Kondo): number {
    let score = 0;

    // Core attributes (0.1 points each)
    if (kondo.name && kondo.name.trim().length > 0) score += 0.1;
    if (kondo.status && kondo.status.trim().length > 0) score += 0.1;
    if (kondo.type && kondo.type.trim().length > 0) score += 0.1;
    if (kondo.description && kondo.description.trim().length > 0) score += 0.1;

    return score;
  }

  /**
   * Assesses secondary attributes: minutes_from_bh, cep, address_street_and_numbers, neighborhood, city
   * Each attribute adds 0.05 points
   */
  private assessSecondaryAttributes(kondo: Kondo): number {
    let score = 0;

    // Secondary attributes (0.05 points each)
    if (kondo.minutes_from_bh && kondo.minutes_from_bh.trim().length > 0) score += 0.05;
    if (kondo.cep && kondo.cep.trim().length > 0) score += 0.05;
    if (kondo.address_street_and_numbers && kondo.address_street_and_numbers.trim().length > 0) score += 0.05;
    if (kondo.neighborhood && kondo.neighborhood.trim().length > 0) score += 0.05;
    if (kondo.city && kondo.city.trim().length > 0) score += 0.05;

    return score;
  }

  /**
   * Assesses all other attributes not included in core or secondary
   * Each attribute adds 0.01 points
   */
  private assessOtherAttributes(kondo: Kondo): number {
    let score = 0;

    // Other attributes (0.01 points each)
    const otherAttributes = [
      'active', 'highlight', 'slug', 'featured_image',
      'lot_avg_price', 'condo_rent', 'lots_available', 'lots_min_size',
      'finance', 'finance_tranches', 'finance_fees', 'entry_value_percentage',
      'infra_description', 'infra_lobby_24h', 'infra_security_team', 'infra_wall',
      'infra_sports_court', 'infra_barbecue_zone', 'infra_pool', 'infra_living_space',
      'infra_pet_area', 'infra_kids_area', 'infra_lagoon', 'infra_eletricity',
      'infra_water', 'infra_sidewalks', 'infra_internet', 'infra_generates_power',
      'infra_grass_area', 'infra_woods', 'infra_vegetable_garden', 'infra_nature_trail',
      'infra_gourmet_area', 'infra_parking_lot', 'infra_heliport', 'infra_gym',
      'infra_gardens', 'infra_interactive_lobby', 'infra_home_office', 'infra_lounge_bar',
      'infra_party_saloon', 'infra_market_nearby', 'phone', 'email', 'url',
      'total_area', 'video', 'immediate_delivery', 'kondo_data_updated',
      'kondo_data_content_quality', 'kondo_data_media_quality'
    ];

    otherAttributes.forEach(attr => {
      const value = kondo[attr];
      if (value !== null && value !== undefined) {
        if (typeof value === 'string' && value.trim().length > 0) {
          score += 0.01;
        } else if (typeof value === 'number' && value > 0) {
          score += 0.01;
        } else if (typeof value === 'boolean' && value === true) {
          score += 0.01;
        } else if (value instanceof Date) {
          score += 0.01;
        }
      }
    });

    return score;
  }

  /**
   * Assesses media contribution to quality score
   * Each media with 'final' status adds 0.09 points
   */
  private assessFinalMediaCount(medias: Media[]): number {
    if (!medias || medias.length === 0) return 0;

    const finalMediaCount = medias.filter(media => media.status === 'final').length;
    return finalMediaCount * 0.09;
  }
}
