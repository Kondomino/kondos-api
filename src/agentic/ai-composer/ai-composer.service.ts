import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KondoRepository } from '../../kondo/repository/kondo.repository';
import { DescriptionGeneratorService } from './processors/description-generator.service';
import { AmenityExtractorService } from './processors/amenity-extractor.service';
import { FieldFillerService } from './processors/field-filler.service';
import { AI_COMPOSER_CONFIG } from './ai-composer.config';
import {
  CompositionResult,
  ComposeOptions,
} from './interfaces/composition-result.interface';
import { UpdateKondoDto } from '../../kondo/dto/update-kondo.dto';
import { KondoStatus } from '../../kondo/entities/kondo.entity';

@Injectable()
export class AIComposerService {
  private readonly logger = new Logger(AIComposerService.name);

  constructor(
    private readonly kondoRepository: KondoRepository,
    private readonly descriptionGenerator: DescriptionGeneratorService,
    private readonly amenityExtractor: AmenityExtractorService,
    private readonly fieldFiller: FieldFillerService,
  ) {}

  /**
   * Compose AI-enhanced description and amenities for a kondo
   * @param kondoId - Kondo ID to process
   * @param options - Composition options (force recompose)
   */
  async composeKondo(
    kondoId: number,
    options: ComposeOptions = {},
  ): Promise<CompositionResult> {
    const startTime = Date.now();

    this.logger.log(`Starting AI composition for kondo ${kondoId}`);

    try {
      // 1. Fetch kondo with scraped_raw_data and medias
      const kondo = await this.kondoRepository.findOne({ 
        where: { id: kondoId },
        include: ['medias'] // Load medias for filename analysis
      });

      if (!kondo) {
        throw new NotFoundException(`Kondo with ID ${kondoId} not found`);
      }

      // 2. Check if already composed (skip unless force=true)
      if (kondo.ai_composed && !options.force) {
        this.logger.log(`Kondo ${kondoId} already composed. Use force=true to recompose.`);
        return {
          success: false,
          kondoId: kondo.id,
          kondoName: kondo.name,
          fieldsUpdated: [],
          error: 'Already composed. Use force=true to recompose.',
        };
      }

      // 3. Log scraped_raw_data status (optional)
      if (!kondo.scraped_raw_data) {
        this.logger.log(
          `Kondo ${kondoId} has no scraped_raw_data. Will compose using existing fields only.`,
        );
      }

      this.logger.log(`Processing kondo: ${kondo.name} (ID: ${kondoId})`);

      // 4. Extract amenities (works with or without raw data)
      this.logger.log('Step 1/3: Extracting amenities...');
      const amenities = await this.amenityExtractor.extract(
        kondo.scraped_raw_data || null,
        kondo,
      );

      // 5. Fill missing fields (description, infra_description)
      this.logger.log('Step 2/3: Filling missing fields...');
      const fieldUpdates = await this.fieldFiller.fill(
        kondo.scraped_raw_data || null,
        kondo,
      );

      // 7. Prepare update DTO
      const updateDto = {
        ...amenities,
        ...fieldUpdates,
        status: KondoStatus.DONE, // Mark as done after successful AI composition
        ai_composed: true,
        ai_composed_at: new Date(),
      } as any as UpdateKondoDto;

      // 8. Update database
      this.logger.log('Step 3/3: Updating database...');
      await this.kondoRepository.update(updateDto, { id: kondoId });

      const duration = (Date.now() - startTime) / 1000;

      // Count amenities found
      const amenitiesCount = Object.values(amenities).filter(
        (v) => v === true,
      ).length;

      // Get updated field names
      const fieldsUpdated = Object.keys(updateDto).filter(
        (key) => key !== 'ai_composed' && key !== 'ai_composed_at',
      );

      this.logger.log(
        `✓ Composition complete for kondo ${kondoId} in ${duration.toFixed(1)}s`,
      );
      this.logger.log(`  - Fields updated: ${fieldsUpdated.join(', ')}`);
      this.logger.log(`  - Amenities found: ${amenitiesCount}`);

      return {
        success: true,
        kondoId: kondo.id,
        kondoName: kondo.name,
        fieldsUpdated,
        description: fieldUpdates.description,
        infraDescription: fieldUpdates.infra_description,
        amenitiesCount,
        duration,
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      this.logger.error(
        `Error composing kondo ${kondoId}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        kondoId,
        kondoName: '',
        fieldsUpdated: [],
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Batch compose multiple kondos
   * @param kondoIds - Array of kondo IDs to process
   */
  async batchCompose(kondoIds: number[]): Promise<CompositionResult[]> {
    this.logger.log(`Starting batch composition for ${kondoIds.length} kondos`);

    const results: CompositionResult[] = [];

    for (let i = 0; i < kondoIds.length; i++) {
      const kondoId = kondoIds[i];

      this.logger.log(`[${i + 1}/${kondoIds.length}] Processing kondo ${kondoId}...`);

      const result = await this.composeKondo(kondoId);
      results.push(result);

      // Rate limiting: wait between requests (except last one)
      if (i < kondoIds.length - 1) {
        const waitTime = 1000; // 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    this.logger.log(`Batch composition complete: ${successCount} success, ${failCount} failed`);

    return results;
  }

  /**
   * Get composition status for a kondo
   */
  async getCompositionStatus(kondoId: number): Promise<{
    composed: boolean;
    composedAt?: Date;
    hasRawData: boolean;
    confidence?: number;
  }> {
    const kondo = await this.kondoRepository.findOne({ where: { id: kondoId } });

    if (!kondo) {
      throw new NotFoundException(`Kondo with ID ${kondoId} not found`);
    }

    return {
      composed: kondo.ai_composed || false,
      composedAt: kondo.ai_composed_at,
      hasRawData: !!kondo.scraped_raw_data,
      confidence: kondo.scraped_extraction_confidence,
    };
  }
}
