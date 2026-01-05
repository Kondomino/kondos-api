import { Injectable, Logger, Inject } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ScrapingConfig } from '../../config/scraping.config';

export interface SPADetectionResult {
  isSPA: boolean;
  confidence: number; // 0-1
  framework?: 'react' | 'vue' | 'nextjs' | 'nuxt' | 'angular' | 'unknown';
  indicators: string[];
  needsJsRendering: boolean;
}

/**
 * Service for detecting Single Page Applications (SPAs)
 * Analyzes HTML to determine if JS rendering is needed
 */
@Injectable()
export class SPADetectorService {
  private readonly logger = new Logger(SPADetectorService.name);

  constructor(
    @Inject('SCRAPING_CONFIG') private readonly config: ScrapingConfig,
  ) {}

  /**
   * Detect if page is an SPA and if JS rendering is needed
   */
  detectSPA(html: string): SPADetectionResult {
    const indicators: string[] = [];
    let isSPA = false;
    let framework: SPADetectionResult['framework'] | undefined;
    let confidence = 0;

    // Test 1: HTML Content Density
    const contentDensity = this.measureContentDensity(html);
    if (contentDensity.textLength < this.config.extractionConfidence.minTextContentLength) {
      indicators.push(`low-content (${contentDensity.textLength}chars)`);
      isSPA = true;
      confidence += 0.4;
    }

    // Test 2: Framework Signature Detection
    const frameworkDetection = this.detectFramework(html);
    if (frameworkDetection.detected) {
      indicators.push(`framework:${frameworkDetection.framework}`);
      framework = frameworkDetection.framework;
      isSPA = true;
      confidence += 0.3;
    }

    // Test 3: Window Data Objects
    const windowDataDetection = this.detectWindowDataObjects(html);
    if (windowDataDetection.found) {
      indicators.push(`window-data:${windowDataDetection.variables.slice(0, 2).join(',')}`);
      confidence += 0.2;
      // Has window data but might be server-rendered
    }

    // Test 4: API Endpoint Patterns
    const apiDetection = this.detectAPIPatterns(html);
    if (apiDetection.hasAPIs) {
      indicators.push(`api-endpoints:${apiDetection.count}`);
      confidence += 0.1;
    }

    // Test 5: Empty Root Div
    const hasEmptyRoot = /<div id="(root|app|__next)"[^>]*>\s*<\/div>/.test(html);
    if (hasEmptyRoot) {
      indicators.push('empty-root-div');
      isSPA = true;
      confidence += 0.3;
    }

    // Determine if JS rendering is needed
    const needsJsRendering = isSPA && (
      contentDensity.textLength < this.config.extractionConfidence.minTextContentLength || 
      hasEmptyRoot ||
      !windowDataDetection.found // No data in HTML = needs rendering
    );

    return {
      isSPA,
      confidence: Math.min(confidence, 1.0),
      framework,
      indicators,
      needsJsRendering,
    };
  }

  /**
   * Measure content density (text vs markup)
   */
  private measureContentDensity(html: string): { textLength: number; ratio: number } {
    const $ = cheerio.load(html);
    
    // Remove scripts, styles, comments
    $('script, style, noscript, svg').remove();
    
    const textContent = $('body').text().trim();
    const textLength = textContent.length;
    const ratio = textLength / html.length;
    
    return { textLength, ratio };
  }

  /**
   * Detect SPA framework signatures
   */
  private detectFramework(html: string): { 
    detected: boolean; 
    framework?: 'react' | 'vue' | 'nextjs' | 'nuxt' | 'angular' | 'unknown';
  } {
    const signatures: Array<{ 
      framework: 'react' | 'vue' | 'nextjs' | 'nuxt' | 'angular';
      patterns: string[];
    }> = [
      { framework: 'react', patterns: ['id="root"', '__REACT_DEVTOOLS_GLOBAL_HOOK__', 'react-root'] },
      { framework: 'vue', patterns: ['id="app"', '__VUE__', 'v-app'] },
      { framework: 'nextjs', patterns: ['__NEXT_DATA__', 'id="__next"', '_next/static'] },
      { framework: 'nuxt', patterns: ['__NUXT__', 'id="__nuxt"'] },
      { framework: 'angular', patterns: ['<app-root', 'ng-version'] },
    ];

    for (const { framework, patterns } of signatures) {
      if (patterns.some(pattern => html.includes(pattern))) {
        return { detected: true, framework };
      }
    }

    return { detected: false };
  }

  /**
   * Detect window.* data objects
   */
  private detectWindowDataObjects(html: string): { found: boolean; variables: string[] } {
    const variables: string[] = [];
    
    // Common patterns
    const commonVars = [
      'aldeaData', '__NEXT_DATA__', '__INITIAL_STATE__', 
      '__NUXT__', 'APP_DATA', 'appData', 'propertyData', 
      'siteData', 'pageData', 'SITE_CONFIG'
    ];
    
    for (const varName of commonVars) {
      const pattern = new RegExp(`window\\.${varName}\\s*=`, 'i');
      if (pattern.test(html)) {
        variables.push(varName);
      }
    }
    
    // Generic pattern: window.xxxData = {
    const genericPattern = /window\.(\w*[Dd]ata\w*)\s*=/g;
    let match;
    while ((match = genericPattern.exec(html)) !== null) {
      const varName = match[1];
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }
    
    return {
      found: variables.length > 0,
      variables,
    };
  }

  /**
   * Detect API endpoint patterns
   */
  private detectAPIPatterns(html: string): { hasAPIs: boolean; count: number } {
    const apiPattern = /https?:\/\/[^"'\s]+\/api\/[^"'\s]+/g;
    const matches = html.match(apiPattern) || [];
    
    return {
      hasAPIs: matches.length > 0,
      count: matches.length,
    };
  }
}
