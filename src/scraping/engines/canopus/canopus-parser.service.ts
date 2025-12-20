import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { KondoStatus, KondoTypes } from '../../../kondo/entities/kondo.entity';
import { CANOPUS_CONFIG } from './canopus.config';

type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Parser for Canopus property pages
 */
@Injectable()
export class CanopusParserService {
  private readonly logger = new Logger(CanopusParserService.name);

  parse(html: string): Partial<ScrapedKondoDto> {
    const $ = cheerio.load(html);

    try {
      const name = this.extractName($);
      const amenities = this.extractAmenitiesAsFields($);
      
      return {
        name,
        description: this.extractDescription($),
        slug: this.slugify(name),
        type: this.detectType($),

        city: this.extractCity($) || CANOPUS_CONFIG.defaultCity,
        neighborhood: this.extractNeighborhood($),
        address_street_and_numbers: this.extractStreet($),

        lot_avg_price: this.extractPrice($),
        infra_description: this.extractInfraDescription($),
        
        // Merge extracted amenity fields
        ...amenities,

        status: KondoStatus.DONE,
        active: true,
      };
    } catch (error) {
      this.logger.error(`Error parsing Canopus HTML: ${error.message}`);
      throw error;
    }
  }

  extractMediaUrls(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];
    const seenUrls = new Set<string>();

    try {
      // Strategy 1: Extract from srcSet (Next.js optimized images)
      $('img[srcset]').each((_, el) => {
        const srcset = $(el).attr('srcset');
        if (srcset) {
          // srcSet format: "url1 1x, url2 2x" or "url 1024w, url 2048w"
          srcset.split(',').forEach(entry => {
            const [url] = entry.trim().split(/\s+/);
            if (url && this.isValidMediaUrl(url)) {
              const decoded = this.decodeNextjsImageUrl(url);
              if (!seenUrls.has(decoded)) {
                urls.push(decoded);
                seenUrls.add(decoded);
              }
            }
          });
        }
      });

      // Strategy 2: Fallback to src attribute
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && this.isValidMediaUrl(src)) {
          const decoded = this.decodeNextjsImageUrl(src);
          if (!seenUrls.has(decoded)) {
            urls.push(decoded);
            seenUrls.add(decoded);
          }
        }
      });

      // Strategy 3: data-src (lazy loading)
      $('img[data-src]').each((_, el) => {
        const src = $(el).attr('data-src');
        if (src && this.isValidMediaUrl(src)) {
          const decoded = this.decodeNextjsImageUrl(src);
          if (!seenUrls.has(decoded)) {
            urls.push(decoded);
            seenUrls.add(decoded);
          }
        }
      });

      // Strategy 4: Video sources
      $('video source[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !seenUrls.has(src)) {
          urls.push(this.normalizeUrl(src));
          seenUrls.add(src);
        }
      });

      // Strategy 5: iframes (YouTube, Vimeo)
      $('iframe[src*="youtube"], iframe[src*="vimeo"]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !seenUrls.has(src)) {
          urls.push(src);
          seenUrls.add(src);
        }
      });

      return Array.from(urls);
    } catch (error) {
      this.logger.error(`Error extracting media URLs: ${error.message}`);
      return [];
    }
  }

  private extractName($: CheerioRoot): string {
    const h1 = $('h1').first().text().trim();
    const og = $('meta[property="og:title"]').attr('content');
    const title = $('title').text().trim();
    return h1 || og || title || 'Empreendimento Canopus';
  }

  private extractDescription($: CheerioRoot): string {
    // Priority 1: Meta tags (most reliable for SSR sites)
    const og = $('meta[property="og:description"]').attr('content');
    if (og && og.length > 20) return og.trim();
    
    const desc = $('meta[name="description"]').attr('content');
    if (desc && desc.length > 20) return desc.trim();
    
    // Priority 2: Styled-components Typography pattern
    const paragraphs = $('[class*="Typography__Text"]');
    
    for (let i = 0; i < paragraphs.length; i++) {
      const text = $(paragraphs[i]).text().trim();
      // Find first substantial paragraph (likely intro text)
      if (text.length > 100) {
        return text;
      }
    }
    
    return '';
  }

  private extractStreet($: CheerioRoot): string {
    // Target styled-components wrapper with location icon + address text
    const addressElements = $('[class*="Wrapper-sc"]');
    
    for (let i = 0; i < addressElements.length; i++) {
      const text = $(addressElements[i]).text().trim();
      
      // Check if it matches address pattern: "Neighborhood - Street, Number"
      if (text.includes(' - ') && /\d+/.test(text)) {
        const parts = text.split(' - ');
        if (parts.length === 2) {
          // Return street part: "Rua ..., 570"
          return parts[1].trim();
        }
      }
    }
    
    return '';
  }

  private extractNeighborhood($: CheerioRoot): string {
    // Parse from styled-components address wrapper
    const addressElements = $('[class*="Wrapper-sc"]');
    
    for (let i = 0; i < addressElements.length; i++) {
      const text = $(addressElements[i]).text().trim();
      
      if (text.includes(' - ') && /\d+/.test(text)) {
        const parts = text.split(' - ');
        if (parts.length >= 1) {
          // Return neighborhood part: "Santo Antônio"
          return parts[0].trim();
        }
      }
    }
    
    // Fallback to meta location
    const loc = this.extractMetaLocation($);
    return loc?.neighborhood || '';
  }

  private extractCity($: CheerioRoot): string {
    const loc = this.extractMetaLocation($);
    return loc?.city || '';
  }

  private extractState($: CheerioRoot): string {
    const loc = this.extractMetaLocation($);
    return loc?.state || '';
  }

  private extractPrice($: CheerioRoot): number | undefined {
    const priceText = $('[class*="price"], .valor, .preco').first().text();
    const match = priceText.match(/\d+[\d\.]*,?\d*/);
    if (!match) return undefined;
    const normalized = match[0].replace(/\./g, '').replace(',', '.');
    const price = parseFloat(normalized);
    return Number.isFinite(price) ? price : undefined;
  }

  private extractInfraDescription($: CheerioRoot): string {
    // Target styled-components pattern for amenities
    const container = $('[class*="DifferentialsContainer"], [class*="Amenities"], [class*="Items"]').first();
    
    if (container.length === 0) return '';
    
    const amenityTexts: string[] = [];
    
    container.find('[class*="Differential"], [class*="Item"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 0 && text.length < 100) {
        amenityTexts.push(text);
      }
    });
    
    return amenityTexts.join(', ');
  }

  /**
   * Extract amenities as individual boolean fields
   * Maps keywords to infra_* fields
   */
  private extractAmenitiesAsFields($: CheerioRoot): Partial<ScrapedKondoDto> {
    const amenities: Record<string, boolean> = {};
    
    // Get all text content from body (lowercase for matching)
    const infraDesc = this.extractInfraDescription($);
    const bodyText = $('body').text().toLowerCase();
    const allText = (infraDesc + ' ' + bodyText).toLowerCase();
    
    // Keyword mappings for amenities
    const amenityMap: Record<string, string[]> = {
      infra_pool: ['piscina', 'pool', 'swimming'],
      infra_gym: ['academia', 'gym', 'fitness', 'ginásio'],
      infra_leisure: ['lazer', 'leisure', 'recreação', 'recreation', 'salão de festas'],
      infra_parking: ['estacionamento', 'parking', 'garagem', 'garage', 'vagas'],
      infra_playground: ['parquinho', 'playground', 'brinquedoteca'],
      infra_sports_court: ['quadra', 'court', 'tennis', 'esportiva'],
      infra_barbecue_zone: ['churrasqueira', 'bbq', 'grill', 'churrasco', 'grelhados'],
      infra_garden: ['jardim', 'garden', 'landscape', 'paisagismo'],
      infra_pet_place: ['pet', 'cachorro', 'animal', 'dog'],
      infra_coworking: ['coworking', 'trabalho', 'escritório compartilhado'],
    };
    
    for (const [field, keywords] of Object.entries(amenityMap)) {
      const found = keywords.some(kw => allText.includes(kw));
      if (found) {
        amenities[field] = true;
      }
    }
    
    return amenities as Partial<ScrapedKondoDto>;
  }

  private detectType($: CheerioRoot): string {
    const text = $('body').text().toLowerCase();
    if (text.includes('casa')) return KondoTypes.Casas;
    if (text.includes('chácara') || text.includes('chacara')) return KondoTypes.Chacaras;
    if (text.includes('apartamento') || text.includes('studio') || text.includes('flat')) return KondoTypes.Predios;
    return KondoTypes.Predios;
  }

  private extractMetaLocation($: CheerioRoot): { neighborhood?: string; city?: string; state?: string } | undefined {
    const meta = $('meta[name="description"], meta[property="og:description"]').attr('content') || '';
    const breadcrumb = $('.breadcrumb, .breadcrumbs').text();
    const combined = `${breadcrumb} ${meta}`.toLowerCase();

    const city = /belo horizonte|bh/.test(combined) ? 'Belo Horizonte' : undefined;
    const state = /\bmg\b|minas gerais/.test(combined) ? 'MG' : undefined;

    let neighborhood: string | undefined;
    const neighborhoodMatch = combined.match(/savassi|lourdes|carmo|funcionarios|cidade jardim|buritis|sion/);
    if (neighborhoodMatch) neighborhood = neighborhoodMatch[0].replace(/\b\w/, (m) => m.toUpperCase());

    if (city || state || neighborhood) return { city, state, neighborhood };
    return undefined;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Decode Next.js image optimization URLs to extract original source
   * Input: /_next/image?url=https%3A%2F%2Fd1o0fuw54avhiz.cloudfront.net%2F...&w=1920&q=50
   * Output: https://d1o0fuw54avhiz.cloudfront.net/...
   */
  private decodeNextjsImageUrl(url: string): string {
    if (!url.includes('/_next/image')) {
      return url; // Not a Next.js URL
    }

    try {
      // Parse as URL (handle both relative and absolute)
      const urlObj = new URL(url, CANOPUS_CONFIG.baseUrl);
      const encodedUrl = urlObj.searchParams.get('url');
      
      if (encodedUrl) {
        return decodeURIComponent(encodedUrl);
      }
    } catch (e) {
      this.logger.debug(`Failed to decode Next.js URL: ${url}`);
    }

    return url; // Return original if decoding fails
  }

  /**
   * Check if URL is valid media (not placeholder, icon, etc.)
   */
  private isValidMediaUrl(url: string): boolean {
    if (!url) return false;

    // Exclude data URIs, SVGs, base64
    if (url.startsWith('data:')) return false;
    if (url.endsWith('.svg')) return false;

    // Exclude icons, logos, placeholders
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('icon') || 
        lowerUrl.includes('logo') || 
        lowerUrl.includes('placeholder')) {
      return false;
    }

    // Include: images, videos, Next.js URLs, CloudFront
    return /\.(jpe?g|png|webp|gif|avif|mp4|webm|mov)(\?|$)/i.test(url) ||
           url.includes('/_next/image') ||
           url.includes('cloudfront');
  }

  private normalizeUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    return `${CANOPUS_CONFIG.baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
}
