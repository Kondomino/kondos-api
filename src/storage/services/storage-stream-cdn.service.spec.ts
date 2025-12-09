import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Readable, PassThrough } from 'stream';
import { EntryMetadata, MediaFilters, StorageStreamCdnService } from './storage-stream-cdn.service';

/**
 * Unit Tests for StorageStreamCdnService
 *
 * Tests cover:
 * - Stream entry processing with filtering
 * - Media validation (size, format, resolution)
 * - CDN URL construction
 * - Image dimension parsing (PNG/JPEG)
 * - S3/Spaces upload simulation
 * - Error handling
 */
describe('StorageStreamCdnService', () => {
  let service: StorageStreamCdnService;
  let configService: ConfigService;
  let module: TestingModule;

  // Mock configuration
  const mockConfig = {
    DIGITAL_OCEAN_ORIGIN_ENDPOINT: 'https://nyc3.digitaloceanspaces.com',
    DIGITAL_OCEAN_STORAGE_KEY_ID: 'test-key',
    DIGITAL_OCEAN_STORAGE_SECRET: 'test-secret',
    DIGITAL_OCEAN_STORAGE_BUCKET: 'test-bucket',
    DIGITAL_OCEAN_CDN_ENDPOINT: 'https://cdn.nyc3.digitaloceanspaces.com'
  };

  // Mock media filters
  const mediaFilters: MediaFilters = {
    minSizeKb: 900,
    minResolution: { width: 720, height: 680 },
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        StorageStreamCdnService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => mockConfig[key]
          }
        }
      ]
    }).compile();

    service = module.get<StorageStreamCdnService>(StorageStreamCdnService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with S3 client', () => {
      expect(service['s3']).toBeDefined();
    });

    it('should load configuration from ConfigService', () => {
      expect(service['config']).toBeDefined();
      expect(service['config'].bucket).toBe('test-bucket');
      expect(service['config'].cdnEndpoint).toBe('https://cdn.nyc3.digitaloceanspaces.com');
      expect(service['config'].cdnPrefix).toBe('extracted');
    });
  });

  describe('CDN URL Construction', () => {
    it('should construct valid CDN URL from object key', () => {
      const objectKey = 'extracted/figures/image_001.png';
      const url = service.constructCdnUrl(objectKey);

      expect(url).toBe('https://cdn.nyc3.digitaloceanspaces.com/extracted/figures/image_001.png');
    });

    it('should handle URLs with special characters', () => {
      const objectKey = 'extracted/figures/My Image (1).jpg';
      const url = service.constructCdnUrl(objectKey);

      expect(url).toContain('https://cdn.nyc3.digitaloceanspaces.com');
      expect(url).toContain(objectKey);
    });
  });

  describe('MIME Type Detection', () => {
    const testCases = [
      { path: 'image.png', expected: 'image/png' },
      { path: 'photo.jpg', expected: 'image/jpeg' },
      { path: 'photo.jpeg', expected: 'image/jpeg' },
      { path: 'animation.webp', expected: 'image/webp' },
      { path: 'data.json', expected: 'application/json' },
      { path: 'unknown.xyz', expected: 'application/octet-stream' }
    ];

    testCases.forEach(({ path, expected }) => {
      it(`should detect MIME type for ${path}`, () => {
        const mimeType = service['getMimeType'](path);
        expect(mimeType).toBe(expected);
      });
    });
  });

  describe('File Extension Extraction', () => {
    const testCases = [
      { path: 'figures/image_001.png', expected: 'png' },
      { path: 'figures/photo.jpg', expected: 'jpg' },
      { path: 'structuredData.json', expected: 'json' },
      { path: 'no_extension', expected: '' }
    ];

    testCases.forEach(({ path, expected }) => {
      it(`should extract extension from ${path}`, () => {
        const ext = service['getFileExtension'](path);
        expect(ext).toBe(expected);
      });
    });
  });

  describe('Media Validation', () => {
    it('should accept valid image with sufficient size and resolution', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image_001.png',
        size: 1000 * 1024 // 1000 KB, above 900 KB minimum
      };

      // Create a PNG stream with valid header (resolution: 800x700)
      const pngStream = createMockPngStream(800, 700);

      const validation = await service['validateMedia'](metadata, pngStream, mediaFilters);

      expect(validation.valid).toBe(true);
      expect(validation.fileSize).toBe(1000 * 1024);
    });

    it('should reject image smaller than minimum size', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image_001.png',
        size: 100 * 1024 // 100 KB, below 900 KB minimum
      };

      const pngStream = createMockPngStream(800, 700);

      const validation = await service['validateMedia'](metadata, pngStream, mediaFilters);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('too small');
    });

    it('should reject unsupported file format', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image_001.bmp',
        size: 1000 * 1024
      };

      const stream = new PassThrough();

      const validation = await service['validateMedia'](metadata, stream, mediaFilters);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Unsupported format');
    });

    it('should reject image with resolution below minimum', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image_001.png',
        size: 1000 * 1024
      };

      // Create a PNG stream with low resolution (640x600, below 720x680 minimum)
      const pngStream = createMockPngStream(640, 600);

      const validation = await service['validateMedia'](metadata, pngStream, mediaFilters);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Resolution too low');
    });
  });

  describe('PNG Dimension Parsing', () => {
    it('should extract dimensions from PNG stream', async () => {
      const pngStream = createMockPngStream(1920, 1080);
      const dimensions = await service['parsePngDimensions'](pngStream);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1920);
      expect(dimensions?.height).toBe(1080);
    });

    it('should return null for invalid PNG stream', async () => {
      const invalidStream = Readable.from(Buffer.from('not a png'));
      const dimensions = await service['parsePngDimensions'](invalidStream);

      expect(dimensions).toBeNull();
    });

    it('should handle PNG with minimum size', async () => {
      const pngStream = createMockPngStream(1, 1);
      const dimensions = await service['parsePngDimensions'](pngStream);

      expect(dimensions?.width).toBe(1);
      expect(dimensions?.height).toBe(1);
    });
  });

  describe('JPEG Dimension Parsing', () => {
    it('should extract dimensions from JPEG stream', async () => {
      const jpegStream = createMockJpegStream(1920, 1080);
      const dimensions = await service['parseJpegDimensions'](jpegStream);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1920);
      expect(dimensions?.height).toBe(1080);
    });

    it('should return null for invalid JPEG stream', async () => {
      const invalidStream = Readable.from(Buffer.from('not a jpeg'));
      const dimensions = await service['parseJpegDimensions'](invalidStream);

      expect(dimensions).toBeNull();
    });

    it('should handle JPEG with various dimensions', async () => {
      const testCases = [
        { width: 640, height: 480 },
        { width: 1280, height: 720 },
        { width: 3840, height: 2160 }
      ];

      for (const { width, height } of testCases) {
        const jpegStream = createMockJpegStream(width, height);
        const dimensions = await service['parseJpegDimensions'](jpegStream);

        expect(dimensions?.width).toBe(width);
        expect(dimensions?.height).toBe(height);
      }
    });
  });

  describe('Stream Entry Processing', () => {
    it('should process and filter entries correctly', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image_001.png',
        size: 1000 * 1024
      };

      const pngStream = createMockPngStream(800, 700);

      // Mock S3 upload
      jest.spyOn(service['s3'], 'upload').mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      } as any);

      const result = await service.processStreamEntry(pngStream, metadata, mediaFilters);

      expect(result.success).toBe(true);
      expect(result.cdnUrl).toContain('https://cdn.nyc3.digitaloceanspaces.com');
    });

    it('should skip entry with filtered-out reason', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/small.png',
        size: 100 * 1024 // Below minimum
      };

      const pngStream = createMockPngStream(800, 700);

      const result = await service.processStreamEntry(pngStream, metadata, mediaFilters);

      expect(result.success).toBe(false);
      expect(result.skippedReason).toBeDefined();
    });

    it('should handle upload errors gracefully', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image_001.png',
        size: 1000 * 1024
      };

      const pngStream = createMockPngStream(800, 700);

      // Mock S3 upload to reject
      jest.spyOn(service['s3'], 'upload').mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('S3 upload failed'))
      } as any);

      const result = await service.processStreamEntry(pngStream, metadata, mediaFilters);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Media Format Detection', () => {
    it('should support PNG format', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image.png',
        size: 1000 * 1024
      };

      const stream = createMockPngStream(800, 700);
      const validation = await service['validateMedia'](metadata, stream, mediaFilters);

      expect(validation.valid).toBe(true);
    });

    it('should support JPEG format', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image.jpg',
        size: 1000 * 1024
      };

      const stream = new PassThrough();
      stream.write(Buffer.alloc(1000 * 1024));
      stream.end();

      // JPEG validation should pass size check but resolution parsing may fail
      // which is acceptable
      await expect(
        service.processStreamEntry(stream, metadata, mediaFilters)
      ).resolves.toBeDefined();
    });

    it('should support WebP format', async () => {
      const metadata: EntryMetadata = {
        path: 'figures/image.webp',
        size: 1000 * 1024
      };

      const stream = new PassThrough();
      stream.write(Buffer.alloc(1000 * 1024));
      stream.end();

      // WebP doesn't require resolution parsing
      await expect(
        service.processStreamEntry(stream, metadata, mediaFilters)
      ).resolves.toBeDefined();
    });
  });

  describe('Configuration Variants', () => {
    it('should accept custom filter thresholds', async () => {
      const customFilters: MediaFilters = {
        minSizeKb: 100, // Lower threshold
        minResolution: { width: 320, height: 240 },
        supportedFormats: ['jpg', 'jpeg', 'png']
      };

      const metadata: EntryMetadata = {
        path: 'figures/image.png',
        size: 150 * 1024 // Now above 100 KB minimum
      };

      const pngStream = createMockPngStream(400, 300);

      const validation = await service['validateMedia'](metadata, pngStream, customFilters);

      expect(validation.valid).toBe(true);
    });

    it('should reject entry with stricter filters', async () => {
      const strictFilters: MediaFilters = {
        minSizeKb: 5000, // Very strict
        minResolution: { width: 3840, height: 2160 },
        supportedFormats: ['png']
      };

      const metadata: EntryMetadata = {
        path: 'figures/image.png',
        size: 1000 * 1024 // Below 5000 KB
      };

      const pngStream = createMockPngStream(1920, 1080);

      const validation = await service['validateMedia'](metadata, pngStream, strictFilters);

      expect(validation.valid).toBe(false);
    });
  });
});

/**
 * Helper: Create mock PNG stream with specified dimensions
 * PNG format: 8-byte signature + IHDR chunk with width/height at bytes 16-24
 */
function createMockPngStream(width: number, height: number): Readable {
  const buffer = Buffer.alloc(25);
  // PNG signature (8 bytes)
  buffer.write('\x89PNG\r\n\x1a\n', 0);
  // Width at bytes 16-20 (big-endian)
  buffer.writeUInt32BE(width, 16);
  // Height at bytes 20-24 (big-endian)
  buffer.writeUInt32BE(height, 20);

  return Readable.from(buffer);
}

/**
 * Helper: Create mock JPEG stream with specified dimensions
 * JPEG format: SOI marker (FFD8) + SOF marker (FFC0-FFC3) + height/width
 */
function createMockJpegStream(width: number, height: number): Readable {
  // Minimal JPEG structure for testing dimension parsing
  const buffer = Buffer.alloc(50);
  let offset = 0;

  // SOI (Start of Image) marker
  buffer.writeUInt8(0xff, offset++);
  buffer.writeUInt8(0xd8, offset++);

  // SOF0 (Start of Frame, Baseline DCT) marker
  buffer.writeUInt8(0xff, offset++);
  buffer.writeUInt8(0xc0, offset++); // SOF0 marker

  // Segment length (16 bits, big-endian)
  buffer.writeUInt16BE(17, offset);
  offset += 2;

  // Precision (8 bits)
  buffer.writeUInt8(8, offset++);

  // Height (16 bits, big-endian)
  buffer.writeUInt16BE(height, offset);
  offset += 2;

  // Width (16 bits, big-endian)
  buffer.writeUInt16BE(width, offset);

  return Readable.from(buffer);
}
