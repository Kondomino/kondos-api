import { FieldRejection } from '../core/data-merge.service';

/**
 * Media statistics from scraping
 */
export interface MediaStats {
  totalDiscovered: number;
  imagesDiscovered: number;
  videosDiscovered: number;
  imagesUploaded: number;
  videosDownloaded: number;
  videosEmbedded: number;
  totalSaved: number;
}

/**
 * Field change information
 */
export interface FieldChange {
  before: any;
  after: any;
}

/**
 * Response DTO for scraping a single kondo
 */
export class ScrapeKondoResponseDto {
  /**
   * Whether scraping was successful
   */
  success: boolean;

  /**
   * Kondo ID that was scraped
   */
  kondoId: number;

  /**
   * Platform/engine used for scraping
   */
  platform?: string;

  /**
   * Error message if scraping failed
   */
  error?: string;

  /**
   * Statistics about the scraping operation
   */
  stats?: {
    /**
     * Number of fields that were updated
     */
    fieldsUpdated: number;

    /**
     * Number of protected fields that were skipped
     */
    protectedSkipped: number;

    /**
     * Number of fields rejected due to quality checks
     */
    qualityRejected: number;

    /**
     * Number of media files uploaded
     */
    mediaUploaded: number;

    /**
     * Detailed media statistics
     */
    media?: MediaStats;
  };

  /**
   * List of fields that were updated
   */
  updatedFields?: string[];

  /**
   * Detailed changes for each field (only in verbose mode)
   */
  changes?: Record<string, FieldChange>;

  /**
   * Fields that were rejected with reasons
   */
  rejections?: FieldRejection[];

  /**
   * Validation issues found in scraped data
   */
  validationIssues?: string[];

  /**
   * Validation warnings
   */
  validationWarnings?: string[];

  /**
   * Featured image that was auto-selected
   */
  featuredImage?: string;

  /**
   * Whether this was a dry run (no data saved)
   */
  dryRun?: boolean;
}
