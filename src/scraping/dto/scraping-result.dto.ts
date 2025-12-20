/**
 * Result of a scraping operation
 */
export interface ScrapeResult {
  /**
   * Number of successfully scraped kondos
   */
  success: number;

  /**
   * Number of failed scraping attempts
   */
  failed: number;

  /**
   * Number of skipped kondos (e.g., missing URL)
   */
  skipped: number;

  /**
   * Details of errors encountered
   */
  errors: ScrapeError[];

  /**
   * Total number of fields changed across all kondos
   */
  totalFieldsChanged?: number;

  /**
   * Total number of protected fields that were ignored
   */
  totalProtectedIgnored?: number;
}

/**
 * Error details from a failed scrape
 */
export interface ScrapeError {
  /**
   * ID of the kondo that failed
   */
  kondoId: number;

  /**
   * Error message
   */
  error: string;

  /**
   * URL that was being scraped
   */
  url?: string;
}
