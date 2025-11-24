import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Kondo } from '../../kondo/entities/kondo.entity';
import { Media } from '../../media/entities/media.entity';
import { KondoContentAnalyzerService } from './kondo-content-analyzer.service';
import { 
  QualityAssessment, 
  QualityScores, 
  QualityUpdateResult 
} from '../interfaces/quality-assessment.interface';
import { KondoQualityConfig } from '../../config/kondo-quality.config';

@Injectable()
export class KondoQualityAssessmentService {
  private readonly logger = new Logger(KondoQualityAssessmentService.name);

  constructor(
    @InjectModel(Kondo) private kondoModel: typeof Kondo,
    @InjectModel(Media) private mediaModel: typeof Media,
    @Inject('KONDO_QUALITY_CONFIG') private config: KondoQualityConfig,
    private contentAnalyzer: KondoContentAnalyzerService,
  ) {}

  /**
   * Performs a comprehensive quality assessment of a Kondo
   */
  async assessKondoDataQuality(kondoId: number): Promise<QualityAssessment | null> {
    try {
      this.logger.log(`Starting quality assessment for Kondo ${kondoId}`);

      // Fetch Kondo with associated media
      const kondo = await this.kondoModel.findByPk(kondoId, {
        include: [
          {
            model: Media,
            as: 'medias',
            required: false,
          },
        ],
      });

      if (!kondo) {
        this.logger.warn(`Kondo ${kondoId} not found for quality assessment`);
        return null;
      }

      return this.performQualityAssessment(kondo);

    } catch (error) {
      this.logger.error(`Quality assessment failed for Kondo ${kondoId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates Kondo quality scores in the database
   */
  async updateKondoQualityScores(
    kondoId: number, 
    scores: QualityScores
  ): Promise<QualityUpdateResult> {
    try {
      this.logger.log(`Updating quality scores for Kondo ${kondoId}`);

      const kondo = await this.kondoModel.findByPk(kondoId);
      if (!kondo) {
        return {
          success: false,
          kondoId,
          newScores: scores,
          updated: false,
          error: `Kondo ${kondoId} not found`,
        };
      }

      // Store previous scores for comparison
      const previousScores: QualityScores = {
        contentQuality: kondo.kondo_data_content_quality || 0,
        mediaQuality: kondo.kondo_data_media_quality || 0,
        overallQuality: ((kondo.kondo_data_content_quality || 0) + (kondo.kondo_data_media_quality || 0)) / 2,
      };

      // Check if scores actually changed (avoid unnecessary updates)
      const scoresChanged = 
        Math.abs(previousScores.contentQuality - scores.contentQuality) > 0.01 ||
        Math.abs(previousScores.mediaQuality - scores.mediaQuality) > 0.01;

      if (!scoresChanged) {
        this.logger.debug(`Quality scores for Kondo ${kondoId} unchanged, skipping update`);
        return {
          success: true,
          kondoId,
          previousScores,
          newScores: scores,
          updated: false,
        };
      }

      // Update the Kondo with new scores
      await kondo.update({
        kondo_data_content_quality: scores.contentQuality,
        kondo_data_media_quality: scores.mediaQuality,
        kondo_data_updated: new Date(),
      });

      this.logger.log(`Quality scores updated for Kondo ${kondoId}: content=${scores.contentQuality.toFixed(2)}, media=${scores.mediaQuality.toFixed(2)}, overall=${scores.overallQuality.toFixed(2)}`);

      return {
        success: true,
        kondoId,
        previousScores,
        newScores: scores,
        updated: true,
      };

    } catch (error) {
      this.logger.error(`Failed to update quality scores for Kondo ${kondoId}: ${error.message}`);
      return {
        success: false,
        kondoId,
        newScores: scores,
        updated: false,
        error: error.message,
      };
    }
  }

  /**
   * Checks if a Kondo meets the quality threshold
   */
  async meetsQualityThreshold(kondoId: number): Promise<boolean> {
    const assessment = await this.assessKondoDataQuality(kondoId);
    return assessment ? assessment.meetsThreshold : false;
  }

  /**
   * Gets current quality scores for a Kondo without full assessment
   */
  async getCurrentQualityScores(kondoId: number): Promise<QualityScores | null> {
    try {
      const kondo = await this.kondoModel.findByPk(kondoId, {
        attributes: ['id', 'kondo_data_content_quality', 'kondo_data_media_quality'],
      });

      if (!kondo) return null;

      const contentQuality = kondo.kondo_data_content_quality || 0;
      const mediaQuality = kondo.kondo_data_media_quality || 0;

      return {
        contentQuality,
        mediaQuality,
        overallQuality: (contentQuality + mediaQuality) / 2,
      };

    } catch (error) {
      this.logger.error(`Failed to get current quality scores for Kondo ${kondoId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Performs quality assessment and automatically updates scores
   */
  async assessAndUpdateQuality(kondoId: number): Promise<QualityUpdateResult> {
    try {
      const assessment = await this.assessKondoDataQuality(kondoId);
      
      if (!assessment) {
        return {
          success: false,
          kondoId,
          newScores: { contentQuality: 0, mediaQuality: 0, overallQuality: 0 },
          updated: false,
          error: `Kondo ${kondoId} not found`,
        };
      }

      const scores: QualityScores = {
        contentQuality: assessment.contentQuality,
        mediaQuality: assessment.mediaQuality,
        overallQuality: assessment.overallQuality,
      };

      return await this.updateKondoQualityScores(kondoId, scores);

    } catch (error) {
      this.logger.error(`Failed to assess and update quality for Kondo ${kondoId}: ${error.message}`);
      return {
        success: false,
        kondoId,
        newScores: { contentQuality: 0, mediaQuality: 0, overallQuality: 0 },
        updated: false,
        error: error.message,
      };
    }
  }

  /**
   * Batch assessment for multiple Kondos
   */
  async batchAssessQuality(kondoIds: number[]): Promise<QualityUpdateResult[]> {
    this.logger.log(`Starting batch quality assessment for ${kondoIds.length} Kondos`);
    
    const results: QualityUpdateResult[] = [];
    
    for (const kondoId of kondoIds) {
      try {
        const result = await this.assessAndUpdateQuality(kondoId);
        results.push(result);
      } catch (error) {
        this.logger.error(`Batch assessment failed for Kondo ${kondoId}: ${error.message}`);
        results.push({
          success: false,
          kondoId,
          newScores: { contentQuality: 0, mediaQuality: 0, overallQuality: 0 },
          updated: false,
          error: error.message,
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    this.logger.log(`Batch assessment completed: ${successful}/${kondoIds.length} successful`);

    return results;
  }

  /**
   * Private method to perform the actual quality assessment
   */
  private performQualityAssessment(kondo: Kondo): QualityAssessment {
    const medias = kondo.medias || [];

    // Analyze content and media quality
    const contentBreakdown = this.contentAnalyzer.analyzeContentQuality(kondo, this.config);
    const mediaBreakdown = this.contentAnalyzer.analyzeMediaQuality(kondo, medias, this.config);

    // Calculate weighted scores
    const contentQuality = this.contentAnalyzer.calculateContentScore(contentBreakdown, this.config);
    const mediaQuality = this.contentAnalyzer.calculateMediaScore(mediaBreakdown, this.config);
    const overallQuality = this.contentAnalyzer.calculateOverallScore(contentQuality, mediaQuality);

    // Determine if threshold is met
    const meetsThreshold = overallQuality >= this.config.threshold;

    const assessment: QualityAssessment = {
      kondoId: kondo.id,
      contentQuality,
      mediaQuality,
      overallQuality,
      meetsThreshold,
      lastUpdated: new Date(),
      breakdown: {
        content: contentBreakdown,
        media: mediaBreakdown,
      },
    };

    this.logger.debug(`Quality assessment completed for Kondo ${kondo.id}: overall=${overallQuality.toFixed(2)}, threshold=${this.config.threshold}, meets=${meetsThreshold}`);

    return assessment;
  }
}
