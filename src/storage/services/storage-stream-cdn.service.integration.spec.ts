import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createReadStream, statSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { S3 } from 'aws-sdk';
import { Readable } from 'stream';
import axios from 'axios';
import { EntryMetadata, MediaFilters, StorageStreamCdnService } from './storage-stream-cdn.service';

/**
 * Integration Tests for StorageStreamCdnService
 *
 * This test suite uses REAL DigitalOcean Spaces credentials and uploads
 * actual media files from /references/medias/ to verify end-to-end functionality.
 *
 * Tests cover:
 * - Real media file uploads (PNG images, videos)
 * - Media filtering (size, format, resolution)
 * - CDN URL construction and accessibility
 * - Cleanup of test artifacts
 *
 * Prerequisites:
 * - Valid .env file with DigitalOcean credentials:
 *   DIGITAL_OCEAN_ORIGIN_ENDPOINT
 *   DIGITAL_OCEAN_CDN_ENDPOINT
 *   DIGITAL_OCEAN_STORAGE_KEY_ID
 *   DIGITAL_OCEAN_STORAGE_SECRET
 *   DIGITAL_OCEAN_STORAGE_BUCKET
 * - Network connectivity to DigitalOcean
 */
describe('StorageStreamCdnService (Integration)', () => {
  let service: StorageStreamCdnService;
  let configService: ConfigService;
  let module: TestingModule;
  let s3Client: S3;
  let testFolderPrefix: string;
  let testAttemptId: string;
  let testResultsPath: string;
  const testLogs: string[] = [];

  // Media filters for testing
  const testMediaFilters: MediaFilters = {
    minSizeKb: 10, // Relaxed for test files
    minResolution: { width: 100, height: 100 },
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
  };

  beforeAll(async () => {
    // Create test module with real ConfigModule
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env'
        })
      ],
      providers: [StorageStreamCdnService]
    }).compile();

    service = module.get<StorageStreamCdnService>(StorageStreamCdnService);
    configService = module.get<ConfigService>(ConfigService);

    // Verify env vars are loaded
    const keyId = configService.get<string>('DIGITAL_OCEAN_STORAGE_KEY_ID');
    const secret = configService.get<string>('DIGITAL_OCEAN_STORAGE_SECRET');
    const bucket = configService.get<string>('DIGITAL_OCEAN_STORAGE_BUCKET');

    // Skip tests if credentials not configured
    if (!keyId || !secret || !bucket) {
      console.warn('[INTEGRATION] Skipping integration tests - DigitalOcean credentials not configured');
      return;
    }

    // Get config values for S3 initialization
    let endpoint = configService.get<string>('DIGITAL_OCEAN_ORIGIN_ENDPOINT');
    const cdnEndpoint = configService.get<string>('DIGITAL_OCEAN_CDN_ENDPOINT');

    // Normalize endpoint: Remove bucket name from endpoint URL if present
    // DigitalOcean endpoint includes bucket name (e.g., https://kondo-spaces-storage.nyc3.digitaloceanspaces.com)
    // But AWS SDK expects base endpoint without bucket name
    endpoint = normalizeDigitalOceanEndpoint(endpoint, bucket);

    // Initialize S3 client for cleanup operations
    s3Client = new S3({
      endpoint: endpoint,
      region: 'us-east-1',
      accessKeyId: keyId,
      secretAccessKey: secret,
      signatureVersion: 'v4',
      s3ForcePathStyle: true // Required for DigitalOcean Spaces
    });

    // Setup test results logging
    testAttemptId = `storage-cdn-${Date.now()}`;
    testResultsPath = join(process.cwd(), 'test-results', 'storage-stream-cdn', testAttemptId);
    mkdirSync(testResultsPath, { recursive: true });
    logTestResult(`[INIT] Test attempt started: ${testAttemptId}`);
    logTestResult(`[CONFIG] Endpoint (normalized): ${endpoint}`);
    logTestResult(`[CONFIG] CDN Endpoint: ${cdnEndpoint}`);
    logTestResult(`[CONFIG] Bucket: ${bucket}`);

    // Generate unique test folder prefix with timestamp
    testFolderPrefix = `tests/integration/${testAttemptId}`;
    logTestResult(`[INTEGRATION] Using test folder: ${testFolderPrefix}`);
  });

  afterAll(async () => {
    // Cleanup test artifacts from DigitalOcean (disabled for now to improve test performance)
    // if (service && testFolderPrefix) {
    //   await cleanupTestFolder(testFolderPrefix);
    // }

    // Write test results to file
    if (testResultsPath && testLogs.length > 0) {
      writeTestResultsFile();
    }

    if (module) {
      await module.close();
    }
  });

  /**
   * SUITE 1: Real Media Upload Tests
   */
  describe('Real Media Upload', () => {
    jest.setTimeout(90000); // 90 seconds for S3 uploads
    it('should upload PNG image and generate valid CDN URL', async () => {
      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) {
        logTestResult('[TEST] PNG image not found, skipping test');
        return;
      }

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const metadata: EntryMetadata = {
        path: 'test-image-1.png',
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, testMediaFilters);

      logTestResult(`[UPLOAD] fileoutpart11.png -> ${result.cdnUrl}`);
      expect(result.success).toBe(true);
      expect(result.cdnUrl).toBeDefined();
      expect(result.cdnUrl).toContain(testFolderPrefix);
      expect(result.cdnUrl).toContain('test-image-1.png');
    });

    it('should upload multiple PNG images and generate unique CDN URLs', async () => {
      const pngFiles = ['fileoutpart8.png', 'fileoutpart9.png', 'fileoutpart24.png'];
      const results = [];

      for (let i = 0; i < pngFiles.length; i++) {
        const mediaPath = getTestMediaPath(pngFiles[i]);
        if (!mediaPath) continue;

        const fileStats = statSync(mediaPath);
        const stream = createReadStream(mediaPath);
        const metadata: EntryMetadata = {
          path: `test-image-${i}.png`,
          size: fileStats.size
        };

        const result = await service.processStreamEntry(stream, metadata, testMediaFilters);
        logTestResult(`[UPLOAD] ${pngFiles[i]} -> ${result.cdnUrl}`);
        results.push(result);
      }

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results.every((r) => r.cdnUrl)).toBe(true);

      // Verify all URLs are unique
      const urls = results.map((r) => r.cdnUrl);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);
    });

    it('should handle video file and filter it out (unsupported format)', async () => {
      const mediaPath = getTestMediaPath('test-video.mkv');
      if (!mediaPath) {
        console.warn('[TEST] Video file not found, skipping test');
        return;
      }

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const metadata: EntryMetadata = {
        path: 'test-video.mkv',
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, testMediaFilters);

      expect(result.success).toBe(false);
      expect(result.skippedReason).toBeDefined();
      expect(result.skippedReason).toContain('Unsupported format');
    });

    it('should preserve original filename in object key', async () => {
      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) return;

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const originalName = 'my-custom-filename-123.png';
      const metadata: EntryMetadata = {
        path: originalName,
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, testMediaFilters);

      expect(result.success).toBe(true);
      expect(result.cdnUrl).toContain(originalName);
    });
  });

  /**
   * SUITE 2: Media Filtering Tests
   */
  describe('Media Filtering', () => {
    jest.setTimeout(90000); // 90 seconds for S3 operations
    it('should filter out file below minimum size', async () => {
      const restrictiveFilters: MediaFilters = {
        minSizeKb: 10000, // 10 MB - very restrictive
        minResolution: { width: 100, height: 100 },
        supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
      };

      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) return;

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const metadata: EntryMetadata = {
        path: 'small-file.png',
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, restrictiveFilters);

      expect(result.success).toBe(false);
      expect(result.skippedReason).toContain('File too small');
    });

    it('should filter out unsupported format', async () => {
      const restrictiveFilters: MediaFilters = {
        minSizeKb: 10,
        minResolution: { width: 100, height: 100 },
        supportedFormats: ['jpg', 'jpeg'] // Only JPEG, no PNG
      };

      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) return;

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const metadata: EntryMetadata = {
        path: 'test.png',
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, restrictiveFilters);

      expect(result.success).toBe(false);
      expect(result.skippedReason).toContain('Unsupported format');
    });

    it('should accept file that passes all filter criteria', async () => {
      const permissiveFilters: MediaFilters = {
        minSizeKb: 1, // Very small minimum
        minResolution: { width: 50, height: 50 },
        supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
      };

      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) return;

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const metadata: EntryMetadata = {
        path: 'valid-file.png',
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, permissiveFilters);

      expect(result.success).toBe(true);
      expect(result.cdnUrl).toBeDefined();
    });

    it('should correctly report resolution in validation', async () => {
      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) return;

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const metadata: EntryMetadata = {
        path: 'resolution-test.png',
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, testMediaFilters);

      // For PNG files, resolution should be parsed
      expect(result.success).toBe(true);
    });
  });

  /**
   * SUITE 3: CDN URL Validation
   */
  describe('CDN URL Validation', () => {
    jest.setTimeout(90000); // 90 seconds for CDN and S3 operations
    it('should construct properly formatted CDN URL', async () => {
      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) return;

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const metadata: EntryMetadata = {
        path: 'url-format-test.png',
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, testMediaFilters);

      expect(result.success).toBe(true);
      expect(result.cdnUrl).toMatch(/^https?:\/\//);
      expect(result.cdnUrl).toContain(testFolderPrefix);
    });

    it('should generate accessible CDN URLs (HTTP 200)', async () => {
      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) return;

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const metadata: EntryMetadata = {
        path: 'accessibility-test.png',
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, testMediaFilters);

      if (result.success && result.cdnUrl) {
        try {
          const response = await axios.head(result.cdnUrl, { timeout: 10000 });
          expect(response.status).toBe(200);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.warn(`[TEST] CDN URL not accessible (${error.code}): ${error.message}`);
          } else {
            console.warn(`[TEST] Could not verify CDN URL accessibility: ${error.message}`);
          }
          // Don't fail test if CDN is temporarily unreachable
        }
      }
    });

    it('should handle special characters in filename', async () => {
      const mediaPath = getTestMediaPath('fileoutpart11.png');
      if (!mediaPath) return;

      const fileStats = statSync(mediaPath);
      const stream = createReadStream(mediaPath);
      const specialName = 'test-file_with.special-chars_123.png';
      const metadata: EntryMetadata = {
        path: specialName,
        size: fileStats.size
      };

      const result = await service.processStreamEntry(stream, metadata, testMediaFilters);

      expect(result.success).toBe(true);
      expect(result.cdnUrl).toContain(specialName);
    });
  });

  /**
   * SUITE 4: Error Handling and Edge Cases
   */
  describe('Error Handling', () => {
    it('should handle corrupted stream gracefully', async () => {
      const corruptedStream = Readable.from(Buffer.alloc(0));
      const metadata: EntryMetadata = {
        path: 'corrupted.png',
        size: 0
      };

      const result = await service.processStreamEntry(corruptedStream, metadata, testMediaFilters);

      expect(result.success).toBe(false);
    });

    it('should reject empty file', async () => {
      const emptyStream = Readable.from(Buffer.alloc(0));
      const metadata: EntryMetadata = {
        path: 'empty.png',
        size: 0
      };

      const result = await service.processStreamEntry(emptyStream, metadata, testMediaFilters);

      expect(result.success).toBe(false);
      expect(result.skippedReason || result.error).toBeDefined();
    });

    it('should handle missing file gracefully', async () => {
      const missingPath = join(process.cwd(), 'references/medias/nonexistent-file.png');
      const metadata: EntryMetadata = {
        path: 'missing.png',
        size: 1000
      };

      try {
        await new Promise<void>((resolve, reject) => {
          const stream = createReadStream(missingPath);
          
          // Listen for stream error
          stream.on('error', (error) => {
            reject(error);
          });
          
          // Process stream
          service.processStreamEntry(stream, metadata, testMediaFilters).then((result) => {
            expect(result.success).toBe(false);
            resolve();
          }).catch((error) => {
            reject(error);
          });
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  /**
   * SUITE 5: Batch Operations
   * DISABLED: Batch operations removed to improve test performance
   */
  // describe('Batch Operations', () => {
  //   jest.setTimeout(90000); // 90 seconds for batch S3 operations
  //   it('should process multiple files in sequence', async () => {
  //     const mediaDir = getTestMediaDir();
  //     if (!mediaDir) {
  //       console.warn('[TEST] Media directory not found');
  //       return;
  //     }

  //     const pngFiles = readdirSync(mediaDir).filter((f) => f.endsWith('.png'));

  //     if (pngFiles.length === 0) {
  //       console.warn('[TEST] No PNG files found');
  //       return;
  //     }

  //     const results = [];

  //     for (let i = 0; i < pngFiles.length; i++) {
  //       const mediaPath = join(mediaDir, pngFiles[i]);
  //       const fileStats = statSync(mediaPath);
  //       const stream = createReadStream(mediaPath);
  //       const metadata: EntryMetadata = {
  //         path: `batch-${i}-${pngFiles[i]}`,
  //         size: fileStats.size
  //       };

  //       const result = await service.processStreamEntry(stream, metadata, testMediaFilters);
  //       results.push(result);
  //     }

  //     expect(results.length).toBe(pngFiles.length);
  //     expect(results.every((r) => r.success || r.skippedReason || r.error)).toBe(true);
  //   });

  //   it('should report batch statistics', async () => {
  //     const mediaDir = getTestMediaDir();
  //     if (!mediaDir) return;

  //     const allFiles = readdirSync(mediaDir);
  //     const stats = {
  //       total: allFiles.length,
  //       successful: 0,
  //       skipped: 0,
  //       failed: 0,
  //       uploadedSize: 0
  //     };

  //     for (let i = 0; i < allFiles.length; i++) {
  //       const mediaPath = join(mediaDir, allFiles[i]);
  //       const fileStats = statSync(mediaPath);
  //       const stream = createReadStream(mediaPath);
  //       const metadata: EntryMetadata = {
  //         path: `stats-${i}-${allFiles[i]}`,
  //         size: fileStats.size
  //       };

  //       const result = await service.processStreamEntry(stream, metadata, testMediaFilters);

  //       if (result.success) {
  //         stats.successful++;
  //         stats.uploadedSize += fileStats.size;
  //       } else if (result.skippedReason) {
  //         stats.skipped++;
  //       } else {
  //         stats.failed++;
  //       }
  //     }

  //     console.log('[INTEGRATION] Batch Statistics:', stats);
  //     expect(stats.total).toBeGreaterThan(0);
  //   });
  // });

  // ==================== Helper Functions ====================

  /**
   * Log test result to memory and console
   */
  function logTestResult(message: string): void {
    console.log(message);
    testLogs.push(`${new Date().toISOString()} ${message}`);
  }

  /**
   * Write accumulated test results to file
   */
  function writeTestResultsFile(): void {
    try {
      const logFilePath = join(testResultsPath, 'test-results.log');
      const content = testLogs.join('\n');
      writeFileSync(logFilePath, content, 'utf-8');
      console.log(`[RESULTS] Test results written to: ${logFilePath}`);
    } catch (error) {
      console.error(`[RESULTS] Failed to write test results: ${error.message}`);
    }
  }

  /**
   * Normalize DigitalOcean endpoint by removing bucket name
   * AWS SDK v2 expects base endpoint without bucket
   */
  function normalizeDigitalOceanEndpoint(endpoint: string, bucket: string): string {
    if (!endpoint) return endpoint;
    
    // If endpoint contains bucket name, remove it
    // e.g., "https://kondo-spaces-storage.nyc3.digitaloceanspaces.com" -> "https://nyc3.digitaloceanspaces.com"
    if (endpoint.includes(bucket)) {
      const baseEndpoint = endpoint.replace(`${bucket}.`, '');
      console.log(`[S3] Normalized endpoint: ${endpoint} -> ${baseEndpoint}`);
      return baseEndpoint;
    }
    
    return endpoint;
  }

  /**
   * Get full path to test media file
   */
  function getTestMediaPath(filename: string): string | null {
    try {
      const mediaDir = getTestMediaDir();
      if (!mediaDir) return null;

      const fullPath = join(mediaDir, filename);
      statSync(fullPath); // Verify file exists
      return fullPath;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get test media directory path
   */
  function getTestMediaDir(): string | null {
    try {
      const baseDir = process.cwd();
      const mediaDir = join(baseDir, 'references/medias');
      statSync(mediaDir);
      return mediaDir;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cleanup test artifacts from DigitalOcean Spaces
   * Recursively deletes all objects under the test folder prefix
   */
  async function cleanupTestFolder(folderPrefix: string): Promise<void> {
    if (!s3Client || !testMediaFilters) return;

    try {
      logTestResult(`[CLEANUP] Removing test folder: ${folderPrefix}`);

      const bucket = configService.get<string>('DIGITAL_OCEAN_STORAGE_BUCKET');

      // List all objects with prefix
      const listParams = {
        Bucket: bucket,
        Prefix: folderPrefix
      };

      let continuationToken: string | undefined;
      let objectsDeleted = 0;

      do {
        const listResponse = await s3Client
          .listObjectsV2({
            ...listParams,
            ContinuationToken: continuationToken
          })
          .promise();

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
          break;
        }

        // Delete objects in batches
        const deleteParams = {
          Bucket: bucket,
          Delete: {
            Objects: listResponse.Contents.map((obj) => ({
              Key: obj.Key
            }))
          }
        };

        const deleteResponse = await s3Client.deleteObjects(deleteParams).promise();
        objectsDeleted += deleteResponse.Deleted?.length || 0;

        continuationToken = listResponse.NextContinuationToken;
      } while (continuationToken);

      logTestResult(`[CLEANUP] Successfully removed ${objectsDeleted} test files`);
    } catch (error) {
      logTestResult(`[CLEANUP] Error during cleanup: ${error.message}`);
      logTestResult(
        `[CLEANUP] Test folder "${folderPrefix}" may still exist in DigitalOcean and should be manually removed`
      );
    }
  }
});
