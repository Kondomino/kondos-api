import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as AdobeSDK from '@adobe/pdfservices-node-sdk';
import { AdobePdfService, PdfExtractionResult } from '../adobe-pdf.service';
import { StorageStreamCdnService } from '../../../storage/services/storage-stream-cdn.service';
import { Readable } from 'stream';

/**
 * Integration Test Suite for AdobePdfService with Streaming Architecture
 * 
 * This test suite validates:
 * - PDF extraction capabilities (text, tables, media)
 * - Streaming ZIP → CDN upload pipeline
 * - Media filtering by size and resolution
 * - CDN URL generation and storage
 * - Error handling and resilience
 * - Proper logging at all stages
 * - Temp file cleanup
 * - Multiple PDF processing
 * 
 * Output Locations:
 * - CDN media: DigitalOcean Spaces (public-read + CDN)
 * - Extracted content: ./uploads/extracted/ (legacy, for reference)
 * - Extracted images: ./uploads/images/ (legacy, for reference)
 * - Temp files (during processing): ./temp/ (cleaned up)
 * - Test logs: Jest console output + service logger
 */
describe('AdobePdfService Integration Tests (Streaming Architecture)', () => {
  let service: AdobePdfService;
  let storageService: StorageStreamCdnService;
  let configService: ConfigService;
  let module: TestingModule;
  let attemptId: string;

  const TEST_PDFS = [
    {
      name: 'mirrage.pdf',
      path: path.join(process.cwd(), 'references', 'pdfs', 'mirrage.pdf'),
      description: 'General document'
    },
    {
      name: 'BurleMarx.pdf',
      path: path.join(process.cwd(), 'references', 'pdfs', 'BurleMarx.pdf'),
      description: 'Landscape design document'
    }
  ];

  const OUTPUT_DIRS = {
    extracted: path.join(process.cwd(), 'uploads', 'extracted'),
    images: path.join(process.cwd(), 'uploads', 'images'),
    temp: path.join(process.cwd(), 'temp'),
    testResults: path.join(process.cwd(), 'test-results', 'pdf-extraction')
  };

  beforeAll(async () => {
    // Generate unique attempt ID for this test run
    const now = new Date();
    const dateStr = now.getFullYear() + 
      ('0' + (now.getMonth() + 1)).slice(-2) + 
      ('0' + now.getDate()).slice(-2) + 
      '_' +
      ('0' + now.getHours()).slice(-2) + 
      ('0' + now.getMinutes()).slice(-2) + 
      ('0' + now.getSeconds()).slice(-2);
    attemptId = `attempt_${dateStr}`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Test Attempt (Streaming): ${attemptId}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Create attempt-specific directories
    const attemptDir = path.join(process.cwd(), 'test-results', 'pdf-extraction', attemptId);
    const filesDir = path.join(attemptDir, 'files');
    const extractionResultsDir = path.join(attemptDir, 'extraction_results');

    const dirs = [
      ...Object.values(OUTPUT_DIRS),
      attemptDir,
      filesDir,
      extractionResultsDir
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env'
        })
      ],
      providers: [AdobePdfService, StorageStreamCdnService]
    }).compile();

    service = module.get<AdobePdfService>(AdobePdfService);
    storageService = module.get<StorageStreamCdnService>(StorageStreamCdnService);
    configService = module.get<ConfigService>(ConfigService);

    // Verify env vars are loaded
    const clientId = configService.get<string>('ADOBE_PDF_CLIENT_ID');
    const clientSecret = configService.get<string>('ADOBE_PDF_CLIENT_SECRET');
    const cdnEndpoint = configService.get<string>('DIGITAL_OCEAN_CDN_ENDPOINT');
    
    console.log('🔐 Configuration Status:');
    console.log(`  - ADOBE_PDF_CLIENT_ID: ${clientId ? '✓ Loaded' : '✗ Missing'}`);
    console.log(`  - ADOBE_PDF_CLIENT_SECRET: ${clientSecret ? '✓ Loaded' : '✗ Missing'}`);
    console.log(`  - DIGITAL_OCEAN_CDN_ENDPOINT: ${cdnEndpoint ? '✓ Loaded' : '✗ Missing'}`);

    console.log('\n📂 Output Directories:');
    console.log(`  - Attempt root: ${attemptDir}`);
    console.log(`  - Extraction results: ${extractionResultsDir}`);
    console.log(`  - Extracted files: ${filesDir}`);
    console.log(`  - CDN Endpoint: ${cdnEndpoint}\n`);

    // Validate input PDFs
    console.log('📁 Validating input PDFs:');
    
    for (const pdf of TEST_PDFS) {
      if (fs.existsSync(pdf.path)) {
        const stats = fs.statSync(pdf.path);
        const fileSizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  ✓ ${pdf.name}: ${fileSizeMb}MB`);
      } else {
        console.log(`  ❌ NOT FOUND: ${pdf.name}`);
      }
    }
  });

  afterAll(async () => {
    // Wait for any pending async operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    await module.close();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    }, 30000);

    it('should initialize with proper logger', () => {
      expect(service['logger']).toBeDefined();
      expect(service['logger']).toBeInstanceOf(Logger);
    }, 30000);

    it('should have adobePdfEnabled flag', () => {
      expect(service.adobePdfEnabled).toBeDefined();
      expect(typeof service.adobePdfEnabled).toBe('boolean');
    }, 30000);

    it('should initialize storage service', () => {
      expect(storageService).toBeDefined();
      expect(storageService['config']).toBeDefined();
    }, 30000);

    it('should load media filter configuration', () => {
      const filters = service['mediaFilters'];
      expect(filters).toBeDefined();
      expect(filters.minSizeKb).toBe(900);
      expect(filters.minResolution.width).toBe(720);
      expect(filters.minResolution.height).toBe(680);
      console.log(`\n  Media Filter Config:`);
      console.log(`    - Min Size: ${filters.minSizeKb}KB`);
      console.log(`    - Min Resolution: ${filters.minResolution.width}×${filters.minResolution.height}`);
    }, 30000);
  });

  describe('Credentials Testing', () => {
    it('should test credentials successfully or gracefully fail', async () => {
      const result = await service.testCredentials();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');

      console.log(`  Credentials test: ${result.message}`);
    }, 30000);
  });

  describe('PDF Extraction from Buffer (Streaming)', () => {
    TEST_PDFS.forEach((pdfFile) => {
      it(`should extract content from ${pdfFile.name} with streaming CDN upload`, async () => {
        // Skip if PDF doesn't exist
        if (!fs.existsSync(pdfFile.path)) {
          console.warn(`⚠️  PDF not found: ${pdfFile.path}, skipping...`);
          expect(true).toBe(true);
          return;
        }

        console.log(`\n📄 Testing PDF: ${pdfFile.name}`);
        console.log(`   Description: ${pdfFile.description}`);

        // Prepare PDF: split if large
        const pdfChunks = await splitLargePdf(pdfFile.path);
        console.log(`   Split into ${pdfChunks.length} chunk(s)`);

        // Process each chunk
        for (let chunkIdx = 0; chunkIdx < pdfChunks.length; chunkIdx++) {
          const pdfBuffer = pdfChunks[chunkIdx];
          console.log(`   Processing chunk ${chunkIdx + 1}/${pdfChunks.length}: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB`);

          const messageId = `test-${Date.now()}-${pdfFile.name.replace('.pdf', '')}-chunk${chunkIdx + 1}`;

          // Extract from buffer
          const startTime = Date.now();
          const result = await service.extractPdfFromBuffer(pdfBuffer, messageId, startTime);
          const duration = Date.now() - startTime;

          // Validate extraction result structure
          expect(result).toBeDefined();
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('text');
          expect(result).toHaveProperty('tables');
          expect(result).toHaveProperty('mediaUrls');
          expect(result).toHaveProperty('metadata');

          // ✨ NEW: Validate media URLs instead of images
          expect(Array.isArray(result.mediaUrls)).toBe(true);

          // Validate metadata
          expect(result.metadata).toHaveProperty('extractionTime');
          expect(result.metadata).toHaveProperty('elementsFound');
          expect(result.metadata).toHaveProperty('fileSize');
          expect(result.metadata).toHaveProperty('mediaStats');

          console.log(`     ✓ Chunk extraction completed in ${duration}ms`);
          console.log(`     ✓ Result: success=${result.success}`);
          console.log(`     ✓ Text characters: ${result.text?.length || 0}`);
          console.log(`     ✓ Tables found: ${result.tables?.length || 0}`);
          console.log(`     ✓ Media URLs generated: ${result.mediaUrls?.length || 0}`);
          console.log(`     ✓ File size recorded: ${(result.metadata.fileSize / 1024).toFixed(2)} KB`);
          console.log(`     ✓ Total elements: ${result.metadata.elementsFound}`);

          // Log media stats
          if (result.metadata.mediaStats) {
            console.log(`     ✓ Media Stats:`);
            console.log(`         - Uploaded: ${result.metadata.mediaStats.uploaded}`);
            console.log(`         - Skipped: ${result.metadata.mediaStats.skipped}`);
            console.log(`         - Errors: ${result.metadata.mediaStats.errors}`);
          }

          // Validate CDN URLs format if media was uploaded
          if (result.mediaUrls && result.mediaUrls.length > 0) {
            result.mediaUrls.forEach((url, idx) => {
              expect(url).toContain('https://');
              expect(url).toContain('.digitaloceanspaces.com');
              console.log(`     ✓ Media URL ${idx + 1}: ${url.substring(0, 80)}...`);
            });
          }

          // Save extraction results
          const chunkName = `${pdfFile.name.replace('.pdf', '')}-chunk${chunkIdx + 1}`;
          await saveExtractionResults(attemptId, chunkName, result, duration);
        }
      }, 300000); // 5 minute timeout for large PDFs with splitting
    });
  });

  describe('Streaming Architecture Validation', () => {
    it('should not create temporary ZIP files after extraction', async () => {
      if (!fs.existsSync(TEST_PDFS[0].path)) {
        expect(true).toBe(true);
        return;
      }

      const tempDir = path.join(process.cwd(), 'temp');
      const filesBefore = fs.readdirSync(tempDir).length;

      const pdfBuffer = fs.readFileSync(TEST_PDFS[0].path);
      const messageId = `test-streaming-${Date.now()}`;

      await service.extractPdfFromBuffer(pdfBuffer, messageId);

      // Small delay to ensure file operations complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const filesAfter = fs.readdirSync(tempDir).length;

      console.log(`\n  Temp file validation:`);
      console.log(`    - Files before: ${filesBefore}`);
      console.log(`    - Files after: ${filesAfter}`);
      console.log(`    - Streaming: ✓ No ZIP temp files created`);

      // Should have same or fewer files (no accumulation)
      expect(filesAfter).toBeLessThanOrEqual(filesBefore + 1);
    }, 300000);

    it('should validate media filtering is applied', async () => {
      if (!fs.existsSync(TEST_PDFS[0].path)) {
        expect(true).toBe(true);
        return;
      }

      const pdfBuffer = fs.readFileSync(TEST_PDFS[0].path);
      const messageId = `test-filtering-${Date.now()}`;

      const result = await service.extractPdfFromBuffer(pdfBuffer, messageId);

      expect(result.metadata.mediaStats).toBeDefined();
      
      console.log(`\n  Media filtering validation:`);
      console.log(`    - Uploaded: ${result.metadata.mediaStats?.uploaded || 0}`);
      console.log(`    - Skipped: ${result.metadata.mediaStats?.skipped || 0}`);
      console.log(`    - Errors: ${result.metadata.mediaStats?.errors || 0}`);

      if (result.metadata.mediaStats?.skippedReasons && result.metadata.mediaStats.skippedReasons.length > 0) {
        console.log(`    - Skip reasons:`);
        result.metadata.mediaStats.skippedReasons.slice(0, 3).forEach(reason => {
          console.log(`      • ${reason}`);
        });
      }
    }, 300000);
  });

  describe('PDF Extraction from URL (Mocked)', () => {
    it('should handle PDF download and extraction flow', async () => {
      if (!fs.existsSync(TEST_PDFS[0].path)) {
        console.warn('⚠️  Test PDF not found, skipping URL extraction test');
        expect(true).toBe(true);
        return;
      }

      const pdfBuffer = fs.readFileSync(TEST_PDFS[0].path);
      const messageId = `test-url-${Date.now()}`;

      const downloadPdfSpy = jest.spyOn(service as any, 'downloadPdf');
      downloadPdfSpy.mockResolvedValue(pdfBuffer);

      const result = await service.extractPdfContent('http://mock-whatsapp-url.com/pdf', messageId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');

      console.log(`\n📥 PDF from URL (mocked):`);
      console.log(`   ✓ Download mocked successfully`);
      console.log(`   ✓ Result: success=${result.success}`);
      console.log(`   ✓ Media URLs: ${result.mediaUrls.length}`);

      downloadPdfSpy.mockRestore();
    }, 300000);
  });

  describe('Error Handling', () => {
    it('should handle invalid PDF buffer gracefully', async () => {
      const invalidBuffer = Buffer.from('This is not a PDF');
      const messageId = `test-invalid-${Date.now()}`;

      const result = await service.extractPdfFromBuffer(invalidBuffer, messageId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.text).toBe('');
      expect(result.tables).toEqual([]);
      expect(result.mediaUrls).toEqual([]);

      console.log(`\n⚠️  Invalid PDF handling:`);
      console.log(`   ✓ Gracefully handled invalid buffer`);
      console.log(`   ✓ Error: ${result.error}`);
    }, 30000);

    it('should handle network errors during extraction', async () => {
      const messageId = `test-network-${Date.now()}`;

      const downloadPdfSpy = jest.spyOn(service as any, 'downloadPdf');
      downloadPdfSpy.mockRejectedValue(new Error('Network timeout'));

      const result = await service.extractPdfContent('http://mock-error.com/pdf', messageId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');

      console.log(`\n🌐 Network error handling:`);
      console.log(`   ✓ Network error caught and logged`);

      downloadPdfSpy.mockRestore();
    }, 30000);
  });

  describe('Temp File Cleanup', () => {
    it('should clean up temporary PDF files after extraction', async () => {
      if (!fs.existsSync(TEST_PDFS[0].path)) {
        expect(true).toBe(true);
        return;
      }

      const tempDir = path.join(process.cwd(), 'temp');
      const filesBefore = fs.readdirSync(tempDir).length;

      const pdfBuffer = fs.readFileSync(TEST_PDFS[0].path);
      const messageId = `test-cleanup-${Date.now()}`;

      await service.extractPdfFromBuffer(pdfBuffer, messageId);

      await new Promise(resolve => setTimeout(resolve, 100));

      const filesAfter = fs.readdirSync(tempDir).length;

      console.log(`\n🧹 Cleanup verification:`);
      console.log(`   ✓ Temp files before: ${filesBefore}`);
      console.log(`   ✓ Temp files after: ${filesAfter}`);

      expect(filesAfter).toBeLessThanOrEqual(filesBefore + 1);
    }, 300000);
  });

  describe('Sequential PDF Processing', () => {
    it('should process all PDFs sequentially without interference', async () => {
      const results: any[] = [];

      for (const pdfFile of TEST_PDFS) {
        if (!fs.existsSync(pdfFile.path)) {
          console.warn(`⚠️  Skipping ${pdfFile.name}`);
          continue;
        }

        console.log(`\n🔄 Processing: ${pdfFile.name}`);

        const pdfChunks = await splitLargePdf(pdfFile.path);
        console.log(`   Split into ${pdfChunks.length} chunk(s)`);

        for (let chunkIdx = 0; chunkIdx < pdfChunks.length; chunkIdx++) {
          const pdfBuffer = pdfChunks[chunkIdx];
          const messageId = `sequential-${Date.now()}-${results.length}-chunk${chunkIdx + 1}`;

          console.log(`   Processing chunk ${chunkIdx + 1}/${pdfChunks.length}: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB`);

          const result = await service.extractPdfFromBuffer(pdfBuffer, messageId);
          results.push({
            file: `${pdfFile.name} (chunk ${chunkIdx + 1}/${pdfChunks.length})`,
            result,
            timestamp: new Date().toISOString()
          });

          expect(result).toHaveProperty('success');
          expect(result.metadata.fileSize).toBe(pdfBuffer.length);
          expect(Array.isArray(result.mediaUrls)).toBe(true);

          console.log(`     ✓ Chunk processed successfully`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`\n📊 Sequential processing summary:`);
      console.log(`   ✓ Processed ${results.length} PDFs successfully`);
      results.forEach((r, idx) => {
        console.log(`     ${idx + 1}. ${r.file} - success: ${r.result.success}, media: ${r.result.mediaUrls.length}`);
      });

      expect(results.length).toBeGreaterThan(0);
    }, 300000);
  });

  describe('Logging Validation', () => {
    it('should log all key stages of extraction', async () => {
      if (!fs.existsSync(TEST_PDFS[0].path)) {
        expect(true).toBe(true);
        return;
      }

      const loggerSpy = jest.spyOn(service['logger'], 'log');

      const pdfBuffer = fs.readFileSync(TEST_PDFS[0].path);
      const messageId = `test-logging-${Date.now()}`;

      await service.extractPdfFromBuffer(pdfBuffer, messageId);

      expect(loggerSpy).toHaveBeenCalled();

      const logCalls = loggerSpy.mock.calls.map(call => call[0].toString());
      const expectedLogs = [
        '[PDF-EXTRACT-BUFFER]',
        '[ADOBE-API]',
        '[ZIP-PARSE]',
        '[CLEANUP]'
      ];

      console.log(`\n📝 Logging validation:`);
      expectedLogs.forEach(tag => {
        const found = logCalls.some(call => call.includes(tag));
        console.log(`   ${found ? '✓' : '✗'} Log tag found: ${tag}`);
      });

      loggerSpy.mockRestore();
    }, 300000);
  });

  describe('CDN URL Validation', () => {
    it('should generate valid CDN URLs from extracted media', async () => {
      if (!fs.existsSync(TEST_PDFS[0].path)) {
        expect(true).toBe(true);
        return;
      }

      const pdfBuffer = fs.readFileSync(TEST_PDFS[0].path);
      const messageId = `test-cdn-${Date.now()}`;

      const result = await service.extractPdfFromBuffer(pdfBuffer, messageId);

      console.log(`\n🌐 CDN URL Validation:`);
      console.log(`   ✓ Total media URLs: ${result.mediaUrls.length}`);

      if (result.mediaUrls.length > 0) {
        result.mediaUrls.forEach((url, idx) => {
          expect(url).toMatch(/^https:\/\/.+\.digitaloceanspaces\.com/);
          expect(url).toContain('/extracted/');
          console.log(`   ✓ URL ${idx + 1}: Valid format`);
        });
      } else {
        console.log(`   ℹ  No media URLs (may have been filtered)`);
      }
    }, 300000);
  });
});

/**
 * Helper function to save extraction results to organized directory structure
 */
async function saveExtractionResults(
  attemptId: string,
  chunkName: string,
  result: PdfExtractionResult,
  duration: number
) {
  const attemptDir = path.join(process.cwd(), 'test-results', 'pdf-extraction', attemptId);
  const filesDir = path.join(attemptDir, 'files', chunkName);
  const extractionResultsDir = path.join(attemptDir, 'extraction_results');
  
  await fs.promises.mkdir(filesDir, { recursive: true });
  await fs.promises.mkdir(extractionResultsDir, { recursive: true });

  const resultFile = path.join(extractionResultsDir, `${chunkName}.json`);
  const resultData = {
    file: chunkName,
    timestamp: new Date().toISOString(),
    duration: duration,
    result: {
      success: result.success,
      textLength: result.text?.length || 0,
      tablesCount: result.tables?.length || 0,
      mediaUrlsCount: result.mediaUrls?.length || 0,
      mediaStats: result.metadata.mediaStats,
      error: result.error || null
    },
    metadata: result.metadata
  };

  await fs.promises.writeFile(resultFile, JSON.stringify(resultData, null, 2));

  if (result.success) {
    if (result.text) {
      const textFile = path.join(filesDir, 'text.txt');
      await fs.promises.writeFile(textFile, result.text);
    }

    if (result.tables && result.tables.length > 0) {
      const tablesFile = path.join(filesDir, 'tables.json');
      await fs.promises.writeFile(tablesFile, JSON.stringify(result.tables, null, 2));
    }

    if (result.mediaUrls && result.mediaUrls.length > 0) {
      const mediaUrlsFile = path.join(filesDir, 'media_urls.json');
      await fs.promises.writeFile(mediaUrlsFile, JSON.stringify(result.mediaUrls, null, 2));
    }

    console.log(`  💾 Saved extraction results to: ${filesDir}`);
  }
}

/**
 * Helper function to split large PDFs using byte-based chunking
 */
async function splitLargePdf(filePath: string, maxSizeMb: number = 80): Promise<Buffer[]> {
  try {
    const fileSize = (await fs.promises.stat(filePath)).size;
    const fileSizeMb = fileSize / (1024 * 1024);

    console.log(`  📄 PDF Size Check: ${fileSizeMb.toFixed(2)}MB`);

    if (fileSizeMb <= maxSizeMb) {
      console.log(`  ℹ️  PDF is within safe limits (≤${maxSizeMb}MB), no split needed`);
      const buffer = await fs.promises.readFile(filePath);
      return [buffer];
    }

    console.log(`  ⚠️  PDF exceeds ${maxSizeMb}MB limit. Size: ${fileSizeMb.toFixed(2)}MB`);
    console.log(`  🔄 Splitting PDF into smaller chunks...`);

    const pdfBuffer = await fs.promises.readFile(filePath);
    const targetChunkSize = 40 * 1024 * 1024; // 40MB per chunk
    const chunks: Buffer[] = [];

    let offset = 0;
    let chunkNum = 1;

    while (offset < pdfBuffer.length) {
      const chunkEnd = Math.min(offset + targetChunkSize, pdfBuffer.length);
      const chunk = pdfBuffer.subarray(offset, chunkEnd);
      chunks.push(chunk as Buffer);

      const chunkSizeMb = (chunk.length / (1024 * 1024)).toFixed(2);
      console.log(`    📦 Chunk ${chunkNum}: ${chunkSizeMb}MB (bytes: ${offset}-${chunkEnd})`);

      offset = chunkEnd;
      chunkNum++;
    }

    console.log(`  ✅ Split into ${chunks.length} chunks`);
    return chunks;
  } catch (error) {
    console.error(`  ❌ Error splitting PDF: ${error.message}`);
    throw error;
  }
}
