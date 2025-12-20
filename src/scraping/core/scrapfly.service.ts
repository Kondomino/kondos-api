import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { ScrapingPlatformOptions } from '../interfaces/scraper-config.interface';
import { ScrapingPlatformResponse } from '../interfaces/scraping-platform.interface';

/**
 * Service for interacting with Scrapfly API
 * Handles HTML fetching from target URLs with proxy and JavaScript rendering support
 */
@Injectable()
export class ScrapflyService {
  private readonly logger = new Logger(ScrapflyService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.scrapfly.io/scrape';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SCRAPFLY_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('SCRAPFLY_API_KEY not found in environment variables');
    }
  }

  /**
   * Fetch HTML content from a URL via Scrapfly API
   * @param url - Target URL to scrape
   * @param options - Scrapfly options (render_js, asp, country, etc.)
  * @returns HTML content and response metadata
   */
  async fetchHtml(url: string, options?: ScrapingPlatformOptions): Promise<ScrapingPlatformResponse> {
    try {
      this.logger.debug(`Fetching HTML from: ${url}`);
  const startTime = Date.now();

      const params = new URLSearchParams({
        key: this.apiKey,
        url: url,
        // Scrapfly uses 'asp' for anti-scraping protection + JS rendering
        asp: options?.dynamic ? 'true' : 'false',
        // Country targeting
        ...(options?.country && { country: options.country }),
        // Proxy pool selection
        ...(options?.premium && { proxy_pool: 'public_residential_pool' }),
        // Format: use 'clean' to get cleaned HTML (removes scripts, styles, etc)
        // This returns raw HTML that can be parsed with Cheerio
        //format: 'text',
        // Additional Scrapfly-specific params
        ...(options?.extraParams || {}),
      });

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          //'Accept': 'text/html,application/xhtml+xml',
          'Accept': 'application/json',
        },
      });

      const responseTimeMs = Date.now() - startTime;

      // Scrapfly returns response in different formats:
      // - format=text: Returns HTML as plain string
      // - format=clean/markdown: Returns { result: { content: "cleaned_html" } }
      // - format=json: Returns structured extraction (not what we want)
      let html: string;
      let metadata: any = {};
      
      if (typeof response.data === 'string') {
        html = response.data;
      } else if (response.data?.result) {
        html = response.data.result.content || response.data.result.body;
        metadata = {
          statusCode: response.data.result.status_code,
          cost: response.data.config?.cost || response.data.result.cost,
          renderedJs: response.data.config?.asp || options?.dynamic || false,
          responseTimeMs,
          platform: 'scrapfly',
          scrapeId: response.data.result.scrape_id,
          duration: response.data.result.duration,
          rawResponse: response.data,
        };
      } else {
        throw new Error('Unexpected response format from Scrapfly');
      }

      this.logger.debug(`Successfully fetched HTML (${html?.length || 0} bytes) in ${responseTimeMs}ms`);
      return { html, metadata };

    } catch (error) {
      this.handleScrapflyError(error, url);
      throw error;
    }
  }

  /**
   * Handle and log Scrapfly API errors
   */
  private handleScrapflyError(error: any, url: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        switch (status) {
          case 401:
            this.logger.error('Invalid Scrapfly API key');
            break;
          case 429:
            this.logger.error('Scrapfly rate limit exceeded');
            break;
          case 400:
            this.logger.error(`Invalid URL or parameters: ${url}`);
            break;
          case 422:
            this.logger.error('Scrapfly scrape failed - target site blocked request');
            break;
          case 500:
            this.logger.error('Scrapfly internal server error');
            break;
          default:
            this.logger.error(`Scrapfly error (${status}): ${axiosError.message}`);
        }
      } else if (axiosError.request) {
        this.logger.error('No response from Scrapfly API - network issue');
      } else {
        this.logger.error(`Scrapfly request setup error: ${axiosError.message}`);
      }
    } else {
      this.logger.error(`Unexpected error: ${error.message}`);
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
