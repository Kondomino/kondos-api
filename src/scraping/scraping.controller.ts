import { Controller, Post, Param, Body, ParseIntPipe, Logger } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapeKondoRequestDto } from './dto/scrape-kondo-request.dto';
import { ScrapeKondoResponseDto } from './dto/scrape-kondo-response.dto';
import { Public } from '../auth/decorators/public.decorator';

/**
 * REST API Controller for scraping operations
 * Provides HTTP endpoints for triggering individual kondo scraping
 */
@Controller('scraping')
export class ScrapingController {
  private readonly logger = new Logger(ScrapingController.name);

  constructor(private readonly scrapingService: ScrapingService) {}

  /**
   * Scrape a single kondo by ID
   * 
   * POST /scraping/:kondoId/scrape
   * 
   * @param kondoId - ID of kondo to scrape
   * @param options - Scraping options (dryRun, forceEngine, verbose)
   * @returns Scraping result with statistics
   */
  @Public()
  @Post(':kondoId/scrape')
  async scrapeKondo(
    @Param('kondoId', ParseIntPipe) kondoId: number,
    @Body() options?: ScrapeKondoRequestDto,
  ): Promise<ScrapeKondoResponseDto> {
    this.logger.log(`API request: Scrape kondo ${kondoId}`);
    
    try {
      const result = await this.scrapingService.scrapeKondoById(kondoId, options);
      return result;
    } catch (error) {
      this.logger.error(`Scraping failed for kondo ${kondoId}: ${error.message}`);
      
      return {
        success: false,
        kondoId,
        error: error.message,
      };
    }
  }
}
