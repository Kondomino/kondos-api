import { Command, CommandRunner, Option } from 'nest-commander';
import { ScrapingService } from './scraping.service';
import { Logger } from '@nestjs/common';

/**
 * CLI command options interface
 */
interface ScrapeCommandOptions {
  platform?: string;
  kondoId?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * CLI command for scraping kondos
 * Usage: npm run scrape [options]
 */
@Command({
  name: 'scrape',
  description: 'Scrape kondo data from external real estate platforms',
})
export class ScrapeCommand extends CommandRunner {
  private readonly logger = new Logger(ScrapeCommand.name);

  constructor(private readonly scrapingService: ScrapingService) {
    super();
  }

  async run(inputs: string[], options: ScrapeCommandOptions): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('🕷️  Kondos API - Web Scraping Tool');
    console.log('='.repeat(50) + '\n');

    this.logger.log(`📋 Inputs: ${JSON.stringify(inputs)}`);
    this.logger.log(`⚙️  Options: ${JSON.stringify(options)}`);

    if (options.verbose) {
      this.logger.debug('Verbose mode enabled');
      this.logger.debug('Options:', options);
    }

    if (options.dryRun) {
      console.log('⚠️  DRY RUN MODE - No data will be saved to database\n');
    }

    try {
      this.logger.log('🔍 Starting scraping service...');
      
      const result = await this.scrapingService.scrapeAllPending({
        platform: options.platform,
        kondoId: options.kondoId ? parseInt(options.kondoId, 10) : undefined,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });

      this.logger.log(`✅ Scraping completed. Success: ${result.success}, Failed: ${result.failed}, Skipped: ${result.skipped}`);

      // Exit with appropriate code
      process.exit(result.failed > 0 ? 1 : 0);

    } catch (error) {
      this.logger.error('Scraping process failed:', error);
      console.error('\n❌ Fatal error:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  }

  /**
   * Platform filter option
   */
  @Option({
    flags: '-p, --platform <platform>',
    description: 'Filter by specific platform (e.g., somattos, 5andar)',
  })
  parsePlatform(val: string): string {
    return val;
  }

  /**
   * Kondo ID filter option
   */
  @Option({
    flags: '-k, --kondo-id <id>',
    description: 'Scrape only a specific kondo by ID',
  })
  parseKondoId(val: string): string {
    return val;
  }

  /**
   * Dry run option
   */
  @Option({
    flags: '-d, --dry-run',
    description: 'Run without saving to database',
  })
  parseDryRun(): boolean {
    return true;
  }

  /**
   * Verbose logging option
   */
  @Option({
    flags: '-v, --verbose',
    description: 'Enable verbose logging',
  })
  parseVerbose(): boolean {
    return true;
  }
}
