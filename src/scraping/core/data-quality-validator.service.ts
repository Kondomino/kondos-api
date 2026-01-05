import { Injectable, Logger } from '@nestjs/common';

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  shouldOverwrite: boolean;
  reason: string;
}

/**
 * Overall data quality validation result
 */
export interface DataQualityValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Service for validating data quality before overwriting existing values
 * Ensures we never replace good data with empty/null/bad data
 */
@Injectable()
export class DataQualityValidatorService {
  private readonly logger = new Logger(DataQualityValidatorService.name);

  /**
   * Validate if new value should overwrite existing value
   * Core principle: Never degrade data quality
   * 
   * @param field - Field name
   * @param existingValue - Current value in database
   * @param newValue - New value from scraping
   * @returns Validation result with overwrite decision and reason
   */
  shouldOverwrite(
    field: string,
    existingValue: any,
    newValue: any,
  ): FieldValidationResult {
    // Handle null/undefined normalization
    const existingNormalized = this.normalizeValue(existingValue);
    const newNormalized = this.normalizeValue(newValue);

    // Case 1: New value is empty/null - REJECT if existing has value
    if (this.isEmpty(newNormalized)) {
      if (!this.isEmpty(existingNormalized)) {
        return {
          shouldOverwrite: false,
          reason: 'Rejected: new value is empty/null, existing has value',
        };
      }
      // Both empty - no point overwriting but not harmful
      return {
        shouldOverwrite: false,
        reason: 'Skipped: both values are empty',
      };
    }

    // Case 2: Existing is empty, new has value - ACCEPT
    if (this.isEmpty(existingNormalized)) {
      return {
        shouldOverwrite: true,
        reason: 'Accepted: filling empty field',
      };
    }

    // Case 3: Both have values - need quality comparison
    return this.compareQuality(field, existingNormalized, newNormalized);
  }

  /**
   * Validate overall scraped data quality
   * Check for common scraping issues
   */
  validateScrapedData(data: any): DataQualityValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    Object.keys(data).forEach((field) => {
      const value = data[field];

      // Check for suspiciously short text fields
      if (typeof value === 'string') {
        if (value.length > 0 && value.length < 3) {
          warnings.push(`Field '${field}' has suspiciously short value: "${value}"`);
        }

        // Check for placeholder text
        if (this.isPlaceholderText(value)) {
          issues.push(`Field '${field}' contains placeholder text: "${value}"`);
        }
      }

      // Check for zero values in price fields
      if (field.includes('price') || field.includes('rent')) {
        if (typeof value === 'number' && value === 0) {
          warnings.push(`Field '${field}' has zero value, likely scraping error`);
        }
      }

      // Check for negative numbers where they don't make sense
      if (typeof value === 'number' && value < 0) {
        if (!field.includes('coordinate') && !field.includes('latitude') && !field.includes('longitude')) {
          issues.push(`Field '${field}' has negative value: ${value}`);
        }
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Compare quality between existing and new value
   * Returns which one is better
   */
  private compareQuality(
    field: string,
    existingValue: any,
    newValue: any,
  ): FieldValidationResult {
    const existingType = typeof existingValue;
    const newType = typeof newValue;

    // Type mismatch - prefer existing (don't change types)
    if (existingType !== newType) {
      return {
        shouldOverwrite: false,
        reason: `Rejected: type mismatch (existing: ${existingType}, new: ${newType})`,
      };
    }

    // String comparison - prefer longer/more detailed
    if (existingType === 'string') {
      return this.compareStringQuality(existingValue, newValue);
    }

    // Number comparison - avoid zeros
    if (existingType === 'number') {
      return this.compareNumberQuality(field, existingValue, newValue);
    }

    // Boolean - trust new value (but log it)
    if (existingType === 'boolean') {
      return {
        shouldOverwrite: true,
        reason: 'Accepted: boolean value updated',
      };
    }

    // Array comparison
    if (Array.isArray(existingValue) && Array.isArray(newValue)) {
      return this.compareArrayQuality(existingValue, newValue);
    }

    // Object comparison
    if (existingType === 'object') {
      return this.compareObjectQuality(existingValue, newValue);
    }

    // Default: accept if values are different
    if (existingValue !== newValue) {
      return {
        shouldOverwrite: true,
        reason: 'Accepted: value changed',
      };
    }

    return {
      shouldOverwrite: false,
      reason: 'Skipped: values are identical',
    };
  }

  /**
   * Compare string quality - prefer longer, more detailed content
   */
  private compareStringQuality(existing: string, newValue: string): FieldValidationResult {
    const existingLength = existing.trim().length;
    const newLength = newValue.trim().length;

    // Check for placeholder text in new value
    if (this.isPlaceholderText(newValue)) {
      return {
        shouldOverwrite: false,
        reason: 'Rejected: new value is placeholder text',
      };
    }

    // New is significantly longer (>20% more) - likely more detailed
    if (newLength > existingLength * 1.2) {
      return {
        shouldOverwrite: true,
        reason: `Accepted: new value is more detailed (${newLength} vs ${existingLength} chars)`,
      };
    }

    // New is shorter - reject (data loss)
    if (newLength < existingLength * 0.8) {
      return {
        shouldOverwrite: false,
        reason: `Rejected: new value is shorter/less detailed (${newLength} vs ${existingLength} chars)`,
      };
    }

    // Similar length - keep existing to avoid unnecessary updates
    return {
      shouldOverwrite: false,
      reason: 'Skipped: similar content length, keeping existing',
    };
  }

  /**
   * Compare number quality - avoid zeros and suspicious values
   */
  private compareNumberQuality(field: string, existing: number, newValue: number): FieldValidationResult {
    // New is zero - likely scraping error
    if (newValue === 0 && existing !== 0) {
      return {
        shouldOverwrite: false,
        reason: 'Rejected: new value is zero, likely scraping error',
      };
    }

    // Existing is zero, new has value - accept
    if (existing === 0 && newValue !== 0) {
      return {
        shouldOverwrite: true,
        reason: 'Accepted: replacing zero with actual value',
      };
    }

    // For price fields, check if change is reasonable (not >2x or <0.5x)
    if (field.includes('price') || field.includes('rent') || field.includes('cost')) {
      if (newValue > existing * 2 || newValue < existing * 0.5) {
        return {
          shouldOverwrite: false,
          reason: `Rejected: suspicious price change (${existing} → ${newValue})`,
        };
      }
    }

    // Accept the new value
    return {
      shouldOverwrite: true,
      reason: `Accepted: number updated (${existing} → ${newValue})`,
    };
  }

  /**
   * Compare array quality - prefer more items
   */
  private compareArrayQuality(existing: any[], newValue: any[]): FieldValidationResult {
    // New array is empty - reject
    if (newValue.length === 0 && existing.length > 0) {
      return {
        shouldOverwrite: false,
        reason: 'Rejected: new array is empty, existing has items',
      };
    }

    // New array has more items - accept
    if (newValue.length > existing.length) {
      return {
        shouldOverwrite: true,
        reason: `Accepted: new array has more items (${newValue.length} vs ${existing.length})`,
      };
    }

    // Keep existing if similar or smaller
    return {
      shouldOverwrite: false,
      reason: 'Skipped: new array not better than existing',
    };
  }

  /**
   * Compare object quality - prefer more keys
   */
  private compareObjectQuality(existing: object, newValue: object): FieldValidationResult {
    const existingKeys = Object.keys(existing).length;
    const newKeys = Object.keys(newValue).length;

    if (newKeys > existingKeys) {
      return {
        shouldOverwrite: true,
        reason: `Accepted: new object has more keys (${newKeys} vs ${existingKeys})`,
      };
    }

    return {
      shouldOverwrite: false,
      reason: 'Skipped: new object not better than existing',
    };
  }

  /**
   * Check if value is empty/null/undefined
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

  /**
   * Normalize value for comparison (handle null/undefined)
   */
  private normalizeValue(value: any): any {
    if (value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    return value;
  }

  /**
   * Check if text is placeholder/dummy content
   */
  private isPlaceholderText(text: string): boolean {
    const lowerText = text.toLowerCase().trim();
    const placeholders = [
      'lorem ipsum',
      'teste',
      'test',
      'placeholder',
      'xxx',
      'n/a',
      'tbd',
      'coming soon',
      'em breve',
    ];

    return placeholders.some((placeholder) => lowerText.includes(placeholder));
  }
}
