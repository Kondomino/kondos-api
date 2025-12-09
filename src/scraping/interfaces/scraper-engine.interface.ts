import { ScrapedKondoDto } from '../dto/scraped-kondo.dto';

/**
 * Interface that all platform-specific scrapers must implement
 */
export interface IScraperEngine {
  /**
   * The platform identifier (e.g., 'somattos', '5andar')
   */
  platform: string;

  /**
   * Scrape a kondo from a given URL
   * @param url - The URL to scrape
   * @returns Scraped kondo data with media URLs
   */
  scrape(url: string): Promise<ScrapedKondoDto>;
}
