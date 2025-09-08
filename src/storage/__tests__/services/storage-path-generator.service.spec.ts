import { StoragePathGeneratorService } from '../../services/storage-path-generator.service';

describe('StoragePathGeneratorService', () => {
  let service: StoragePathGeneratorService;

  beforeEach(() => {
    service = new StoragePathGeneratorService();
  });

  describe('generatePdfPaths', () => {
    it('should generate correct PDF storage paths', () => {
      const paths = service.generatePdfPaths(123, 'msg456', 'document.pdf');

      expect(paths.rawContentBase).toBe('raw-content/agency-123/pdfs/msg456');
      expect(paths.originalFile).toBe('raw-content/agency-123/pdfs/msg456/original.pdf');
      expect(paths.extractedBase).toBe('raw-content/agency-123/pdfs/msg456/extracted');
      expect(paths.extractedText).toBe('raw-content/agency-123/pdfs/msg456/extracted/text.json');
      expect(paths.extractedTables).toBe('raw-content/agency-123/pdfs/msg456/extracted/tables.json');
      expect(paths.extractedImagesBase).toBe('raw-content/agency-123/pdfs/msg456/extracted/images');
    });
  });

  describe('generateImagePaths', () => {
    it('should generate correct image storage paths with extension', () => {
      const paths = service.generateImagePaths(123, 'msg456', 'photo.jpg');

      expect(paths.rawContentBase).toBe('raw-content/agency-123/images/msg456');
      expect(paths.originalFile).toBe('raw-content/agency-123/images/msg456/original.jpg');
      expect(paths.extractedBase).toBeUndefined();
    });

    it('should handle filename without extension', () => {
      const paths = service.generateImagePaths(123, 'msg456', 'photo');

      expect(paths.originalFile).toBe('raw-content/agency-123/images/msg456/original');
    });
  });

  describe('generateVideoPaths', () => {
    it('should generate correct video storage paths', () => {
      const paths = service.generateVideoPaths(123, 'msg456', 'video.mp4');

      expect(paths.rawContentBase).toBe('raw-content/agency-123/videos/msg456');
      expect(paths.originalFile).toBe('raw-content/agency-123/videos/msg456/original.mp4');
    });
  });

  describe('generateExtractedImagePath', () => {
    it('should generate correct extracted image path', () => {
      const path = service.generateExtractedImagePath(123, 'msg456', 2);

      expect(path).toBe('raw-content/agency-123/pdfs/msg456/extracted/images/image_2.jpg');
    });
  });

  describe('generatePublicUrl', () => {
    it('should generate public URL with provided base URL', () => {
      const url = service.generatePublicUrl('raw-content/agency-123/pdfs/msg456/original.pdf', 'https://cdn.example.com');

      expect(url).toBe('https://cdn.example.com/raw-content/agency-123/pdfs/msg456/original.pdf');
    });

    it('should use environment variable when no base URL provided', () => {
      const originalEnv = process.env.DIGITAL_OCEAN_SPACES_CDN_URL;
      process.env.DIGITAL_OCEAN_SPACES_CDN_URL = 'https://spaces.example.com';

      const url = service.generatePublicUrl('raw-content/agency-123/pdfs/msg456/original.pdf');

      expect(url).toBe('https://spaces.example.com/raw-content/agency-123/pdfs/msg456/original.pdf');

      process.env.DIGITAL_OCEAN_SPACES_CDN_URL = originalEnv;
    });

    it('should use default URL when no env var set', () => {
      const originalEnv = process.env.DIGITAL_OCEAN_SPACES_CDN_URL;
      delete process.env.DIGITAL_OCEAN_SPACES_CDN_URL;

      const url = service.generatePublicUrl('raw-content/agency-123/pdfs/msg456/original.pdf');

      expect(url).toBe('https://your-spaces-url.com/raw-content/agency-123/pdfs/msg456/original.pdf');

      process.env.DIGITAL_OCEAN_SPACES_CDN_URL = originalEnv;
    });
  });

  describe('validateRawContentPath', () => {
    it('should validate correct PDF paths', () => {
      expect(service.validateRawContentPath('raw-content/agency-123/pdfs/msg456/original.pdf')).toBe(true);
      expect(service.validateRawContentPath('raw-content/agency-123/pdfs/msg456/extracted/text.json')).toBe(true);
    });

    it('should validate correct image paths', () => {
      expect(service.validateRawContentPath('raw-content/agency-123/images/msg456/original.jpg')).toBe(true);
    });

    it('should validate correct video paths', () => {
      expect(service.validateRawContentPath('raw-content/agency-123/videos/msg456/original.mp4')).toBe(true);
    });

    it('should reject invalid paths', () => {
      expect(service.validateRawContentPath('kondo-media/kondo-1/images/photo.jpg')).toBe(false);
      expect(service.validateRawContentPath('raw-content/invalid/path')).toBe(false);
      expect(service.validateRawContentPath('raw-content/agency-123/invalid-type/msg456/file.txt')).toBe(false);
    });
  });

  describe('extractAgencyIdFromPath', () => {
    it('should extract agency ID from valid paths', () => {
      expect(service.extractAgencyIdFromPath('raw-content/agency-123/pdfs/msg456/original.pdf')).toBe(123);
      expect(service.extractAgencyIdFromPath('raw-content/agency-456/images/msg789/original.jpg')).toBe(456);
    });

    it('should return null for invalid paths', () => {
      expect(service.extractAgencyIdFromPath('kondo-media/kondo-1/images/photo.jpg')).toBe(null);
      expect(service.extractAgencyIdFromPath('invalid/path')).toBe(null);
    });
  });

  describe('extractMessageIdFromPath', () => {
    it('should extract message ID from valid paths', () => {
      expect(service.extractMessageIdFromPath('raw-content/agency-123/pdfs/msg456/original.pdf')).toBe('msg456');
      expect(service.extractMessageIdFromPath('raw-content/agency-123/images/msg789/original.jpg')).toBe('msg789');
    });

    it('should return null for invalid paths', () => {
      expect(service.extractMessageIdFromPath('kondo-media/kondo-1/images/photo.jpg')).toBe(null);
      expect(service.extractMessageIdFromPath('invalid/path')).toBe(null);
    });
  });

  describe('getContentTypeFromPath', () => {
    it('should identify PDF content type', () => {
      expect(service.getContentTypeFromPath('raw-content/agency-123/pdfs/msg456/original.pdf')).toBe('pdf');
    });

    it('should identify image content type', () => {
      expect(service.getContentTypeFromPath('raw-content/agency-123/images/msg456/original.jpg')).toBe('image');
    });

    it('should identify video content type', () => {
      expect(service.getContentTypeFromPath('raw-content/agency-123/videos/msg456/original.mp4')).toBe('video');
    });

    it('should return null for invalid paths', () => {
      expect(service.getContentTypeFromPath('kondo-media/kondo-1/images/photo.jpg')).toBe(null);
      expect(service.getContentTypeFromPath('invalid/path')).toBe(null);
    });
  });
});
