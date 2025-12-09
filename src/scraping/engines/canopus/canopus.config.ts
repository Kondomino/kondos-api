/**
 * Canopus platform configuration
 */
export const CANOPUS_CONFIG = {
  /**
   * Base URL for Canopus website
   */
  baseUrl: 'https://canopus.com.br',

  /**
   * URL pattern for Canopus property pages
   * Example: https://canopus.com.br/infinity
   */
  propertyUrlPattern: /^https?:\/\/canopus\.com\.br\/(?!wp-).*[^\s]+$/i,

  /**
   * Default location assumptions (can be refined per page when parsed)
   */
  defaultState: 'MG',
  defaultCity: 'Belo Horizonte',

  /**
   * ScrapingDog options for Canopus
   * Set dynamic true to handle potential SPA sections
   */
  scrapingOptions: {
    dynamic: true,
    premium: false,
    country: 'br',
  },
};

/**
 * Check if a URL is a Canopus property URL
 */
export function isCanopusUrl(url: string): boolean {
  return CANOPUS_CONFIG.propertyUrlPattern.test(url);
}
