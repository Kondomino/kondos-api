import { Injectable, Logger } from '@nestjs/common';

/**
 * Service for extracting media URLs from structured data (JSON objects)
 * Handles data from window.aldeaData, __NEXT_DATA__, __NUXT__, etc.
 * Complements HTML-based media extraction for SPA sites
 */
@Injectable()
export class StructuredMediaExtractorService {
  private readonly logger = new Logger(StructuredMediaExtractorService.name);

  /**
   * Extract media URLs from structured data
   * @param data - The structured data object (e.g., window.aldeaData)
   * @param source - The source variable name (e.g., 'aldeaData')
   * @returns Array of media URLs
   */
  extract(data: any, source?: string): string[] {
    if (!data) {
      return [];
    }

    this.logger.debug(`Extracting media from structured data (source: ${source || 'unknown'})`);

    // Try specific extractors first based on known patterns
    if (source) {
      const specificUrls = this.extractBySource(data, source);
      if (specificUrls.length > 0) {
        this.logger.log(`✓ Found ${specificUrls.length} media URLs via specific ${source} extractor`);
        return specificUrls;
      }
    }

    // Fallback to generic deep search
    const urls: string[] = [];
    this.deepSearchImages(data, urls);
    
    if (urls.length > 0) {
      this.logger.log(`✓ Found ${urls.length} media URLs via deep search`);
    } else {
      this.logger.debug('No media URLs found in structured data');
    }

    return urls;
  }

  /**
   * Extract media using source-specific patterns
   */
  private extractBySource(data: any, source: string): string[] {
    switch (source) {
      case 'aldeaData':
        return this.extractFromAldeaData(data);
      case '__NEXT_DATA__':
        return this.extractFromNextData(data);
      case '__NUXT__':
        return this.extractFromNuxtData(data);
      default:
        return [];
    }
  }

  /**
   * Extract from Aldea-specific data structure
   * Pattern: galeria_fotos.galeria[].area_images[].url
   */
  private extractFromAldeaData(data: any): string[] {
    const urls: string[] = [];

    try {
      // Extract from galeria_fotos.galeria
      if (data.galeria_fotos?.galeria && Array.isArray(data.galeria_fotos.galeria)) {
        for (const area of data.galeria_fotos.galeria) {
          const areaName = area.area_empreendimento || 'Unknown';
          
          if (area.area_images && Array.isArray(area.area_images)) {
            for (const img of area.area_images) {
              if (img.url && typeof img.url === 'string') {
                urls.push(img.url);
                this.logger.debug(
                  `  └─ [${areaName}] ${img.caption || img.title || 'Image'}: ${img.url}`
                );
              }
            }
          }
        }
      }

      // Also check for other common patterns in aldeaData
      if (data.images && Array.isArray(data.images)) {
        for (const img of data.images) {
          if (typeof img === 'string' && this.isImageUrl(img)) {
            urls.push(img);
          } else if (img.url && this.isImageUrl(img.url)) {
            urls.push(img.url);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error extracting from aldeaData: ${error.message}`);
    }

    return urls;
  }

  /**
   * Extract from Next.js data structure
   * Pattern: props.pageProps.images or similar
   */
  private extractFromNextData(data: any): string[] {
    const urls: string[] = [];

    try {
      // Next.js typically stores data in props.pageProps
      const pageProps = data?.props?.pageProps;
      if (pageProps) {
        // Check common image properties
        if (pageProps.images && Array.isArray(pageProps.images)) {
          for (const img of pageProps.images) {
            if (typeof img === 'string' && this.isImageUrl(img)) {
              urls.push(img);
            } else if (img.url && this.isImageUrl(img.url)) {
              urls.push(img.url);
            } else if (img.src && this.isImageUrl(img.src)) {
              urls.push(img.src);
            }
          }
        }

        // Check gallery
        if (pageProps.gallery && Array.isArray(pageProps.gallery)) {
          for (const item of pageProps.gallery) {
            if (item.url && this.isImageUrl(item.url)) {
              urls.push(item.url);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error extracting from __NEXT_DATA__: ${error.message}`);
    }

    return urls;
  }

  /**
   * Extract from Nuxt.js data structure
   * Pattern: data.images or state.gallery
   */
  private extractFromNuxtData(data: any): string[] {
    const urls: string[] = [];

    try {
      // Nuxt stores data in various places
      const sources = [data.data, data.state, data];

      for (const source of sources) {
        if (!source) continue;

        // Check common image arrays
        const imageArrayKeys = ['images', 'gallery', 'photos', 'media'];
        for (const key of imageArrayKeys) {
          if (source[key] && Array.isArray(source[key])) {
            for (const item of source[key]) {
              if (typeof item === 'string' && this.isImageUrl(item)) {
                urls.push(item);
              } else if (item.url && this.isImageUrl(item.url)) {
                urls.push(item.url);
              } else if (item.src && this.isImageUrl(item.src)) {
                urls.push(item.src);
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error extracting from __NUXT__: ${error.message}`);
    }

    return urls;
  }

  /**
   * Deep search for image URLs in any object structure
   * Used as fallback when specific extractors don't match
   */
  private deepSearchImages(obj: any, urls: string[], depth = 0, visited = new WeakSet()): void {
    // Prevent infinite loops
    if (depth > 10 || !obj) {
      return;
    }

    // Prevent circular references
    if (typeof obj === 'object' && obj !== null) {
      if (visited.has(obj)) {
        return;
      }
      visited.add(obj);
    }

    if (typeof obj === 'string') {
      // Check if it's an image URL
      if (this.isImageUrl(obj)) {
        urls.push(obj);
      }
    } else if (Array.isArray(obj)) {
      // Recurse into array items
      for (const item of obj) {
        this.deepSearchImages(item, urls, depth + 1, visited);
      }
    } else if (typeof obj === 'object') {
      // Check common image property names first
      const imageKeys = [
        'url', 'src', 'image', 'photo', 'href', 'imageUrl', 'imgSrc',
        'thumbnail', 'picture', 'img', 'media', 'file'
      ];

      for (const key of imageKeys) {
        if (obj[key] && typeof obj[key] === 'string' && this.isImageUrl(obj[key])) {
          urls.push(obj[key]);
        }
      }

      // Recurse into all object properties
      for (const value of Object.values(obj)) {
        this.deepSearchImages(value, urls, depth + 1, visited);
      }
    }
  }

  /**
   * Check if a string is a valid image URL
   */
  private isImageUrl(str: string): boolean {
    if (typeof str !== 'string' || str.length < 10) {
      return false;
    }

    // Must start with http(s)
    if (!str.startsWith('http://') && !str.startsWith('https://')) {
      return false;
    }

    // Must end with image extension (with optional query params)
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)(\?.*)?$/i;
    return imageExtensions.test(str);
  }
}
