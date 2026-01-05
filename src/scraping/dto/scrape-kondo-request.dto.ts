import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * Request DTO for scraping a single kondo
 */
export class ScrapeKondoRequestDto {
  /**
   * Dry run mode - scrape but don't save to database
   */
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  /**
   * Force specific scraping engine (platform)
   * e.g., 'somattos', 'elementor', 'generic'
   */
  @IsOptional()
  @IsString()
  forceEngine?: string;

  /**
   * Verbose logging for debugging
   */
  @IsOptional()
  @IsBoolean()
  verbose?: boolean;

  /**
   * Skip delay between requests (useful for API calls)
   */
  @IsOptional()
  @IsBoolean()
  skipDelay?: boolean;
}
