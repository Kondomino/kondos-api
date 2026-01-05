import { Injectable, Logger, Inject } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ScrapingConfig } from '../../config/scraping.config';

export interface ExtractionResult {
  success: boolean;
  data: any;
  source: string;
  confidence: number;
  method: 'json-blob' | 'script-tag' | 'window-object' | 'server-rendered' | 'none';
}

/**
 * Service for extracting structured data from HTML without JS rendering
 * Tries multiple strategies to find window.* objects, JSON blobs, etc.
 */
@Injectable()
export class ManualDataExtractorService {
  private readonly logger = new Logger(ManualDataExtractorService.name);

  constructor(
    @Inject('SCRAPING_CONFIG') private readonly config: ScrapingConfig,
  ) {}

  /**
   * Attempt to extract structured data from HTML without JS rendering
   */
  extractData(html: string): ExtractionResult {
    // Strategy 1: Inline window.* assignments
    const windowExtraction = this.extractWindowObjects(html);
    if (windowExtraction.success) {
      return windowExtraction;
    }

    // Strategy 2: <script type="application/json">
    const jsonScriptExtraction = this.extractJSONScripts(html);
    if (jsonScriptExtraction.success) {
      return jsonScriptExtraction;
    }

    // Strategy 3: <script type="application/ld+json"> (structured data)
    const ldJsonExtraction = this.extractLDJSON(html);
    if (ldJsonExtraction.success) {
      return ldJsonExtraction;
    }

    // Strategy 4: Server-rendered data attributes
    const dataAttrExtraction = this.extractDataAttributes(html);
    if (dataAttrExtraction.success) {
      return dataAttrExtraction;
    }

    return {
      success: false,
      data: null,
      source: 'none',
      confidence: 0,
      method: 'none',
    };
  }

  /**
   * Extract window.* object assignments from HTML
   */
  private extractWindowObjects(html: string): ExtractionResult {
    const commonVars = [
      'aldeaData', '__NEXT_DATA__', '__INITIAL_STATE__', '__NUXT__',
      'APP_DATA', 'appData', 'propertyData', 'siteData', 'pageData',
      'SITE_CONFIG'
    ];

    // Try each common variable name
    for (const varName of commonVars) {
      try {
        // Pattern: window.varName = {...}; or window['varName'] = {...};
        const pattern = new RegExp(
          `window(?:\\.${varName}|\\['${varName}'\\])\\s*=\\s*({[\\s\\S]*?});`,
          'i'
        );
        const match = html.match(pattern);
        
        if (match) {
          const jsonStr = match[1];
          const data = JSON.parse(jsonStr);
          
          // Calculate confidence based on data richness
          const confidence = this.calculateDataConfidence(data);
          
          this.logger.log(`✓ Extracted window.${varName} (confidence: ${confidence.toFixed(2)})`);
          
          return {
            success: true,
            data,
            source: varName,
            confidence,
            method: 'window-object',
          };
        }
      } catch (error) {
        // JSON parse failed, try next variable
        continue;
      }
    }

    // Try generic pattern for any window.xxxData
    try {
      const genericPattern = /window\.(\w+Data\w*)\s*=\s*({[\s\S]*?});/i;
      const match = html.match(genericPattern);
      
      if (match) {
        const varName = match[1];
        const jsonStr = match[2];
        const data = JSON.parse(jsonStr);
        const confidence = this.calculateDataConfidence(data);
        
        this.logger.log(`✓ Extracted window.${varName} (confidence: ${confidence.toFixed(2)})`);
        
        return {
          success: true,
          data,
          source: varName,
          confidence,
          method: 'window-object',
        };
      }
    } catch (error) {
      // Failed
    }

    return { success: false, data: null, source: '', confidence: 0, method: 'none' };
  }

  /**
   * Extract JSON from <script type="application/json"> tags
   */
  private extractJSONScripts(html: string): ExtractionResult {
    const $ = cheerio.load(html);
    
    const scripts = $('script[type="application/json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const content = $(scripts[i]).html();
        if (content) {
          const data = JSON.parse(content);
          const id = $(scripts[i]).attr('id') || `json-script-${i}`;
          const confidence = this.calculateDataConfidence(data);
          
          if (confidence > 0.3) {
            this.logger.log(`✓ Extracted JSON script tag: ${id} (confidence: ${confidence.toFixed(2)})`);
            
            return {
              success: true,
              data,
              source: id,
              confidence,
              method: 'json-blob',
            };
          }
        }
      } catch (error) {
        // Invalid JSON, skip
        continue;
      }
    }

    return { success: false, data: null, source: '', confidence: 0, method: 'none' };
  }

  /**
   * Extract structured data (JSON-LD)
   */
  private extractLDJSON(html: string): ExtractionResult {
    const $ = cheerio.load(html);
    
    const ldJsonScripts = $('script[type="application/ld+json"]');
    if (ldJsonScripts.length > 0) {
      try {
        const content = $(ldJsonScripts[0]).html();
        if (content) {
          const data = JSON.parse(content);
          const confidence = this.calculateDataConfidence(data);
          
          this.logger.log(`✓ Extracted JSON-LD structured data (confidence: ${confidence.toFixed(2)})`);
          
          return {
            success: true,
            data,
            source: 'ld+json',
            confidence,
            method: 'script-tag',
          };
        }
      } catch (error) {
        // Invalid JSON
      }
    }

    return { success: false, data: null, source: '', confidence: 0, method: 'none' };
  }

  /**
   * Extract from data-* attributes
   */
  private extractDataAttributes(html: string): ExtractionResult {
    const $ = cheerio.load(html);
    const dataAttrs: any = {};
    
    $('[data-props], [data-state], [data-config]').each((i, el) => {
      const $el = $(el);
      const props = $el.attr('data-props');
      const state = $el.attr('data-state');
      const config = $el.attr('data-config');
      
      try {
        if (props) dataAttrs.props = JSON.parse(props);
        if (state) dataAttrs.state = JSON.parse(state);
        if (config) dataAttrs.config = JSON.parse(config);
      } catch (error) {
        // Invalid JSON in data attribute
      }
    });
    
    if (Object.keys(dataAttrs).length > 0) {
      const confidence = this.calculateDataConfidence(dataAttrs);
      
      this.logger.log(`✓ Extracted data attributes (confidence: ${confidence.toFixed(2)})`);
      
      return {
        success: true,
        data: dataAttrs,
        source: 'data-attributes',
        confidence,
        method: 'server-rendered',
      };
    }

    return { success: false, data: null, source: '', confidence: 0, method: 'none' };
  }

  /**
   * Calculate confidence score based on data richness
   * Uses weights from config
   */
  private calculateDataConfidence(data: any): number {
    if (!data) return 0;

    const weights = this.config.extractionConfidence.confidenceWeights;
    const keywords = this.config.extractionConfidence.relevantKeywords;
    
    let score = 0;
    const jsonStr = JSON.stringify(data);
    
    // Size indicator (larger = more data)
    const sizeScore = Math.min(jsonStr.length / 10000, weights.size);
    score += sizeScore;
    
    // Depth indicator (nested = structured)
    const depth = this.getObjectDepth(data);
    const depthScore = Math.min(depth / 10, weights.depth);
    score += depthScore;
    
    // Property-relevant keywords
    const keywordMatches = keywords.filter(kw => 
      jsonStr.toLowerCase().includes(kw.toLowerCase())
    ).length;
    const keywordScore = Math.min(keywordMatches / keywords.length, weights.keywords);
    score += keywordScore;
    
    return Math.min(score, 1.0);
  }

  /**
   * Get max depth of nested object
   */
  private getObjectDepth(obj: any, depth = 0): number {
    if (!obj || typeof obj !== 'object') return depth;
    
    const depths = Object.values(obj).map(val => 
      this.getObjectDepth(val, depth + 1)
    );
    
    return Math.max(depth, ...depths);
  }
}
