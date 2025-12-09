/**
 * Conartes platform configuration
 */
export const CONARTES_CONFIG = {
  /**
   * Base URL for Conartes website
   */
  baseUrl: 'https://www.conartes.com.br',

  /**
   * URL pattern for Conartes property pages
   * Example: https://www.conartes.com.br/empreendimento/hakken-residence
   */
  propertyUrlPattern: /^https?:\/\/www\.conartes\.com\.br\/empreendimento\/.+/i,

  /**
   * Default location assumptions (can be refined per page when parsed)
   */
  defaultState: 'MG',
  defaultCity: 'Belo Horizonte',

  /**
   * ScrapingDog options for Conartes
   * Conartes pages are server-rendered WordPress; JS rendering off by default
   */
  scrapingOptions: {
    dynamic: false,
    premium: false,
    country: 'br',
  },
};

/**
 * Check if a URL is a Conartes property URL
 */
export function isConartesUrl(url: string): boolean {
  return CONARTES_CONFIG.propertyUrlPattern.test(url);
}
