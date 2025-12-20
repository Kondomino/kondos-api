/**
 * Elementor page builder detection and configuration
 */

/**
 * Elementor-specific CSS class markers that indicate a page built with Elementor
 */
const ELEMENTOR_MARKERS = [
  'elementor-element',
  'elementor-heading-title',
  'e-con',
  'elementor-container',
  'elementor-widget',
  'elementor-section',
];

/**
 * CSS selectors for extracting data from Elementor pages
 */
export const ELEMENTOR_SELECTORS = {
  /**
   * All heading titles that typically contain property information
   */
  headingTitles: 'h2.elementor-heading-title, h1.elementor-heading-title',

  /**
   * Image carousel (swiper/slider) structure
   */
  carouselSlides: '.swiper-slide img, [class*="carousel"] img, [class*="slider"] img',

  /**
   * Feature/amenity containers
   */
  features: 'h2.elementor-heading-title, .elementor-text-editor',
};

/**
 * Patterns for extracting specific data from heading text
 */
export const ELEMENTOR_PATTERNS = {
  /**
   * Brazilian street address pattern (RUA/AV/AVENIDA followed by number)
   */
  address: /(?:RUA|AV|AVENIDA|RUA|STREET|AVENUE)\s+([^,]+),?\s*(\d+)(?:\s*[-–]\s*(.+?))?(?:\s*[,.]|$)/i,

  /**
   * Bedroom count pattern (X quartos, X rooms, etc.)
   */
  bedrooms: /(\d+)\s*(?:quarto|quart|room|br|bedroom)s?\b/i,

  /**
   * Amenity keywords that map to boolean fields
   */
  amenities: {
    pool: /piscina|pool|swimming/i,
    gym: /academia|gym|fitness|ginásio/i,
    leisure: /lazer|leisure|recreation|recreação/i,
    parking: /estacionamento|parking|garagem|garage/i,
    playground: /parquinho|playground|playground|play area/i,
    bbq: /churrasqueira|bbq|grill|churrasco/i,
    garden: /jardim|garden|landscape/i,
    court: /quadra|court|tennis/i,
  },
};

/**
 * Detect if a website is built with Elementor page builder
 * Checks HTML content for Elementor-specific CSS classes and structure
 *
 * @param html - Raw HTML content
 * @returns true if Elementor markers are found
 */
export function isElementorSite(html: string): boolean {
  if (!html) return false;

  const lowerHtml = html.toLowerCase();

  // Check for multiple Elementor markers to ensure confidence
  const markerMatches = ELEMENTOR_MARKERS.filter((marker) => lowerHtml.includes(marker)).length;

  // Require at least 3 markers to be confident it's Elementor
  // (avoid false positives from single class matches)
  return markerMatches >= 3;
}

/**
 * Detect if a URL belongs to a known Elementor-based domain
 * Can be extended with a database of known Elementor sites
 *
 * @param url - URL to check
 * @returns true if URL is known to use Elementor
 */
export function isElementorUrl(url: string): boolean {
  // This can be extended with a list of known Elementor sites
  // For now, we rely on HTML content detection via isElementorSite()
  // Future: check domain registry or caching mechanism
  return false; // Primary detection happens via HTML content
}

/**
 * Extract Elementor heading text content
 * Handles nested Elementor structure with proper text node extraction
 *
 * @param headingElement - Heading HTML element (h1, h2, h3)
 * @returns Cleaned text content
 */
export function extractHeadingText(headingElement: string): string {
  // Remove HTML tags and extra whitespace
  let text = headingElement
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Convert HTML spaces
    .replace(/&amp;/g, '&') // Convert HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();

  // Collapse multiple spaces
  text = text.replace(/\s+/g, ' ');

  return text;
}

/**
 * Parse feature string and extract amenity keywords
 * Features are typically pipe-delimited on Elementor pages
 *
 * @param featureString - Raw feature text (e.g., "4 quartos | Piscina | Academia")
 * @returns Parsed amenities object
 */
export function parseElementorFeatures(featureString: string): Record<string, boolean | number> {
  const amenities: Record<string, boolean | number> = {};

  // Split on pipe delimiter and process each feature
  const features = featureString.split('|').map((f) => f.trim());

  for (const feature of features) {
    // Check bedrooms
    const bedroomMatch = feature.match(ELEMENTOR_PATTERNS.bedrooms);
    if (bedroomMatch) {
      amenities.bedrooms = parseInt(bedroomMatch[1], 10);
      continue;
    }

    // Check amenities keywords
    for (const [key, pattern] of Object.entries(ELEMENTOR_PATTERNS.amenities)) {
      if (pattern.test(feature)) {
        amenities[`infra_${key}`] = true;
        break;
      }
    }
  }

  return amenities;
}

/**
 * Elementor scraping configuration
 */
export const ELEMENTOR_CONFIG = {
  scrapingOptions: {
    dynamic: true,  // Elementor often uses JavaScript for image carousels
    premium: false,
    country: 'br',
  },
};
