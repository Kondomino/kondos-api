import { Injectable, Logger } from '@nestjs/common';
import { Kondo } from '../../kondo/entities/kondo.entity';
import { ScrapedKondoDto } from '../dto/scraped-kondo.dto';
import { DataQualityValidatorService } from './data-quality-validator.service';

/**
 * Field rejection reason
 */
export interface FieldRejection {
  field: string;
  reason: string;
  existingValue: any;
  attemptedValue: any;
}

/**
 * Merge result with updates and rejections
 */
export interface MergeResult {
  updates: Partial<Kondo>;
  rejected: FieldRejection[];
  accepted: string[];
}

/**
 * Protected field configuration
 */
export interface ProtectedFieldConfig {
  field: string;
  mode: 'never' | 'if-empty' | 'quality-check';
}

/**
 * Service for intelligently merging scraped data with existing data
 * Uses quality validation to prevent data degradation
 */
@Injectable()
export class DataMergeService {
  private readonly logger = new Logger(DataMergeService.name);

  constructor(
    private readonly qualityValidator: DataQualityValidatorService,
  ) {}

  /**
   * Merge scraped data with existing kondo data using quality rules
   * 
   * @param existing - Current kondo from database
   * @param scraped - Newly scraped data
   * @param protectedFieldsConfig - Protected fields configuration
   * @returns Merge result with updates and rejections
   */
  mergeData(
    existing: Kondo,
    scraped: ScrapedKondoDto,
    protectedFieldsConfig: Array<string | ProtectedFieldConfig>,
  ): MergeResult {
    const updates: Partial<Kondo> = {};
    const rejected: FieldRejection[] = [];
    const accepted: string[] = [];

    // Remove metadata fields that shouldn't be saved to Kondo
    const { medias, scrapedAt, sourceUrl, platformMetadata, ...scrapedKondoFields } = scraped;

    // Convert protected fields to config format
    const protectedMap = this.buildProtectedFieldsMap(protectedFieldsConfig);

    // Process each field
    Object.keys(scrapedKondoFields).forEach((field) => {
      const newValue = scrapedKondoFields[field];
      const existingValue = existing[field];

      // Check if field is protected
      const protectedConfig = protectedMap.get(field);
      
      if (protectedConfig) {
        const protectionResult = this.checkProtection(
          field,
          existingValue,
          newValue,
          protectedConfig,
        );

        if (!protectionResult.allowed) {
          rejected.push({
            field,
            reason: protectionResult.reason,
            existingValue,
            attemptedValue: newValue,
          });
          return;
        }
      }

      // Quality validation
      const validation = this.qualityValidator.shouldOverwrite(field, existingValue, newValue);

      if (validation.shouldOverwrite) {
        updates[field] = newValue;
        accepted.push(field);
        this.logger.debug(`[Merge] ${field}: ${validation.reason}`);
      } else {
        rejected.push({
          field,
          reason: validation.reason,
          existingValue,
          attemptedValue: newValue,
        });
        this.logger.debug(`[Merge] ${field}: ${validation.reason}`);
      }
    });

    this.logger.log(
      `Merge complete: ${accepted.length} accepted, ${rejected.length} rejected`,
    );

    return { updates, rejected, accepted };
  }

  /**
   * Build protected fields map from config
   */
  private buildProtectedFieldsMap(
    config: Array<string | ProtectedFieldConfig>,
  ): Map<string, ProtectedFieldConfig> {
    const map = new Map<string, ProtectedFieldConfig>();

    config.forEach((item) => {
      if (typeof item === 'string') {
        // Simple string format - default to 'never' mode
        map.set(item, { field: item, mode: 'never' });
      } else {
        // Full config object
        map.set(item.field, item);
      }
    });

    return map;
  }

  /**
   * Check if field update is allowed based on protection rules
   */
  private checkProtection(
    field: string,
    existingValue: any,
    newValue: any,
    config: ProtectedFieldConfig,
  ): { allowed: boolean; reason: string } {
    switch (config.mode) {
      case 'never':
        return {
          allowed: false,
          reason: `Protected field '${field}' (mode: never)`,
        };

      case 'if-empty':
        // Only allow if existing is empty
        if (this.isEmpty(existingValue)) {
          return {
            allowed: true,
            reason: `Protected field '${field}' is empty, update allowed`,
          };
        }
        return {
          allowed: false,
          reason: `Protected field '${field}' (mode: if-empty, existing has value)`,
        };

      case 'quality-check':
        // Allow, but quality check will decide
        return {
          allowed: true,
          reason: `Protected field '${field}' (mode: quality-check)`,
        };

      default:
        return {
          allowed: false,
          reason: `Unknown protection mode for field '${field}'`,
        };
    }
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim() === '';
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }

    return false;
  }
}
