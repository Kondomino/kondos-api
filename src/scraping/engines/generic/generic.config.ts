/**
 * Generic scraper configuration
 * Centralized selectors, patterns, and constants for fallback scraping engine
 */

/**
 * CSS selectors (by priority) for extracting property fields
 * Each field has multiple selectors to try in order
 */
export const GENERIC_SELECTORS = {
  // Property identification
  name: [
    'h1',
    'h2.property-name',
    '.titulo',
    '.title',
    '.nome',
    '.property-name',
    '[data-property-name]',
    '.imovel-name',
  ],

  description: [
    '.description',
    '.descricao',
    '.about',
    '.sobre',
    '.detail',
    '.conteudo',
    '[itemprop="description"]',
    '.text-content',
  ],

  // Address
  address: [
    '.address',
    '.endereco',
    '.location',
    '.localizacao',
    '[itemprop="address"]',
  ],
  street: [
    '.street',
    '.rua',
    '.address-street',
    '[itemprop="streetAddress"]',
    '.endereco-rua',
  ],
  neighborhood: [
    '.neighborhood',
    '.bairro',
    '[itemprop="addressRegion"]',
    '.neighborhood-name',
  ],
  city: [
    '.city',
    '.cidade',
    '[itemprop="addressLocality"]',
    '.city-name',
  ],

  // Financial
  price: [
    '[itemprop="price"]',
    '.preco',
    '.valor',
    '.price',
    '.cost',
    '.preco-total',
    '.price-amount',
  ],

  // Content
  images: [
    'img',
    '[data-src]',
    'picture img',
    'picture source',
    '[data-lazy-src]',
    'img[srcset]',
    '.gallery img',
    '.slider img',
    '.carousel img',
  ],

  videos: [
    'iframe[src*="youtube"]',
    'iframe[src*="vimeo"]',
    'video',
    'video source',
    '[data-video]',
  ],

  // Navigation
  pagination: [
    'a.next',
    'a[rel="next"]',
    'button[data-next]',
    '.pagination a:last-child',
    '[data-pagination-next]',
  ],
};

/**
 * Regex patterns for data extraction
 */
export const GENERIC_PATTERNS = {
  price: /R\$\s*([\d.,]+)/gi,
  phone: /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g,
  email: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  address: /^([^,]+),\s*([^,]+),\s*([^,]+)$/, // Street, City, State
};

/**
 * Fallback values when extraction fails
 */
export const GENERIC_FALLBACKS = {
  city: 'Belo Horizonte',
  state: 'MG',
  country: 'Brasil',
  type: 'casas',
};

/**
 * Keywords for property type detection
 */
export const TYPE_KEYWORDS = {
  predios: ['apartamento', 'apto', 'apt', 'flat', 'prédio', 'edifício'],
  casas: ['casa', 'sobrado', 'residencial', 'chalets'],
  chacaras: ['chácara', 'chacara', 'sítio', 'fazenda'],
  comercial: ['comercial', 'loja', 'sala', 'corporativo', 'office'],
};

/**
 * Placeholder detection patterns
 */
export const PLACEHOLDER_PATTERNS = {
  filenames: [
    /placeholder/i,
    /default/i,
    /icon/i,
    /1x1/i,
    /spacer/i,
    /blank/i,
    /dummy/i,
    /generic/i,
  ],
  altTexts: ['placeholder', 'logo', 'icon', 'default', 'image'],
  minSize: { width: 100, height: 100 }, // Skip if smaller
};

/**
 * Fake commodity keywords to remove
 */
export const FAKE_KEYWORDS = [
  'placeholder',
  'coming soon',
  'em breve',
  'exemplo',
  'teste',
  'TBA',
  'TBD',
  '[PLACEHOLDER]',
];

/**
 * OpenGraph meta tags to try for fallback extraction
 */
export const OG_TAGS = {
  name: ['og:title', 'og:name'],
  description: ['og:description'],
  image: ['og:image', 'og:image:url'],
  address: ['og:street_address', 'og:locality', 'og:region'],
  price: ['og:price:amount'],
};

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  directory: 'references/scraping/cache',
  ttlSeconds: 86400 * 7, // 7 days
  enableEtagMatching: true,
  enableChecksumMatching: true,
};

/**
 * Media extraction configuration
 */
export const MEDIA_CONFIG = {
  maxUrlsPerPage: 100, // Don't extract more than 100 URLs per page
  useImageFingerprint: true,
  placeholderMinSize: { width: 100, height: 100 },
};

/**
 * Scraping options for generic engine
 */
export const GENERIC_SCRAPING_OPTIONS = {
  dynamic: true, // Use JavaScript rendering (asp=true for Scrapfly)
  premium: false, // Standard proxy pool
  country: 'br', // Brazil
};
