/**
 * Somattos platform configuration
 */
export const SOMATTOS_CONFIG = {
  /**
   * Base URL for Somattos website
   */
  baseUrl: 'https://somattos.com.br',

  /**
   * URL pattern for property pages
   */
  propertyUrlPattern: /^https?:\/\/somattos\.com\.br\/empreendimentos\/.+$/,

  /**
   * Default state for properties (all in Minas Gerais)
   */
  defaultState: 'MG',

  /**
   * Default city for properties
   */
  defaultCity: 'Belo Horizonte',

  /**
   * ScrapingDog options specific to Somattos
   */
  scrapingOptions: {
    dynamic: true,
    premium: false,
    country: 'br',
  },
};

/**
 * Check if a URL is a valid Somattos property URL
 */
export function isSomattosUrl(url: string): boolean {
  return SOMATTOS_CONFIG.propertyUrlPattern.test(url);
}
