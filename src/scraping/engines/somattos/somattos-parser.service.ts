import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { KondoStatus, KondoTypes } from '../../../kondo/entities/kondo.entity';

// Cheerio type for loaded HTML
type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Service for parsing Somattos HTML pages
 * Extracts Kondo entity fields and media URLs using Cheerio
 */
@Injectable()
export class SomattosParserService {
  private readonly logger = new Logger(SomattosParserService.name);

  /**
   * Parse Somattos HTML to extract Kondo entity fields
   * @param html - Raw HTML content
   * @returns Partial Kondo data
   */
  parse(html: string): Partial<ScrapedKondoDto> {
    const $ = cheerio.load(html);

    try {
      return {
        name: this.extractName($),
        description: this.extractDescription($),
        type: this.detectType($),
        slug: this.extractSlug($),

        // Address
        address_street_and_numbers: this.extractStreet($),
        neighborhood: this.extractNeighborhood($),
        city: this.extractCity($),

        // Financial
        lot_avg_price: this.extractPrice($),
        finance: this.extractFinancing($),

        // Infrastructure
        infra_description: this.extractInfraDescription($),
        ...this.extractConveniences($),

        // Meta
        status: KondoStatus.DONE, // Move to next phase after scraping
        active: true,
      };
    } catch (error) {
      this.logger.error(`Error parsing HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract all media URLs (images, videos) from the page
   * @param html - Raw HTML content
   * @returns Array of media URLs
   */
  extractMediaUrls(html: string): string[] {
    const $ = cheerio.load(html);
    const mediaUrls: string[] = [];

    try {
      this.logger.debug(`Starting media extraction from Somattos page`);
      this.logger.debug(`HTML size: ${html.length} bytes`);

      // Find images - check various attributes
      const imgElements = $('img');
      this.logger.debug(`Found ${imgElements.length} <img> elements`);
      
      imgElements.each((i, el) => {
        const src = $(el).attr('src') || 
                    $(el).attr('data-src') || 
                    $(el).attr('data-lazy-src');
        const alt = $(el).attr('alt');
        
        this.logger.debug(`  [${i}] src="${src}", alt="${alt}"`);
        
        if (src && this.isPropertyMedia(src)) {
          mediaUrls.push(this.normalizeUrl(src));
          this.logger.debug(`    ✓ Added as property media`);
        } else if (src) {
          this.logger.debug(`    ✗ Filtered (not property media)`);
        }
      });

      // Find video sources
      const videoSources = $('video source');
      this.logger.debug(`Found ${videoSources.length} <video source> elements`);
      
      videoSources.each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          mediaUrls.push(this.normalizeUrl(src));
          this.logger.debug(`  [${i}] Video source: ${src}`);
        }
      });

      // Find YouTube/Vimeo embeds
      const embeds = $('iframe[src*="youtube"], iframe[src*="vimeo"]');
      this.logger.debug(`Found ${embeds.length} video embeds`);
      
      embeds.each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          mediaUrls.push(src);
          this.logger.debug(`  [${i}] Embed: ${src}`);
        }
      });

      // Deduplicate and filter
      const uniqueUrls = [...new Set(mediaUrls)];
      this.logger.log(`Extracted ${uniqueUrls.length} unique media URLs from page`);
      
      return uniqueUrls;
    } catch (error) {
      this.logger.error(`Error extracting media URLs: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract property name
   */
  private extractName($: CheerioRoot): string {
    // Try multiple selectors
    let name = $('h1').first().text().trim();
    
    if (!name) {
      name = $('meta[property="og:title"]').attr('content');
    }
    
    if (!name) {
      name = $('title').text().trim().split('-')[0].trim();
    }

    return name || 'Empreendimento Somattos';
  }

  /**
   * Extract property description
   */
  private extractDescription($: CheerioRoot): string {
    let description = $('meta[property="og:description"]').attr('content');
    
    if (!description) {
      description = $('meta[name="description"]').attr('content');
    }

    if (!description) {
      // Try to find description in page content
      description = $('.description, .sobre, .about').first().text().trim();
    }

    return description || '';
  }

  /**
   * Generate slug from name
   */
  private extractSlug($: CheerioRoot): string {
    const name = this.extractName($);
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Detect property type from page content
   */
  private detectType($: CheerioRoot): string {
    const pageText = $('body').text().toLowerCase();
    
    if (pageText.includes('casa') || pageText.includes('casas')) {
      return KondoTypes.Casas;
    }
    if (pageText.includes('chácara') || pageText.includes('chacaras')) {
      return KondoTypes.Chacaras;
    }
    if (pageText.includes('prédio') || pageText.includes('predios') || pageText.includes('apartamento')) {
      return KondoTypes.Predios;
    }
    
    return KondoTypes.Casas; // Default
  }

  /**
   * Extract street address
   */
  private extractStreet($: CheerioRoot): string {
    // Look for address patterns
    const addressSelectors = [
      '.address', '.endereco', '[itemprop="address"]',
      '.location', '.localizacao'
    ];

    for (const selector of addressSelectors) {
      const text = $(selector).text().trim();
      if (text) return text;
    }

    return '';
  }

  /**
   * Extract neighborhood
   */
  private extractNeighborhood($: CheerioRoot): string {
    const addressText = $('[itemprop="address"], .address, .endereco').text();
    // Try to extract neighborhood from address text
    // This is very site-specific and may need adjustment
    return '';
  }

  /**
   * Extract city
   */
  private extractCity($: CheerioRoot): string {
    const citySelectors = ['.city, .cidade, [itemprop="addressLocality"]'];
    
    for (const selector of citySelectors) {
      const text = $(selector).text().trim();
      if (text) return text;
    }

    return 'Belo Horizonte'; // Default for Somattos
  }

  /**
   * Extract price information
   */
  private extractPrice($: CheerioRoot): number | null {
    const priceSelectors = [
      '.price', '.preco', '.valor', '[itemprop="price"]'
    ];

    for (const selector of priceSelectors) {
      const text = $(selector).text().trim();
      const price = this.parsePrice(text);
      if (price) return price;
    }

    return null;
  }

  /**
   * Parse price string to number
   */
  private parsePrice(text: string): number | null {
    // Remove currency symbols and convert to number
    const cleaned = text.replace(/[^\d,]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? null : price;
  }

  /**
   * Extract financing information
   */
  private extractFinancing($: CheerioRoot): boolean {
    const pageText = $('body').text().toLowerCase();
    return pageText.includes('financiamento') || 
           pageText.includes('financiavel') ||
           pageText.includes('financia');
  }

  /**
   * Extract infrastructure description
   */
  private extractInfraDescription($: CheerioRoot): string {
    const infraSelectors = [
      '.infrastructure', '.infraestrutura', 
      '.amenities', '.comodidades'
    ];

    for (const selector of infraSelectors) {
      const text = $(selector).text().trim();
      if (text) return text;
    }

    return '';
  }

  /**
   * Extract conveniences/amenities
   */
  private extractConveniences($: CheerioRoot): Partial<ScrapedKondoDto> {
    const pageText = $('body').text().toLowerCase();
    const conveniences: Partial<ScrapedKondoDto> = {};

    // Map of keywords to property names
    const convenienceMap = {
      'portaria 24h': 'infra_lobby_24h',
      'portaria': 'infra_lobby_24h',
      'segurança': 'infra_security_team',
      'quadra': 'infra_sports_court',
      'churrasqueira': 'infra_barbecue_zone',
      'piscina': 'infra_pool',
      'espaço de convivência': 'infra_living_space',
      'pet': 'infra_pet_area',
      'kids': 'infra_kids_area',
      'lagoa': 'infra_lagoon',
      'academia': 'infra_gym',
      'salão de festas': 'infra_party_saloon',
    };

    for (const [keyword, property] of Object.entries(convenienceMap)) {
      if (pageText.includes(keyword)) {
        conveniences[property] = true;
      }
    }

    return conveniences;
  }

  /**
   * Check if URL is property media (not UI elements)
   */
  private isPropertyMedia(url: string): boolean {
    // Filter out logos, icons, UI elements
    const excludePatterns = [
      /logo/i, /icon/i, /favicon/i,
      /button/i, /sprite/i, /ui-/i,
      /header/i, /footer/i, /menu/i,
      /avatar/i, /profile/i,
      /\.svg$/i, // SVG files are usually UI
    ];

    // Must be an actual image format
    const imageFormats = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;

    return !excludePatterns.some(pattern => pattern.test(url)) &&
           (imageFormats.test(url) || url.includes('image') || url.includes('foto'));
  }

  /**
   * Normalize URL (handle relative URLs, protocol-relative, etc.)
   */
  private normalizeUrl(url: string): string {
    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
      return `https:${url}`;
    }

    // Handle relative URLs (add base domain if needed)
    if (url.startsWith('/')) {
      return `https://somattos.com.br${url}`;
    }

    return url;
  }
}

