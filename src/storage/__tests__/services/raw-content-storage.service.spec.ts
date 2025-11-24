import { Test, TestingModule } from '@nestjs/testing';
import { RawContentStorageService, StoreRawPdfContentParams } from '../../services/raw-content-storage.service';
import { StoragePathGeneratorService } from '../../services/storage-path-generator.service';
import { DigitalOceanSpacesService } from '../../../whatsapp/services/digital-ocean-spaces.service';

describe('RawContentStorageService', () => {
  let service: RawContentStorageService;
  let digitalOceanSpacesService: jest.Mocked<DigitalOceanSpacesService>;
  let pathGenerator: jest.Mocked<StoragePathGeneratorService>;

  beforeEach(async () => {
    const digitalOceanSpacesMock = {
      uploadMultipleFiles: jest.fn(),
    };

    const pathGeneratorMock = {
      generatePdfPaths: jest.fn(),
      generateImagePaths: jest.fn(),
      generateVideoPaths: jest.fn(),
      generateExtractedImagePath: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RawContentStorageService,
        { provide: DigitalOceanSpacesService, useValue: digitalOceanSpacesMock },
        { provide: StoragePathGeneratorService, useValue: pathGeneratorMock },
      ],
    }).compile();

    service = module.get<RawContentStorageService>(RawContentStorageService);
    digitalOceanSpacesService = module.get(DigitalOceanSpacesService);
    pathGenerator = module.get(StoragePathGeneratorService);
  });

  describe('storeRawPdfContent', () => {
    const mockParams: StoreRawPdfContentParams = {
      agencyId: 123,
      messageId: 'msg456',
      originalPdf: Buffer.from('mock pdf content'),
      originalFilename: 'document.pdf',
      extractedContent: {
        text: 'Extracted text content',
        tables: [{ id: 1, data: 'table data' }],
        images: [Buffer.from('image1'), Buffer.from('image2')],
      },
    };

    beforeEach(() => {
      pathGenerator.generatePdfPaths.mockReturnValue({
        rawContentBase: 'raw-content/agency-123/pdfs/msg456',
        originalFile: 'raw-content/agency-123/pdfs/msg456/original.pdf',
        extractedBase: 'raw-content/agency-123/pdfs/msg456/extracted',
        extractedText: 'raw-content/agency-123/pdfs/msg456/extracted/text.json',
        extractedTables: 'raw-content/agency-123/pdfs/msg456/extracted/tables.json',
        extractedImagesBase: 'raw-content/agency-123/pdfs/msg456/extracted/images',
      });

      pathGenerator.generateExtractedImagePath.mockImplementation((agencyId, messageId, index) => 
        `raw-content/agency-${agencyId}/pdfs/${messageId}/extracted/images/image_${index}.jpg`
      );
    });

    it('should store PDF with all extracted content successfully', async () => {
      digitalOceanSpacesService.uploadMultipleFiles.mockResolvedValue([
        {
          success: true,
          key: 'raw-content/agency-123/pdfs/msg456/original.pdf',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/original.pdf',
          size: 1000,
        },
        {
          success: true,
          key: 'raw-content/agency-123/pdfs/msg456/extracted/text.json',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/extracted/text.json',
          size: 500,
        },
        {
          success: true,
          key: 'raw-content/agency-123/pdfs/msg456/extracted/tables.json',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/extracted/tables.json',
          size: 300,
        },
        {
          success: true,
          key: 'raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
          size: 200,
        },
        {
          success: true,
          key: 'raw-content/agency-123/pdfs/msg456/extracted/images/image_1.jpg',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/extracted/images/image_1.jpg',
          size: 250,
        },
      ]);

      const result = await service.storeRawPdfContent(mockParams);

      expect(result.success).toBe(true);
      expect(result.agencyId).toBe(123);
      expect(result.messageId).toBe('msg456');
      expect(result.contentType).toBe('pdf');
      
      expect(result.originalFile).toEqual({
        path: 'raw-content/agency-123/pdfs/msg456/original.pdf',
        url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/original.pdf',
        size: 1000,
        contentType: 'application/pdf',
      });

      expect(result.extractedContent?.textFile).toEqual({
        path: 'raw-content/agency-123/pdfs/msg456/extracted/text.json',
        url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/extracted/text.json',
        size: 500,
        contentType: 'application/json',
      });

      expect(result.extractedContent?.tablesFile).toEqual({
        path: 'raw-content/agency-123/pdfs/msg456/extracted/tables.json',
        url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/extracted/tables.json',
        size: 300,
        contentType: 'application/json',
      });

      expect(result.extractedContent?.images).toHaveLength(2);
      expect(result.extractedContent?.images?.[0]).toEqual({
        path: 'raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
        url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
        size: 200,
        contentType: 'image/jpeg',
      });

      expect(digitalOceanSpacesService.uploadMultipleFiles).toHaveBeenCalledTimes(1);
      expect(digitalOceanSpacesService.uploadMultipleFiles).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'raw-content/agency-123/pdfs/msg456/original.pdf',
            contentType: 'application/pdf',
          }),
          expect.objectContaining({
            key: 'raw-content/agency-123/pdfs/msg456/extracted/text.json',
            contentType: 'application/json',
          }),
          expect.objectContaining({
            key: 'raw-content/agency-123/pdfs/msg456/extracted/tables.json',
            contentType: 'application/json',
          }),
          expect.objectContaining({
            key: 'raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
            contentType: 'image/jpeg',
          }),
          expect.objectContaining({
            key: 'raw-content/agency-123/pdfs/msg456/extracted/images/image_1.jpg',
            contentType: 'image/jpeg',
          }),
        ])
      );
    });

    it('should handle PDF with no extracted content', async () => {
      const paramsNoExtracted = {
        ...mockParams,
        extractedContent: {
          text: '',
          tables: [],
          images: [],
        },
      };

      digitalOceanSpacesService.uploadMultipleFiles.mockResolvedValue([
        {
          success: true,
          key: 'raw-content/agency-123/pdfs/msg456/original.pdf',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/original.pdf',
          size: 1000,
        },
      ]);

      const result = await service.storeRawPdfContent(paramsNoExtracted);

      expect(result.success).toBe(true);
      expect(result.extractedContent?.textFile).toBeUndefined();
      expect(result.extractedContent?.tablesFile).toBeUndefined();
      expect(result.extractedContent?.images).toBeUndefined();

      expect(digitalOceanSpacesService.uploadMultipleFiles).toHaveBeenCalledWith([
        expect.objectContaining({
          key: 'raw-content/agency-123/pdfs/msg456/original.pdf',
          contentType: 'application/pdf',
        }),
      ]);
    });

    it('should handle partial upload failures gracefully', async () => {
      digitalOceanSpacesService.uploadMultipleFiles.mockResolvedValue([
        {
          success: true,
          key: 'raw-content/agency-123/pdfs/msg456/original.pdf',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/original.pdf',
          size: 1000,
        },
        {
          success: false,
          key: 'raw-content/agency-123/pdfs/msg456/extracted/text.json',
          error: 'Upload failed',
        },
        {
          success: true,
          key: 'raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
          size: 200,
        },
      ]);

      const result = await service.storeRawPdfContent(mockParams);

      expect(result.success).toBe(true); // Original file uploaded successfully
      expect(result.originalFile.url).toBe('https://spaces.example.com/raw-content/agency-123/pdfs/msg456/original.pdf');
      expect(result.extractedContent?.textFile).toBeUndefined(); // Failed upload
      expect(result.extractedContent?.images).toHaveLength(1); // Partial success
    });

    it('should fail when original PDF upload fails', async () => {
      digitalOceanSpacesService.uploadMultipleFiles.mockResolvedValue([
        {
          success: false,
          key: 'raw-content/agency-123/pdfs/msg456/original.pdf',
          error: 'Original PDF upload failed',
        },
      ]);

      const result = await service.storeRawPdfContent(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to upload original PDF file');
    });

    it('should handle upload service errors', async () => {
      digitalOceanSpacesService.uploadMultipleFiles.mockRejectedValue(new Error('Service unavailable'));

      const result = await service.storeRawPdfContent(mockParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service unavailable');
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });
  });

  describe('storeRawMediaContent', () => {
    it('should store image content successfully', async () => {
      pathGenerator.generateImagePaths.mockReturnValue({
        rawContentBase: 'raw-content/agency-123/images/msg456',
        originalFile: 'raw-content/agency-123/images/msg456/original.jpg',
      });

      digitalOceanSpacesService.uploadMultipleFiles.mockResolvedValue([
        {
          success: true,
          key: 'raw-content/agency-123/images/msg456/original.jpg',
          url: 'https://spaces.example.com/raw-content/agency-123/images/msg456/original.jpg',
          size: 500,
        },
      ]);

      const result = await service.storeRawMediaContent({
        agencyId: 123,
        messageId: 'msg456',
        mediaBuffer: Buffer.from('image content'),
        mediaType: 'image',
        originalFilename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

      expect(result.success).toBe(true);
      expect(result.contentType).toBe('image');
      expect(result.originalFile).toEqual({
        path: 'raw-content/agency-123/images/msg456/original.jpg',
        url: 'https://spaces.example.com/raw-content/agency-123/images/msg456/original.jpg',
        size: 500,
        contentType: 'image/jpeg',
      });
    });

    it('should store video content successfully', async () => {
      pathGenerator.generateVideoPaths.mockReturnValue({
        rawContentBase: 'raw-content/agency-123/videos/msg456',
        originalFile: 'raw-content/agency-123/videos/msg456/original.mp4',
      });

      digitalOceanSpacesService.uploadMultipleFiles.mockResolvedValue([
        {
          success: true,
          key: 'raw-content/agency-123/videos/msg456/original.mp4',
          url: 'https://spaces.example.com/raw-content/agency-123/videos/msg456/original.mp4',
          size: 2000,
        },
      ]);

      const result = await service.storeRawMediaContent({
        agencyId: 123,
        messageId: 'msg456',
        mediaBuffer: Buffer.from('video content'),
        mediaType: 'video',
        originalFilename: 'video.mp4',
        contentType: 'video/mp4',
      });

      expect(result.success).toBe(true);
      expect(result.contentType).toBe('video');
    });

    it('should handle media upload failures', async () => {
      pathGenerator.generateImagePaths.mockReturnValue({
        rawContentBase: 'raw-content/agency-123/images/msg456',
        originalFile: 'raw-content/agency-123/images/msg456/original.jpg',
      });

      digitalOceanSpacesService.uploadMultipleFiles.mockResolvedValue([
        {
          success: false,
          key: 'raw-content/agency-123/images/msg456/original.jpg',
          error: 'Upload failed',
        },
      ]);

      const result = await service.storeRawMediaContent({
        agencyId: 123,
        messageId: 'msg456',
        mediaBuffer: Buffer.from('image content'),
        mediaType: 'image',
        originalFilename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });
  });

  describe('createRawContentEntry', () => {
    it('should create database entry from successful storage result', () => {
      const storageResult = {
        success: true,
        agencyId: 123,
        messageId: 'msg456',
        contentType: 'pdf' as const,
        originalFile: {
          path: 'raw-content/agency-123/pdfs/msg456/original.pdf',
          url: 'https://spaces.example.com/raw-content/agency-123/pdfs/msg456/original.pdf',
          size: 1000,
          contentType: 'application/pdf',
        },
        extractedContent: {
          textFile: {
            path: 'raw-content/agency-123/pdfs/msg456/extracted/text.json',
            url: 'https://spaces.example.com/text.json',
            size: 500,
            contentType: 'application/json',
          },
          images: [
            {
              path: 'raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
              url: 'https://spaces.example.com/image_0.jpg',
              size: 200,
              contentType: 'image/jpeg',
            },
          ],
        },
        metadata: {
          processingTime: 1500,
          timestamp: new Date(),
          originalFilename: 'document.pdf',
        },
      };

      const entry = service.createRawContentEntry(storageResult);

      expect(entry).toEqual({
        agency_id: 123,
        message_id: 'msg456',
        content_type: 'pdf',
        storage_path: 'raw-content/agency-123/pdfs/msg456/original.pdf',
        processing_status: 'processed',
        metadata: {
          originalFilename: 'document.pdf',
          fileSize: 1000,
          contentType: 'application/pdf',
          extractedFiles: [
            'raw-content/agency-123/pdfs/msg456/extracted/text.json',
            'raw-content/agency-123/pdfs/msg456/extracted/images/image_0.jpg',
          ],
          processingTime: 1500,
          error: undefined,
        },
      });
    });

    it('should create database entry from failed storage result', () => {
      const storageResult = {
        success: false,
        agencyId: 123,
        messageId: 'msg456',
        contentType: 'pdf' as const,
        originalFile: {
          path: '',
          url: '',
          size: 0,
          contentType: 'application/pdf',
        },
        metadata: {
          processingTime: 500,
          timestamp: new Date(),
          originalFilename: 'document.pdf',
        },
        error: 'Upload failed',
      };

      const entry = service.createRawContentEntry(storageResult);

      expect(entry.processing_status).toBe('failed');
      expect(entry.metadata.error).toBe('Upload failed');
      expect(entry.metadata.extractedFiles).toBeUndefined();
    });
  });
});
