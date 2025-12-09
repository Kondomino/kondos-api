import { Injectable, Logger } from '@nestjs/common';
import { RetryOptions } from '../interfaces/scraper-config.interface';

/**
 * Service for handling retry logic with exponential backoff
 */
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  /**
   * Execute a function with retry logic and exponential backoff
   * @param fn - Async function to execute
   * @param options - Retry configuration options
   * @returns Result of the function execution
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts) {
          const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
          this.logger.warn(
            `Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`
          );
          this.logger.debug(`Error: ${error.message}`);
          
          await this.sleep(delay);
        } else {
          this.logger.error(
            `All ${maxAttempts} attempts failed. Giving up.`
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
