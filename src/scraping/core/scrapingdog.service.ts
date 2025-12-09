import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { ScrapingDogOptions } from '../interfaces/scraper-config.interface';

/**
 * Service for interacting with ScrapingDog API
 * Handles HTML fetching from target URLs with proxy and JavaScript rendering support
 */
@Injectable()
export class ScrapingDogService {
  private readonly logger = new Logger(ScrapingDogService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.scrapingdog.com/scrape';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SCRAPINGDOG_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('SCRAPINGDOG_API_KEY not found in environment variables');
    }
  }

  /**
   * Fetch HTML content from a URL via ScrapingDog API
   * @param url - Target URL to scrape
   * @param options - ScrapingDog options (dynamic, premium, country, etc.)
   * @returns HTML content as string
   */
  async fetchHtml(url: string, options?: ScrapingDogOptions): Promise<string> {
    try {
      this.logger.debug(`Fetching HTML from: ${url}`);

      const params = new URLSearchParams({
        api_key: this.apiKey,
        url: url,
        dynamic: options?.dynamic ? 'true' : 'false',
        premium: options?.premium ? 'true' : 'false',
        ...(options?.country && { country: options.country }),
        ...(options?.extraParams || {}),
      });

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      this.logger.debug(`Successfully fetched HTML (${response.data.length} bytes)`);
      return response.data;

    } catch (error) {
      this.handleScrapingDogError(error, url);
      throw error;
    }
  }

  /**
   * Handle and log ScrapingDog API errors
   */
  private handleScrapingDogError(error: any, url: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        switch (status) {
          case 401:
            this.logger.error('Invalid ScrapingDog API key');
            break;
          case 429:
            this.logger.error('ScrapingDog rate limit exceeded');
            break;
          case 400:
            this.logger.error(`Invalid URL or parameters: ${url}`);
            break;
          case 500:
            this.logger.error('ScrapingDog internal server error');
            break;
          default:
            this.logger.error(`ScrapingDog error (${status}): ${axiosError.message}`);
        }
      } else if (axiosError.request) {
        this.logger.error('No response from ScrapingDog API - network issue');
      } else {
        this.logger.error(`ScrapingDog request setup error: ${axiosError.message}`);
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
