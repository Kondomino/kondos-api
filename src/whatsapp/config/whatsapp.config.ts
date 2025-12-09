import { MediaFilters } from '../../storage/services/storage-stream-cdn.service';

/**
 * WhatsApp module configuration
 */
export interface WhatsappConfig {
  mediaFilters: MediaFilters;
  largePdfFilters: MediaFilters;
  storage: {
    cdnPrefix: string;
    largePdfCdnPrefix: string;
    largePdfThresholdMb: number;
  };
}

/**
 * Get media filter configuration from environment or defaults (for extracted images)
 */
export const getMediaFilters = (): MediaFilters => ({
  minSizeKb: parseInt(process.env.MEDIA_MIN_SIZE_KB || '900', 10),
  minResolution: {
    width: parseInt(process.env.MEDIA_MIN_WIDTH || '720', 10),
    height: parseInt(process.env.MEDIA_MIN_HEIGHT || '680', 10)
  },
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
});

/**
 * Get large PDF filter configuration from environment or defaults
 * PDFs bypass resolution checks (not applicable for PDF files)
 */
export const getLargePdfFilters = (): MediaFilters => ({
  minSizeKb: parseInt(process.env.LARGE_PDF_MIN_SIZE_KB || '100', 10),
  minResolution: { width: 0, height: 0 },  // Not applicable for PDFs
  supportedFormats: ['pdf']
});

/**
 * Get WhatsApp configuration
 */
export const getWhatsappConfig = (): WhatsappConfig => ({
  mediaFilters: getMediaFilters(),
  largePdfFilters: getLargePdfFilters(),
  storage: {
    cdnPrefix: 'extracted',
    largePdfCdnPrefix: process.env.LARGE_PDF_CDN_PREFIX || 'documents',
    largePdfThresholdMb: parseInt(process.env.LARGE_PDF_THRESHOLD_MB || '99', 10)
  }
});
