import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ElementorScraperService } from '../elementor-scraper.service';
import { ElementorParserService } from '../elementor-parser.service';
import { ScrapingPlatformFactory } from '../../../core/scraping-platform.factory';
import { RetryService } from '../../../core/retry.service';

/**
 * Integration test for Elementor media extraction
 * Tests the extraction of images and videos from Absoluto Vila da Serra website
 * 
 * Test URL: https://www.absolutoviladaserra.com.br
 * Reference HTML: references/scraping/page_structure/elementor/absoluto.vila.da.serra.html
 */
describe('Elementor Media Extraction Integration', () => {
  let scraperService: ElementorScraperService;
  let parserService: ElementorParserService;
  let platformFactory: ScrapingPlatformFactory;
  let htmlContent: string;

  const TEST_URL = 'https://www.absolutoviladaserra.com.br';
  
  // Expected media from the HTML file
  const EXPECTED_CAROUSEL_IMAGES = [
    'Cozinha.avif',
    'Sala.avif',
    'Suite.avif',
    '22.avif',
    '21.avif',
    '20.avif',
    '19.avif',
    '18.avif',
    '17.avif',
    '16.avif',
    '15.avif',
    '14.avif',
    '3.avif',
    '4.avif',
    '5.avif',
    '6.avif',
    '7.avif',
    '8.avif',
    '9.avif',
    '10.avif',
    '11.avif',
    '13.avif',
    '12.avif',
  ];

  const EXPECTED_VIDEO = 'video-editado.mp4';

  beforeAll(async () => {
    // Load the HTML file from references directory
    const htmlPath = path.join(
      __dirname,
      '../../../../../references/scraping/page_structure/elementor/absoluto.vila.da.serra.html'
    );
    htmlContent = await fs.readFile(htmlPath, 'utf-8');
  });

  beforeEach(async () => {
    // Mock platform service that returns our local HTML
    const mockPlatformService = {
      fetchHtml: jest.fn().mockResolvedValue({
        html: htmlContent,
        metadata: {
          responseTimeMs: 100,
          httpStatus: 200,
          platform: 'mock',
          renderedJs: true,
        },
      }),
      isConfigured: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElementorScraperService,
        ElementorParserService,
        RetryService,
        {
          provide: ScrapingPlatformFactory,
          useValue: {
            getPlatformService: jest.fn().mockReturnValue(mockPlatformService),
          },
        },
      ],
    }).compile();

    scraperService = module.get<ElementorScraperService>(ElementorScraperService);
    parserService = module.get<ElementorParserService>(ElementorParserService);
    platformFactory = module.get<ScrapingPlatformFactory>(ScrapingPlatformFactory);
  });

  describe('Full scraper media extraction', () => {
    it('should extract all media (images and videos) from Absoluto Vila da Serra', async () => {
      const result = await scraperService.scrape(TEST_URL);

      expect(result).toBeDefined();
      expect(result.medias).toBeDefined();
      expect(Array.isArray(result.medias)).toBe(true);
      expect(result.medias.length).toBeGreaterThan(0);

      // Log extracted medias for inspection
      console.log(`\nExtracted ${result.medias.length} media URLs:`);
      result.medias.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
    });

    it('should extract carousel images from swiper component', async () => {
      const result = await scraperService.scrape(TEST_URL);

      // Check that expected carousel images are present
      const carouselImageUrls = result.medias.filter(url => 
        EXPECTED_CAROUSEL_IMAGES.some(imageName => url.includes(imageName))
      );

      console.log(`\nFound ${carouselImageUrls.length} carousel images out of ${EXPECTED_CAROUSEL_IMAGES.length} expected`);
      
      // Verify at least most carousel images are extracted
      expect(carouselImageUrls.length).toBeGreaterThanOrEqual(20);
      
      // Verify specific important images
      expect(result.medias.some(url => url.includes('Cozinha.avif'))).toBe(true);
      expect(result.medias.some(url => url.includes('Sala.avif'))).toBe(true);
      expect(result.medias.some(url => url.includes('Suite.avif'))).toBe(true);
    });

    it('should extract the hosted video', async () => {
      const result = await scraperService.scrape(TEST_URL);

      const videoUrls = result.medias.filter(url => url.includes(EXPECTED_VIDEO));
      
      console.log(`\nFound ${videoUrls.length} video(s):`);
      videoUrls.forEach(url => console.log(`  - ${url}`));

      // Should extract the video
      expect(videoUrls.length).toBeGreaterThanOrEqual(1);
      expect(videoUrls[0]).toContain('video-editado.mp4');
    });

    it('should return absolute URLs only', async () => {
      const result = await scraperService.scrape(TEST_URL);

      result.medias.forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });

    it('should not have duplicate URLs', async () => {
      const result = await scraperService.scrape(TEST_URL);

      const uniqueUrls = new Set(result.medias);
      expect(uniqueUrls.size).toBe(result.medias.length);
    });

    it('should extract media URLs with correct domain', async () => {
      const result = await scraperService.scrape(TEST_URL);

      // All media should be from absolutoviladaserra.com.br
      const domainUrls = result.medias.filter(url => 
        url.includes('absolutoviladaserra.com.br')
      );

      console.log(`\n${domainUrls.length} of ${result.medias.length} URLs are from absolutoviladaserra.com.br domain`);
      
      // Most/all should be from the correct domain
      expect(domainUrls.length).toBeGreaterThan(0);
    });
  });

  describe('Parser service media extraction', () => {
    it('should extract images using extractMediaUrls', () => {
      const imageUrls = parserService.extractMediaUrls(htmlContent, TEST_URL);

      console.log(`\nParser extracted ${imageUrls.length} image URLs`);
      
      expect(imageUrls).toBeDefined();
      expect(Array.isArray(imageUrls)).toBe(true);
      expect(imageUrls.length).toBeGreaterThan(0);
    });

    it('should extract videos using extractVideoUrls', () => {
      const videoUrls = parserService.extractVideoUrls(htmlContent, TEST_URL);

      console.log(`\nParser extracted ${videoUrls.length} video URLs`);
      
      expect(videoUrls).toBeDefined();
      expect(Array.isArray(videoUrls)).toBe(true);
      expect(videoUrls.length).toBeGreaterThanOrEqual(1);
      expect(videoUrls.some(url => url.includes(EXPECTED_VIDEO))).toBe(true);
    });

    it('should extract swiper carousel images', () => {
      const imageUrls = parserService.extractMediaUrls(htmlContent, TEST_URL);

      // Count how many carousel images were found
      const carouselImages = imageUrls.filter(url =>
        EXPECTED_CAROUSEL_IMAGES.some(imageName => url.includes(imageName))
      );

      console.log(`\nFound ${carouselImages.length} carousel images from parser`);
      
      expect(carouselImages.length).toBeGreaterThan(15);
    });
  });
});
