import { Test, TestingModule } from '@nestjs/testing';
import { GenericScraperService } from '../generic-scraper.service';
import { GenericParserService } from '../generic-parser.service';
import { GenericHeuristicsService } from '../generic-heuristics.service';
import { ScrapingFileLogger } from '../../../logger/scraping-file-logger';
import { ScrapflyService } from '../../../core/scrapfly.service';
import { ScrapingDogService } from '../../../core/scrapingdog.service';
import { ScrapingPlatformFactory } from '../../../core/scraping-platform.factory';
import { RetryService } from '../../../core/retry.service';
import { MediaRelevanceScorerService } from '../../../core/media-relevance-scorer.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration and Unit Tests for Generic Scraping Engine - Media Extraction
 * 
 * Focus: Testing media extraction (images, videos) from generic real estate sites
 * Target: Kondo 208 - https://www.epo.com.br/empreendimentos/torre-catharina/
 * 
 * Tests verify:
 * - Phase 1 & 2 media extraction
 * - URL validation
 * - Heuristics filtering
 * - Debug output generation
 */
describe('GenericScraperService - Media Extraction', () => {
  let scraperService: GenericScraperService;
  let parserService: GenericParserService;
  let heuristicsService: GenericHeuristicsService;
  let scrapflyService: ScrapflyService;
  let module: TestingModule;

  // Test constants
  const KONDO_208_URL = 'https://www.epo.com.br/empreendimentos/torre-catharina/';
  const KONDO_208_ID = 208;
  const TEST_RESULTS_DIR = path.join(process.cwd(), 'test-results', 'generic-scraping');

  beforeAll(async () => {
    // Ensure test results directory exists
    if (!fs.existsSync(TEST_RESULTS_DIR)) {
      fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
    }

    module = await Test.createTestingModule({
      providers: [
        GenericScraperService,
        GenericParserService,
        GenericHeuristicsService,
        ScrapingFileLogger,
        ScrapingDogService,
        ScrapflyService,
        ScrapingPlatformFactory,
        RetryService,
        MediaRelevanceScorerService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              // Use real environment variables for integration testing
              return process.env[key];
            },
          },
        },
        {
          provide: 'SCRAPING_CONFIG',
          useValue: {
            delay: { betweenRequestsMs: 100 },
            media: {
              minRelevanceScore: 0.3,
              minFileSizeKb: 10,
              minImageDimensions: { width: 200, height: 200 },
              supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            },
            protectedFields: [],
          },
        },
      ],
    }).compile();

    scraperService = module.get<GenericScraperService>(GenericScraperService);
    parserService = module.get<GenericParserService>(GenericParserService);
    heuristicsService = module.get<GenericHeuristicsService>(GenericHeuristicsService);
    scrapflyService = module.get<ScrapflyService>(ScrapflyService);
  });

  afterAll(async () => {
    await module.close();
  });

  // Check if API key is available for integration tests
  const hasScrapflyKey = !!process.env.SCRAPFLY_API_KEY;

  describe('Environment Configuration', () => {
    it('should check required environment variables for integration tests', () => {
      const requiredVars = [
        'SCRAPFLY_API_KEY',
      ];

      const optionalVars = [
        'SCRAPING_DOG_API_KEY',
        'SCRAPING_PLATFORM',
      ];

      const missingRequired = requiredVars.filter(varName => {
        const value = process.env[varName];
        return !value || value === '';
      });

      if (missingRequired.length > 0) {
        console.warn('⚠️  Missing required environment variables:');
        missingRequired.forEach(varName => {
          console.warn(`   - ${varName}`);
        });
        console.warn('   Integration tests will be skipped.');
        console.warn('   Example: export SCRAPFLY_API_KEY=your_key_here');
      } else {
        console.log('✓ All required environment variables present');
      }

      // Log all vars (hide sensitive values)
      [...requiredVars, ...optionalVars].forEach(varName => {
        const value = process.env[varName];
        if (value) {
          const displayValue = varName.includes('KEY') || varName.includes('SECRET')
            ? `${value.substring(0, 8)}...`
            : value;
          console.log(`✓ ${varName}: ${displayValue}`);
        } else {
          console.log(`⚠️  ${varName}: not set`);
        }
      });
    });
  });

  describe('Integration Test - Full Scraping Flow (Requires SCRAPFLY_API_KEY)', () => {
    let scrapedData: any;
    let htmlResponse: string;

    beforeAll(() => {
      if (!hasScrapflyKey) {
        console.warn('\n⚠️  Skipping integration tests - SCRAPFLY_API_KEY not set');
        console.warn('   Set environment variable to run full integration tests');
        console.warn('   Example: export SCRAPFLY_API_KEY=your_key_here\n');
      } else {
        console.log('\n✓ SCRAPFLY_API_KEY found - running integration tests\n');
      }
    });

    (hasScrapflyKey ? it : it.skip)('should fetch HTML from Scrapfly for kondo 208', async () => {
      const platformResponse = await scrapflyService.fetchHtml(KONDO_208_URL, {
        dynamic: true,
        premium: true,
        country: 'br',
      });

      htmlResponse = platformResponse.html;

      // Save HTML snapshot for debugging
      const htmlPath = path.join(TEST_RESULTS_DIR, `kondo-${KONDO_208_ID}-scrapfly-response.html`);
      fs.writeFileSync(htmlPath, htmlResponse, 'utf-8');

      console.log(`\n✓ Scrapfly Response:`);
      console.log(`  - HTML size: ${(htmlResponse.length / 1024).toFixed(2)} KB`);
      console.log(`  - Saved to: ${htmlPath}`);
      console.log(`  - Metadata:`, JSON.stringify(platformResponse.metadata, null, 2));

      expect(htmlResponse).toBeDefined();
      expect(htmlResponse.length).toBeGreaterThan(1000);
    }, 30000); // 30s timeout for network request

    (hasScrapflyKey ? it : it.skip)('should extract media URLs using full scraper pipeline', async () => {
      scrapedData = await scraperService.scrape(KONDO_208_URL);

      // Save extracted data
      const dataPath = path.join(TEST_RESULTS_DIR, `kondo-${KONDO_208_ID}-scraped-data.json`);
      fs.writeFileSync(dataPath, JSON.stringify(scrapedData, null, 2), 'utf-8');

      console.log(`✓ Saved scraped data to: ${dataPath}`);
      console.log(`✓ Media URLs found: ${scrapedData.medias?.length || 0}`);

      expect(scrapedData).toBeDefined();
      expect(scrapedData.medias).toBeDefined();
      expect(Array.isArray(scrapedData.medias)).toBe(true);
    }, 30000);

    (hasScrapflyKey ? it : it.skip)('should extract at least 5 media URLs from EPO Torre Catharina', () => {
      const mediaCount = scrapedData.medias?.length || 0;
      
      console.log(`\n📊 Media Extraction Summary:`);
      console.log(`   Total media URLs: ${mediaCount}`);
      console.log(`   Target URL: ${KONDO_208_URL}`);

      // EPO site should have multiple property images
      expect(mediaCount).toBeGreaterThanOrEqual(5);
    });

    (hasScrapflyKey ? it : it.skip)('should have valid media URLs (http/https protocol)', () => {
      const invalidUrls = scrapedData.medias.filter(
        (url: string) => !url.match(/^https?:/)
      );

      if (invalidUrls.length > 0) {
        console.log(`⚠️  Invalid URLs found:`, invalidUrls);
      }

      expect(invalidUrls.length).toBe(0);
    });

    (hasScrapflyKey ? it : it.skip)('should not have excessively long URLs (> 2000 chars)', () => {
      const longUrls = scrapedData.medias.filter(
        (url: string) => url.length > 2000
      );

      if (longUrls.length > 0) {
        console.log(`⚠️  Long URLs found:`, longUrls.map(u => `${u.substring(0, 100)}... (${u.length} chars)`));
      }

      expect(longUrls.length).toBe(0);
    });

    (hasScrapflyKey ? it : it.skip)('should generate test summary report', () => {
      const summary = `# Generic Scraper - Media Extraction Test Summary

**Test Date:** ${new Date().toISOString()}
**Target:** Kondo ${KONDO_208_ID} - ${KONDO_208_URL}

## Results

- **Total Media URLs Extracted:** ${scrapedData.medias?.length || 0}
- **Property Name:** ${scrapedData.name || 'N/A'}
- **Description Length:** ${scrapedData.description?.length || 0} chars
- **Scraped At:** ${scrapedData.scrapedAt}

## Media URLs

\`\`\`json
${JSON.stringify(scrapedData.medias || [], null, 2)}
\`\`\`

## Platform Metadata

\`\`\`json
${JSON.stringify(scrapedData.platformMetadata || {}, null, 2)}
\`\`\`

## Files Generated

- \`kondo-${KONDO_208_ID}-scrapfly-response.html\` - Raw HTML from Scrapfly
- \`kondo-${KONDO_208_ID}-scraped-data.json\` - Full scraped data
- \`kondo-${KONDO_208_ID}-test-summary.md\` - This summary

---
*Generated by generic-media-extraction.spec.ts*
`;

      const summaryPath = path.join(TEST_RESULTS_DIR, `kondo-${KONDO_208_ID}-test-summary.md`);
      fs.writeFileSync(summaryPath, summary, 'utf-8');

      console.log(`✓ Saved test summary to: ${summaryPath}`);
      expect(fs.existsSync(summaryPath)).toBe(true);
    });
  });

  describe('Unit Test - Parser extractMediaUrls', () => {
    it('should extract images from simple HTML with <img> tags', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/image1.jpg" alt="Image 1" />
            <img src="https://example.com/image2.png" alt="Image 2" />
            <img data-src="https://example.com/lazy-image.jpg" alt="Lazy" />
          </body>
        </html>
      `;

      const urls = parserService.extractMediaUrls(html);

      console.log(`\n🧪 Simple HTML Test - Found ${urls.length} URLs:`, urls);

      expect(urls.length).toBeGreaterThanOrEqual(2); // At least src images
      expect(urls).toContain('https://example.com/image1.jpg');
      expect(urls).toContain('https://example.com/image2.png');
    });

    it('should handle images with data-lazy-src attribute', () => {
      const html = `
        <html>
          <body>
            <img data-lazy-src="https://example.com/lazy-loaded.jpg" />
            <img data-src="https://example.com/data-src.jpg" />
            <img data-original="https://example.com/original.jpg" />
          </body>
        </html>
      `;

      const urls = parserService.extractMediaUrls(html);

      console.log(`\n🧪 Lazy-load Test - Found ${urls.length} URLs:`, urls);

      expect(urls.length).toBeGreaterThanOrEqual(3);
      expect(urls.some(url => url.includes('lazy-loaded'))).toBe(true);
      expect(urls.some(url => url.includes('data-src'))).toBe(true);
      expect(urls.some(url => url.includes('original'))).toBe(true);
    });

    it('should skip invalid URLs (no protocol)', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/valid.jpg" />
            <img src="/relative/path.jpg" />
            <img src="data:image/png;base64,abc123" />
            <img src="invalid-url" />
          </body>
        </html>
      `;

      const urls = parserService.extractMediaUrls(html);

      console.log(`\n🧪 Invalid URL Test - Found ${urls.length} URLs:`, urls);

      // Should only get the valid https URL
      expect(urls.length).toBe(1);
      expect(urls[0]).toBe('https://example.com/valid.jpg');
    });

    it('should handle Phase 1 (specific selectors) and Phase 2 (universal fallback)', () => {
      const html = `
        <html>
          <body>
            <div class="gallery">
              <img src="https://example.com/gallery1.jpg" />
              <img src="https://example.com/gallery2.jpg" />
            </div>
            <section>
              <img src="https://example.com/section-image.jpg" />
            </section>
          </body>
        </html>
      `;

      const urls = parserService.extractMediaUrls(html);

      console.log(`\n🧪 Phase Test - Found ${urls.length} URLs:`, urls);

      // All images should be captured by Phase 2 universal fallback
      expect(urls.length).toBe(3);
    });

    it('should deduplicate identical URLs', () => {
      const html = `
        <html>
          <body>
            <img src="https://example.com/duplicate.jpg" />
            <img src="https://example.com/duplicate.jpg" />
            <img src="https://example.com/unique.jpg" />
          </body>
        </html>
      `;

      const urls = parserService.extractMediaUrls(html);

      console.log(`\n🧪 Deduplication Test - Found ${urls.length} unique URLs:`, urls);

      // Should only have 2 unique URLs
      expect(urls.length).toBe(2);
      expect(urls).toContain('https://example.com/duplicate.jpg');
      expect(urls).toContain('https://example.com/unique.jpg');
    });

    it('should extract YouTube/Vimeo video URLs', () => {
      const html = `
        <html>
          <body>
            <iframe src="https://www.youtube.com/embed/abc123"></iframe>
            <iframe src="https://player.vimeo.com/video/123456"></iframe>
          </body>
        </html>
      `;

      const urls = parserService.extractMediaUrls(html);

      console.log(`\n🧪 Video Test - Found ${urls.length} URLs:`, urls);

      expect(urls.length).toBeGreaterThanOrEqual(2);
      expect(urls.some(url => url.includes('youtube'))).toBe(true);
      expect(urls.some(url => url.includes('vimeo'))).toBe(true);
    });
  });

  describe('Unit Test - URL Validation', () => {
    it('should accept valid http URLs', () => {
      const url = 'http://example.com/image.jpg';
      const isValid = parserService['isValidMediaUrl'](url);
      expect(isValid).toBe(true);
    });

    it('should accept valid https URLs', () => {
      const url = 'https://example.com/image.jpg';
      const isValid = parserService['isValidMediaUrl'](url);
      expect(isValid).toBe(true);
    });

    it('should accept protocol-relative URLs', () => {
      const url = '//cdn.example.com/image.jpg';
      const isValid = parserService['isValidMediaUrl'](url);
      expect(isValid).toBe(true);
    });

    it('should reject relative paths', () => {
      const url = '/images/photo.jpg';
      const isValid = parserService['isValidMediaUrl'](url);
      expect(isValid).toBe(false);
    });

    it('should reject data URIs', () => {
      const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const isValid = parserService['isValidMediaUrl'](url);
      expect(isValid).toBe(false);
    });

    it('should reject URLs longer than 2000 characters', () => {
      const url = 'https://example.com/' + 'a'.repeat(2000);
      const isValid = parserService['isValidMediaUrl'](url);
      expect(isValid).toBe(false);
    });

    it('should reject empty/null URLs', () => {
      expect(parserService['isValidMediaUrl']('')).toBe(false);
      expect(parserService['isValidMediaUrl'](null as any)).toBe(false);
      expect(parserService['isValidMediaUrl'](undefined as any)).toBe(false);
    });
  });

  describe('Debug Output', () => {
    it('should have created test results directory', () => {
      expect(fs.existsSync(TEST_RESULTS_DIR)).toBe(true);
    });

    (hasScrapflyKey ? it : it.skip)('should list all generated test artifacts', () => {
      const files = fs.readdirSync(TEST_RESULTS_DIR);
      
      console.log(`\n📁 Test Artifacts in ${TEST_RESULTS_DIR}:`);
      files.forEach(file => {
        const stats = fs.statSync(path.join(TEST_RESULTS_DIR, file));
        console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      });

      expect(files.length).toBeGreaterThan(0);
    });
  });
});
