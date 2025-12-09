import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ScrapedKondoDto } from '../../dto/scraped-kondo.dto';
import { KondoStatus, KondoTypes } from '../../../kondo/entities/kondo.entity';
import { CONARTES_CONFIG } from './conartes.config';

type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Parser for Conartes property pages
 */
@Injectable()
export class ConartesParserService {
  private readonly logger = new Logger(ConartesParserService.name);

  parse(html: string): Partial<ScrapedKondoDto> {
    const $ = cheerio.load(html);

    try {
      const name = this.extractName($);
      return {
        name,
        description: this.extractDescription($),
        slug: this.slugify(name),
        type: this.detectType($),

        // Location
        city: this.extractCity($) || CONARTES_CONFIG.defaultCity,
        neighborhood: this.extractNeighborhood($),
        address_street_and_numbers: this.extractStreet($),

        // Financial
        lot_avg_price: this.extractPrice($),

        // Infra
        infra_description: this.extractInfraDescription($),

        status: KondoStatus.MEDIA_GATHERING,
        active: true,
      };
    } catch (error) {
      this.logger.error(`Error parsing Conartes HTML: ${error.message}`);
      throw error;
    }
  }

  extractMediaUrls(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    try {
      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
        if (src && this.isMedia(src)) {
          urls.push(this.normalizeUrl(src));
        }
      });

      $('video source').each((_, el) => {
        const src = $(el).attr('src');
        if (src) urls.push(this.normalizeUrl(src));
      });

      $('iframe[src*="youtube"], iframe[src*="vimeo"]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) urls.push(src);
      });

      return [...new Set(urls)];
    } catch (error) {
      this.logger.error(`Error extracting media URLs: ${error.message}`);
      return [];
    }
  }

  private extractName($: CheerioRoot): string {
    const h1 = $('h1').first().text().trim();
    const og = $('meta[property="og:title"]').attr('content');
    const title = $('title').text().trim();
    return h1 || og || title || 'Empreendimento Conartes';
  }

  private extractDescription($: CheerioRoot): string {
    const og = $('meta[property="og:description"]').attr('content');
    const desc = $('meta[name="description"]').attr('content');
    const body = $('.description, .sobre, .about, .text').first().text().trim();
    return og || desc || body || '';
  }

  private extractStreet($: CheerioRoot): string {
    const selectors = ['.address', '.endereco', '.localizacao', '[itemprop="streetAddress"]'];
    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text) return text;
    }
    return '';
  }

  private extractNeighborhood($: CheerioRoot): string {
    const matches = this.extractMetaLocation($);
    return matches?.neighborhood || '';
  }

  private extractCity($: CheerioRoot): string {
    const matches = this.extractMetaLocation($);
    return matches?.city || '';
  }

  private extractState($: CheerioRoot): string {
    const matches = this.extractMetaLocation($);
    return matches?.state || '';
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
    const list = $('.diferenciais, .amenities, .items, .caracteristicas').first().text().trim();
    return list || '';
  }

  private detectType($: CheerioRoot): string {
    const text = $('body').text().toLowerCase();
    if (text.includes('casa')) return KondoTypes.Casas;
    if (text.includes('chácara') || text.includes('chacara')) return KondoTypes.Chacaras;
    if (text.includes('apartamento') || text.includes('studio') || text.includes('flat')) return KondoTypes.Predios;
    return KondoTypes.Predios;
  }

  private extractMetaLocation($: CheerioRoot): { neighborhood?: string; city?: string; state?: string } | undefined {
    const breadcrumb = $('.breadcrumb, .breadcrumbs').text();
    const og = $('meta[property="og:description"]').attr('content') || '';
    const combined = `${breadcrumb} ${og}`.toLowerCase();

    const city = /belo horizonte|bh/.test(combined) ? 'Belo Horizonte' : undefined;
    const state = /\bmg\b|minas gerais/.test(combined) ? 'MG' : undefined;

    // Very naive neighborhood guess: text after the city mention
    let neighborhood: string | undefined;
    const neighborhoodMatch = combined.match(/savassi|lourdes|carmo|funcionarios|cidade jardim/);
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

  private isMedia(url: string): boolean {
    return /(\.(jpe?g|png|webp|gif|mp4|webm)|youtube|vimeo)/i.test(url);
  }

  private normalizeUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    return `${CONARTES_CONFIG.baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
}
