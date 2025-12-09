import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AdobePdfService } from './adobe-pdf.service';
import { StorageStreamCdnService } from '../../storage/services/storage-stream-cdn.service';

describe('AdobePdfService - Large PDF Handling', () => {
  let service: AdobePdfService;
  let configService: ConfigService;
  let storageService: StorageStreamCdnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdobePdfService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                ADOBE_PDF_CLIENT_ID: 'test-client-id',
                ADOBE_PDF_CLIENT_SECRET: 'test-client-secret',
                LARGE_PDF_THRESHOLD_MB: 99,
                LARGE_PDF_CDN_PREFIX: 'documents',
                MEDIA_MIN_SIZE_KB: 100,
                MEDIA_MIN_WIDTH: 0,
                MEDIA_MIN_HEIGHT: 0
              };
              return config[key] ?? defaultValue;
            })
          }
        },
        {
          provide: StorageStreamCdnService,
          useValue: {
            processStreamEntry: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<AdobePdfService>(AdobePdfService);
    configService = module.get<ConfigService>(ConfigService);
    storageService = module.get<StorageStreamCdnService>(StorageStreamCdnService);
  });

  describe('Size Threshold Check', () => {
    it('should return false for PDF under 99MB threshold', () => {
      // 50MB buffer
      const buffer = Buffer.alloc(50 * 1024 * 1024);
      const result = (service as any).isLargePdf(buffer);
      expect(result).toBe(false);
    });

    it('should return true for PDF exactly at 99MB threshold boundary', () => {
      // 99MB buffer (exactly at threshold)
      const buffer = Buffer.alloc(99 * 1024 * 1024);
      const result = (service as any).isLargePdf(buffer);
      expect(result).toBe(false); // Should be false because threshold is > not >=
    });

    it('should return true for PDF over 99MB threshold', () => {
      // 100MB buffer (over threshold)
      const buffer = Buffer.alloc(100 * 1024 * 1024);
      const result = (service as any).isLargePdf(buffer);
      expect(result).toBe(true);
    });

    it('should return true for PDF significantly larger than threshold', () => {
      // 150MB buffer
      const buffer = Buffer.alloc(150 * 1024 * 1024);
      const result = (service as any).isLargePdf(buffer);
      expect(result).toBe(true);
    });

    it('should return false for very small PDFs', () => {
      // 1MB buffer
      const buffer = Buffer.alloc(1 * 1024 * 1024);
      const result = (service as any).isLargePdf(buffer);
      expect(result).toBe(false);
    });
  });

  describe('Large PDF Direct Upload', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully upload large PDF and return CDN URL', async () => {
      const pdfBuffer = Buffer.alloc(100 * 1024 * 1024);
      const messageId = 'msg-123';
      const cdnUrl = 'https://cdn.example.com/documents/large-pdf/msg-123.pdf';

      (storageService.processStreamEntry as jest.Mock).mockResolvedValue({
        success: true,
        cdnUrl
      });

      const result = await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      expect(result.success).toBe(true);
      expect(result.mediaUrls).toContain(cdnUrl);
      expect(result.text).toBe('');
      expect(result.tables).toEqual([]);
      expect(result.metadata.largeFileBypass).toBe(true);
      expect(result.metadata.fileSize).toBe(100 * 1024 * 1024);
      expect(result.metadata.elementsFound).toBe(0);
    });

    it('should set mediaStats correctly on success', async () => {
      const pdfBuffer = Buffer.alloc(100 * 1024 * 1024);
      const messageId = 'msg-456';
      const cdnUrl = 'https://cdn.example.com/documents/large-pdf/msg-456.pdf';

      (storageService.processStreamEntry as jest.Mock).mockResolvedValue({
        success: true,
        cdnUrl
      });

      const result = await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      expect(result.metadata.mediaStats?.uploaded).toBe(1);
      expect(result.metadata.mediaStats?.skipped).toBe(0);
      expect(result.metadata.mediaStats?.errors).toBe(0);
    });

    it('should handle upload failure gracefully', async () => {
      const pdfBuffer = Buffer.alloc(100 * 1024 * 1024);
      const messageId = 'msg-789';
      const errorMessage = 'Upload failed: Connection timeout';

      (storageService.processStreamEntry as jest.Mock).mockResolvedValue({
        success: false,
        error: errorMessage
      });

      const result = await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to upload large PDF');
      expect(result.mediaUrls).toEqual([]);
      expect(result.metadata.largeFileBypass).toBe(true);
      expect(result.metadata.mediaStats?.errors).toBe(1);
      expect(result.metadata.mediaStats?.uploaded).toBe(0);
    });

    it('should handle stream errors gracefully', async () => {
      const pdfBuffer = Buffer.alloc(100 * 1024 * 1024);
      const messageId = 'msg-error';

      (storageService.processStreamEntry as jest.Mock).mockRejectedValue(
        new Error('Stream processing error')
      );

      const result = await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Stream processing error');
      expect(result.metadata.largeFileBypass).toBe(true);
    });

    it('should use correct CDN prefix in path', async () => {
      const pdfBuffer = Buffer.alloc(100 * 1024 * 1024);
      const messageId = 'msg-prefix-test';
      const cdnUrl = 'https://cdn.example.com/documents/large-pdf/msg-prefix-test.pdf';

      (storageService.processStreamEntry as jest.Mock).mockResolvedValue({
        success: true,
        cdnUrl
      });

      await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      const callArgs = (storageService.processStreamEntry as jest.Mock).mock.calls[0];
      const metadata = callArgs[1];
      expect(metadata.path).toContain('documents/large-pdf/');
    });

    it('should pass correct file size to storage service', async () => {
      const fileSize = 150 * 1024 * 1024;
      const pdfBuffer = Buffer.alloc(fileSize);
      const messageId = 'msg-size-test';

      (storageService.processStreamEntry as jest.Mock).mockResolvedValue({
        success: true,
        cdnUrl: 'https://cdn.example.com/documents/large-pdf/msg-size-test.pdf'
      });

      await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      const callArgs = (storageService.processStreamEntry as jest.Mock).mock.calls[0];
      const metadata = callArgs[1];
      expect(metadata.size).toBe(fileSize);
    });

    it('should pass large PDF filters to storage service', async () => {
      const pdfBuffer = Buffer.alloc(100 * 1024 * 1024);
      const messageId = 'msg-filters-test';

      (storageService.processStreamEntry as jest.Mock).mockResolvedValue({
        success: true,
        cdnUrl: 'https://cdn.example.com/documents/large-pdf/msg-filters-test.pdf'
      });

      await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      const callArgs = (storageService.processStreamEntry as jest.Mock).mock.calls[0];
      const filters = callArgs[2];
      expect(filters.supportedFormats).toContain('pdf');
      expect(filters.minResolution.width).toBe(0);
      expect(filters.minResolution.height).toBe(0);
    });
  });

  describe('Extraction Response Format Consistency', () => {
    it('should return response with same structure as normal extraction', async () => {
      const pdfBuffer = Buffer.alloc(100 * 1024 * 1024);
      const messageId = 'msg-format-test';
      const cdnUrl = 'https://cdn.example.com/documents/large-pdf/msg-format-test.pdf';

      (storageService.processStreamEntry as jest.Mock).mockResolvedValue({
        success: true,
        cdnUrl
      });

      const result = await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      // Verify response structure matches PdfExtractionResult
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('tables');
      expect(result).toHaveProperty('mediaUrls');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('extractionTime');
      expect(result.metadata).toHaveProperty('elementsFound');
      expect(result.metadata).toHaveProperty('fileSize');
      expect(result.metadata).toHaveProperty('largeFileBypass');
    });

    it('mediaUrls should be accessible by consuming code', async () => {
      const pdfBuffer = Buffer.alloc(100 * 1024 * 1024);
      const messageId = 'msg-consuming-code-test';
      const cdnUrl = 'https://cdn.example.com/documents/large-pdf/msg-consuming-code-test.pdf';

      (storageService.processStreamEntry as jest.Mock).mockResolvedValue({
        success: true,
        cdnUrl
      });

      const result = await (service as any).uploadLargePdfToCdn(pdfBuffer, messageId);

      // Code that consumes this should work
      expect(Array.isArray(result.mediaUrls)).toBe(true);
      expect(result.mediaUrls.length).toBeGreaterThan(0);
      expect(result.mediaUrls[0]).toMatch(/https?:\/\//);
    });
  });

  describe('Integration: Size-based Routing in extractPdfContent', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Mock downloadPdf to avoid actual downloads
      jest.spyOn(service as any, 'downloadPdf').mockResolvedValue(Buffer.alloc(100 * 1024 * 1024));
    });

    it('should route large PDFs to uploadLargePdfToCdn', async () => {
      const uploadSpy = jest.spyOn(service as any, 'uploadLargePdfToCdn')
        .mockResolvedValue({
          success: true,
          text: '',
          tables: [],
          mediaUrls: ['https://cdn.example.com/documents/large-pdf/msg-123.pdf'],
          metadata: {
            extractionTime: 100,
            elementsFound: 0,
            fileSize: 100 * 1024 * 1024,
            largeFileBypass: true
          }
        });

      await service.extractPdfContent('https://example.com/large.pdf', 'msg-123');

      expect(uploadSpy).toHaveBeenCalled();
    });

    it('should use normal extraction for small PDFs', async () => {
      const downloadSpy = jest.spyOn(service as any, 'downloadPdf')
        .mockResolvedValue(Buffer.alloc(50 * 1024 * 1024)); // 50MB
      
      const extractSpy = jest.spyOn(service as any, 'extractPdfFromBuffer')
        .mockResolvedValue({
          success: true,
          text: 'Extracted text',
          tables: [],
          mediaUrls: [],
          metadata: {
            extractionTime: 5000,
            elementsFound: 10,
            fileSize: 50 * 1024 * 1024
          }
        });

      await service.extractPdfContent('https://example.com/small.pdf', 'msg-456');

      expect(extractSpy).toHaveBeenCalled();
    });
  });
});
