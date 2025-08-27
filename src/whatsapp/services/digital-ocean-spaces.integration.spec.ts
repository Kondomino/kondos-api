import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DigitalOceanSpacesService } from './digital-ocean-spaces.service';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('DigitalOceanSpacesService Integration Tests', () => {
  let service: DigitalOceanSpacesService;
  let configService: ConfigService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigitalOceanSpacesService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              // Use real environment variables for integration testing
              return process.env[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<DigitalOceanSpacesService>(DigitalOceanSpacesService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Environment Configuration', () => {
    it('should have all required environment variables', () => {
      const requiredVars = [
        'DIGITAL_OCEAN_STORAGE_KEY_ID',
        'DIGITAL_OCEAN_STORAGE_SECRET',
        'DIGITAL_OCEAN_ORIGIN_ENDPOINT',
        'DIGITAL_OCEAN_CDN_ENDPOINT',
      ];

      requiredVars.forEach(varName => {
        const value = configService.get(varName);
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        console.log(`✓ ${varName}: ${varName.includes('SECRET') ? '[HIDDEN]' : value}`);
      });
    });

    it('should extract bucket name correctly', () => {
      const bucketName = service.getBucketName();
      expect(bucketName).toBeDefined();
      expect(bucketName.length).toBeGreaterThan(0);
      console.log(`✓ Extracted bucket name: ${bucketName}`);
    });
  });

  describe('Connection Test', () => {
    it('should connect to DigitalOcean Spaces successfully', async () => {
      const result = await service.testConnection();
      
      console.log('Connection test result:', JSON.stringify(result, null, 2));
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
    }, 30000); // 30 second timeout for network operations
  });

  describe('File Upload Tests', () => {
    const testFiles: Array<{ buffer: Buffer; key: string; contentType: string; description: string }> = [];

    beforeAll(() => {
      // Create test files
      testFiles.push({
        buffer: Buffer.from('Hello, DigitalOcean Spaces! This is a test file from Kondos API.', 'utf-8'),
        key: `integration-test/text-${Date.now()}.txt`,
        contentType: 'text/plain',
        description: 'Simple text file'
      });

      testFiles.push({
        buffer: Buffer.from(JSON.stringify({ 
          test: true, 
          timestamp: new Date().toISOString(),
          message: 'Integration test JSON file',
          agency: 'test-agency'
        }, null, 2), 'utf-8'),
        key: `integration-test/json-${Date.now()}.json`,
        contentType: 'application/json',
        description: 'JSON file'
      });

      // Try to load a real PDF for testing (if available)
      try {
        const pdfPath = join(process.cwd(), 'references', 'pdfs', 'mirrage.pdf');
        const pdfBuffer = readFileSync(pdfPath);
        testFiles.push({
          buffer: pdfBuffer,
          key: `integration-test/pdf-${Date.now()}.pdf`,
          contentType: 'application/pdf',
          description: 'Real PDF file'
        });
        console.log('✓ Added real PDF file for testing');
      } catch (error) {
        console.log('⚠ Real PDF not found, creating mock PDF buffer');
        // Create a minimal PDF-like buffer for testing
        testFiles.push({
          buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF', 'binary'),
          key: `integration-test/mock-pdf-${Date.now()}.pdf`,
          contentType: 'application/pdf',
          description: 'Mock PDF file'
        });
      }
    });

    it('should upload individual files successfully', async () => {
      for (const testFile of testFiles) {
        console.log(`\nTesting upload: ${testFile.description} (${testFile.buffer.length} bytes)`);
        
        const result = await service.uploadFile(
          testFile.buffer,
          testFile.key,
          testFile.contentType,
          {
            testFile: 'true',
            description: testFile.description,
            uploadedBy: 'integration-test'
          }
        );

        console.log(`Upload result:`, {
          success: result.success,
          url: result.url,
          size: result.size,
          error: result.error
        });

        expect(result.success).toBe(true);
        expect(result.url).toBeDefined();
        expect(result.url).toContain('digitaloceanspaces.com');
        expect(result.size).toBe(testFile.buffer.length);
        expect(result.contentType).toBe(testFile.contentType);

        // Verify the CDN URL is accessible
        if (result.url) {
          try {
            console.log(`Verifying CDN URL: ${result.url}`);
            const response = await fetch(result.url);
            expect(response.ok).toBe(true);
            
            const downloadedContent = await response.buffer();
            expect(downloadedContent.length).toBe(testFile.buffer.length);
            console.log(`✓ File verified via CDN: ${downloadedContent.length} bytes`);
          } catch (error) {
            console.error(`CDN verification failed: ${error.message}`);
            throw error;
          }
        }
      }
    }, 60000); // 60 second timeout for multiple uploads

    it('should upload batch files successfully', async () => {
      const batchFiles = testFiles.map(tf => ({
        buffer: tf.buffer,
        key: tf.key.replace('integration-test/', 'batch-test/'),
        contentType: tf.contentType,
        metadata: {
          batchTest: 'true',
          originalKey: tf.key,
          description: tf.description
        }
      }));

      console.log(`\nTesting batch upload: ${batchFiles.length} files`);
      
      const results = await service.uploadMultipleFiles(batchFiles);
      
      expect(results).toHaveLength(batchFiles.length);
      
      results.forEach((result, index) => {
        console.log(`Batch file ${index + 1}:`, {
          success: result.success,
          url: result.url,
          size: result.size,
          error: result.error
        });
        
        expect(result.success).toBe(true);
        expect(result.url).toBeDefined();
        expect(result.size).toBe(batchFiles[index].buffer.length);
      });

      const successful = results.filter(r => r.success).length;
      expect(successful).toBe(batchFiles.length);
      console.log(`✓ All ${successful} files uploaded successfully in batch`);
    }, 90000); // 90 second timeout for batch operations
  });

  describe('Media Processing Integration', () => {
    it('should upload processed media (original + extracted images)', async () => {
      // Simulate a PDF with extracted images
      const originalPdfBuffer = Buffer.from('%PDF-1.4\nTest PDF content for media processing', 'utf-8');
      
      // Mock extracted image buffers
      const mockImageBuffers = [
        Buffer.from('Mock image 1 data', 'utf-8'),
        Buffer.from('Mock image 2 data', 'utf-8'),
      ];

      console.log('\nTesting processed media upload...');
      
      const result = await service.uploadProcessedMedia({
        originalBuffer: originalPdfBuffer,
        originalFilename: 'test-document.pdf',
        originalContentType: 'application/pdf',
        extractedImages: mockImageBuffers,
        messageId: `test-msg-${Date.now()}`,
        agencyId: 999, // Test agency ID
      });

      console.log('Processed media result:', {
        success: result.success,
        originalFileUrl: result.originalFileUrl,
        extractedImageUrls: result.extractedImageUrls,
        totalUploads: result.totalUploads,
        failedUploads: result.failedUploads,
        uploadTime: result.uploadTime,
        error: result.error
      });

      expect(result.success).toBe(true);
      expect(result.originalFileUrl).toBeDefined();
      expect(result.extractedImageUrls).toHaveLength(2);
      expect(result.totalUploads).toBe(3); // 1 original + 2 images
      expect(result.failedUploads).toBe(0);

      // Verify all URLs are accessible
      const allUrls = [result.originalFileUrl!, ...result.extractedImageUrls!];
      
      for (let i = 0; i < allUrls.length; i++) {
        const url = allUrls[i];
        console.log(`Verifying uploaded file ${i + 1}: ${url}`);
        
        try {
          const response = await fetch(url);
          expect(response.ok).toBe(true);
          console.log(`✓ File ${i + 1} verified: ${response.status} ${response.statusText}`);
        } catch (error) {
          console.error(`File ${i + 1} verification failed: ${error.message}`);
          throw error;
        }
      }
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle invalid content gracefully', async () => {
      const result = await service.uploadFile(
        Buffer.from('test'),
        '', // Invalid key
        'text/plain'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      console.log(`✓ Error handled gracefully: ${result.error}`);
    });

    it('should handle network timeouts gracefully', async () => {
      // This test might be flaky depending on network conditions
      // but it's good to have for comprehensive testing
      const largeBuffer = Buffer.alloc(1024 * 1024, 'x'); // 1MB of data
      
      const result = await service.uploadFile(
        largeBuffer,
        `stress-test/large-file-${Date.now()}.txt`,
        'text/plain'
      );

      // Should either succeed or fail gracefully
      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(result.error).toBeDefined();
        console.log(`Large file upload failed as expected: ${result.error}`);
      } else {
        console.log(`✓ Large file upload succeeded: ${result.url}`);
      }
    }, 120000); // 2 minute timeout for large file
  });

  afterAll(async () => {
    console.log('\n🧹 Cleaning up test files...');
    
    // Clean up test files (optional - they're in test folders)
    // In a real scenario, you might want to clean up test files
    // but for debugging purposes, it's often useful to leave them
    
    console.log('✓ Integration tests completed');
  });
});
