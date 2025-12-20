import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Custom file logger for scraping operations
 * Writes all logs to timestamped files in references/scraping/outputs/
 */
@Injectable()
export class ScrapingFileLogger {
  private logFile: string;
  private logsDir: string;
  private readonly logger = new Logger(ScrapingFileLogger.name);

  constructor() {
    this.logsDir = path.join(process.cwd(), 'references', 'scraping', 'outputs');
    this.ensureLogsDirectory();
    this.createLogFile();
  }

  /**
   * Ensure logs directory exists
   */
  private ensureLogsDirectory(): void {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
        this.logger.log(`Created logs directory: ${this.logsDir}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create logs directory: ${error.message}`);
    }
  }

  /**
   * Create timestamped log file
   */
  private createLogFile(): void {
    try {
      const timestamp = this.getTimestamp();
      this.logFile = path.join(this.logsDir, `scrape-${timestamp}.log`);
      
      // Create file with header
      const header = `
${'='.repeat(80)}
Scraping Run Started: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}
Platform Provider: ${process.env.SCRAPING_PLATFORM_PROVIDER || 'scrapingdog'}
${'='.repeat(80)}
`;
      fs.writeFileSync(this.logFile, header, { encoding: 'utf-8' });
      this.logger.log(`Created log file: ${this.logFile}`);
    } catch (error) {
      this.logger.error(`Failed to create log file: ${error.message}`);
    }
  }

  /**
   * Write log entry to file
   */
  write(level: string, message: string, context?: string, meta?: any): void {
    try {
      if (!this.logFile) return;

      const timestamp = new Date().toISOString();
      const contextStr = context ? ` [${context}]` : '';
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      const logEntry = `${timestamp} ${level.padEnd(6)}${contextStr} ${message}${metaStr}\n`;

      fs.appendFileSync(this.logFile, logEntry, { encoding: 'utf-8' });
    } catch (error) {
      this.logger.error(`Failed to write to log file: ${error.message}`);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, meta?: any): void {
    this.write('INFO', message, context, meta);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: string, meta?: any): void {
    this.write('DEBUG', message, context, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, meta?: any): void {
    this.write('WARN', message, context, meta);
  }

  /**
   * Log error message
   */
  error(message: string, context?: string, error?: any, meta?: any): void {
    const errorStr = error ? `\n  Error: ${error.message}\n  Stack: ${error.stack}` : '';
    this.write('ERROR', message + errorStr, context, meta);
  }

  /**
   * Log validation error with detailed information
   */
  logValidationError(kondoId: number, kondoName: string, error: any, data?: any): void {
    const errorMessage = error?.message || JSON.stringify(error);
    const details: any = {
      kondoId,
      kondoName,
      error: errorMessage,
    };

    // Extract Sequelize validation errors
    if (error?.errors && Array.isArray(error.errors)) {
      details.validationErrors = error.errors.map((e: any) => ({
        path: e.path,
        message: e.message,
        type: e.type,
        value: e.value,
      }));
    }

    // Include sample of data being saved (truncated)
    if (data) {
      const dataKeys = Object.keys(data);
      if (dataKeys.length > 0) {
        details.dataSnapshot = {};
        dataKeys.slice(0, 5).forEach((key) => {
          details.dataSnapshot[key] = String(data[key]).substring(0, 50);
        });
      }
    }

    this.write('ERROR', `Validation error for kondo ${kondoId}`, 'ScrapingService', details);
  }

  /**
   * Log field changes for a kondo with before/after differential
   */
  logKondoChanges(
    kondoId: number,
    kondoName: string,
    changes: Record<string, { before: any; after: any }>,
    ignoredFields?: string[]
  ): void {
    const lines: string[] = [];
    lines.push(`\nKondo Updates for [${kondoId}] "${kondoName}":`);

    // Log actual changes
    const changeCount = Object.keys(changes).length;
    if (changeCount > 0) {
      Object.entries(changes).forEach(([field, { before, after }]) => {
        const beforeStr = this.formatValue(before);
        const afterStr = this.formatValue(after);
        lines.push(`  ✓ ${field}: ${beforeStr} → ${afterStr}`);
      });
    }

    // Log ignored protected fields
    if (ignoredFields && ignoredFields.length > 0) {
      ignoredFields.forEach((field) => {
        lines.push(`  ⚠️  IGNORED (protected): ${field}`);
      });
    }

    // Summary line
    const ignoredCount = ignoredFields?.length || 0;
    const summaryParts = [`${changeCount} field${changeCount !== 1 ? 's' : ''} updated`];
    if (ignoredCount > 0) {
      summaryParts.push(`${ignoredCount} protected field${ignoredCount !== 1 ? 's' : ''} ignored`);
    }
    lines.push(`  → Total: ${summaryParts.join(', ')}`);

    this.write('INFO', lines.join('\n'), 'ScrapingService');
  }

  /**
   * Log media extraction statistics
   */
  logMediaExtraction(
    kondoId: number,
    kondoName: string,
    stats: {
      totalDiscovered: number;
      imagesDiscovered: number;
      videosDiscovered: number;
      imagesUploaded: number;
      videosDownloaded: number;
      videosEmbedded: number;
      totalSaved: number;
    }
  ): void {
    const lines: string[] = [];
    lines.push(`\nMedia Extraction for [${kondoId}] "${kondoName}":`);
    lines.push(`  📷 Images discovered: ${stats.imagesDiscovered}`);
    lines.push(`  🎥 Videos discovered: ${stats.videosDiscovered}`);
    lines.push(`  📊 Total discovered: ${stats.totalDiscovered}`);
    lines.push(`  `);
    lines.push(`  ✅ Images uploaded to cloud: ${stats.imagesUploaded}`);
    lines.push(`  ✅ Videos downloaded/uploaded: ${stats.videosDownloaded}`);
    lines.push(`  🔗 Videos saved as URLs (YouTube/Vimeo): ${stats.videosEmbedded}`);
    lines.push(`  → Total saved: ${stats.totalSaved}`);

    if (stats.totalSaved < stats.totalDiscovered) {
      const skipped = stats.totalDiscovered - stats.totalSaved;
      lines.push(`  ⚠️  Skipped (filtered out): ${skipped}`);
    }

    this.write('INFO', lines.join('\n'), 'ScrapingService');
  }

  /**
   * Log platform response metadata
   */
  logPlatformResponse(
    kondoId: number,
    metadata: any
  ): void {
    const lines: string[] = [];
    lines.push(`\nPlatform Response for Kondo [${kondoId}]:`);

    if (metadata.platform) {
      lines.push(`  Platform: ${metadata.platform}`);
    }

    if (metadata.responseTimeMs !== undefined) {
      lines.push(`  Response Time: ${metadata.responseTimeMs}ms`);
    }

    if (metadata.statusCode !== undefined) {
      lines.push(`  HTTP Status: ${metadata.statusCode}`);
    }

    if (metadata.cost !== undefined) {
      lines.push(`  API Cost: ${metadata.cost} credits`);
    }

    if (metadata.renderedJs !== undefined) {
      lines.push(`  JS Rendering: ${metadata.renderedJs ? 'enabled' : 'disabled'}`);
    }

    if (metadata.scrapeId !== undefined) {
      lines.push(`  Scrape ID: ${metadata.scrapeId}`);
    }

    if (metadata.duration !== undefined) {
      lines.push(`  Duration: ${metadata.duration}ms`);
    }

    // Log any additional metadata
    const ignoredKeys = ['statusCode', 'cost', 'renderedJs', 'responseTimeMs', 'platform', 'scrapeId', 'duration', 'rawResponse'];
    const additionalKeys = Object.keys(metadata).filter(k => !ignoredKeys.includes(k) && metadata[k] !== undefined);
    
    if (additionalKeys.length > 0) {
      lines.push('  Additional metadata:');
      additionalKeys.forEach(key => {
        const value = metadata[key];
        lines.push(`    ${key}: ${JSON.stringify(value).substring(0, 100)}`);
      });
    }

    this.write('INFO', lines.join('\n'), 'ScrapingService');
  }
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'string') {
      // Truncate long strings
      return value.length > 50 ? `"${value.substring(0, 47)}..."` : `"${value}"`;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    // For objects/arrays
    return JSON.stringify(value).substring(0, 50);
  }

  /**
   * Log scraping summary
   */
  logSummary(success: number, failed: number, skipped: number, errors: any[], totalFieldsChanged?: number, totalProtectedIgnored?: number): void {
    const summary = `
${'='.repeat(80)}
SCRAPING SUMMARY
${'='.repeat(80)}
✅ Success:  ${success}
❌ Failed:   ${failed}
⏭️  Skipped:  ${skipped}
Total:       ${success + failed + skipped}
${totalFieldsChanged !== undefined ? `📊 Total fields updated: ${totalFieldsChanged}${success > 0 ? ` (avg ${(totalFieldsChanged / success).toFixed(1)} per kondo)` : ''}` : ''}
${totalProtectedIgnored !== undefined && totalProtectedIgnored > 0 ? `🔒 Protected fields ignored: ${totalProtectedIgnored}` : ''}
${failed > 0 ? '\n❌ Failed Kondos:\n' + errors.map((e) => `   - Kondo ${e.kondoId}: ${e.error}`).join('\n') : ''}
${'='.repeat(80)}
Scraping Run Ended: ${new Date().toISOString()}
${'='.repeat(80)}
`;
    this.write('INFO', summary, 'ScrapingService');
  }

  /**
   * Get current timestamp (YYYY-MM-DD-HHmmss format)
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Get the current log file path
   */
  getLogFilePath(): string {
    return this.logFile;
  }
}
