import { Kondo } from '../../kondo/entities/kondo.entity';

/**
 * DTO for scraped kondo data
 * Contains partial Kondo entity fields plus media URLs
 */
export interface ScrapedKondoDto extends Partial<Omit<Kondo, 'medias'>> {
  /**
   * Array of media URLs (images, videos) extracted from the page
   */
  medias?: string[];

  /**
   * Timestamp when the data was scraped
   */
  scrapedAt?: Date;

  /**
   * Source URL that was scraped
   */
  sourceUrl?: string;
}
