# Canopus Scraper Optimization Plan

**Date:** December 10, 2025  
**Status:** PENDING IMPLEMENTATION  
**Priority:** HIGH - Critical fixes needed for basic field extraction  

---

## Executive Summary

The Canopus scraper is failing to extract data due to **mismatched HTML selectors**. The site uses Next.js + React + Styled-Components, but the parser assumes static semantic HTML classes that don't exist.

**Key Finding:** The site is "scrapable without heavy tooling" (per analysis) - it's server-rendered with data present in HTML. We just need better selectors and proper attribute parsing.

**Expected Outcome:** After fixes, should extract 20+ images, all property fields (name, address, description, amenities, etc.)

---

## Problem Analysis

### Current State: 0 Media URLs Extracted
From last scrape log (2025-12-10-202450.log):
```
✗ Extracted 0 media URLs from Infinity Art Residence [Kondo 198]
✗ description: null → ""
✗ city: "Santo Antonio" → "Belo Horizonte" 
✗ neighborhood: null → ""
✗ address_street_and_numbers: null → ""
✗ infra_description: null → ""
```

### Root Causes

#### 1. Semantic HTML Mismatch ⚠️
**Assumption:** Parser looks for static CSS classes
```typescript
$('.address, .endereco, .localizacao')      // ← Doesn't exist
$('[class*="price"], .valor, .preco')       // ← Doesn't exist
$('.diferenciais, .amenities, .items')      // ← Doesn't exist
```

**Reality:** All classes are styled-components hashes
```html
<h1 class="Typography__HeadingH1-sc-r3ni9i-0 ggMDcF">...</h1>
<span class="styles__Wrapper-sc-1u6kgc0-0 ixHgne">...</span>
<div class="styles__DifferentialsContainer-sc-1foi038-1 jFjGDw">...</div>
```

#### 2. Image Extraction Strategy Wrong ⚠️
**Current Code:** Looks for `img.src` with placeholder-safe filtering
```typescript
$('img').each((_, el) => {
  const src = $(el).attr('src') || $(el).attr('data-src');
  // Gets data:image/svg+xml;base64,... ← useless placeholder
});
```

**Reality:** Real images are in `srcSet` attributes with Next.js optimized URLs
```html
<img srcSet="/_next/image?url=https%3A%2F%2Fd1o0fuw54avhiz.cloudfront.net%2F...&w=1920&q=50 1x, ..." />
```

#### 3. Address Structure Not Recognized ⚠️
**Current Code:** Looks for `.address` class
```typescript
const selectors = ['.address', '.endereco', '.localizacao'];
```

**Reality:** Address is in custom span wrapper with text format
```html
<span class="styles__Wrapper-sc-1u6kgc0-0 ixHgne">
  <svg><!-- Location icon --></svg>
  <span>Santo Antônio - Rua São Domingos do Prata, 570</span>
</span>
```
**Format:** `"<NEIGHBORHOOD> - <STREET_NAME>, <NUMBER>"`

#### 4. Amenities Container Uses Hashed Classes ⚠️
**Current Code:**
```typescript
$('.diferenciais, .amenities, .items').first().text()
```

**Reality:**
```html
<div class="styles__DifferentialsContainer-sc-1foi038-1 jFjGDw">
  <div class="styles__Differential-sc-1foi038-2 kmTxML">
    <!-- Individual amenity -->
  </div>
</div>
```

---

## HTML Structure Analysis

### Location on Page

| Field | Location | Selector Strategy |
|-------|----------|-------------------|
| **name** | `<h1>` heading | Already works ✅ |
| **description** | Meta tag + `<p class="Typography__Text-*">` | Use meta primary, fallback to pattern |
| **address** | `<span class="styles__Wrapper-*">` with text | Extract span, parse " - " delimiter |
| **neighborhood** | Extracted from address | Split address on " - " |
| **price** | Sticky footer `<li>` elements | **NOT VISIBLE** on page (contact-only) |
| **amenities** | `<div class="styles__Differential-*">` items | Target pattern, extract text |
| **images** | `<img srcSet="/_next/image?...">` | Parse srcSet + decode Next.js URLs |
| **videos** | `<iframe>` tags + `<video>` | Standard extraction works |

### Key CSS Class Patterns
```
Typography__* → Text content elements
styles__Wrapper-sc-1u6kgc0-* → Location/address wrapper
styles__DifferentialsContainer-sc-1foi038-* → Amenities container
styles__Differential-sc-1foi038-* → Individual amenity item
```

---

## Solution: Phase-Based Implementation

### Phase 1: Critical Field Fixes (Priority 1)

#### 1.1 Fix Description Extraction
**File:** `src/scraping/engines/canopus/canopus-parser.service.ts`  
**Method:** `extractDescription()`  
**Current Status:** Uses meta tags but body selector is wrong

**Changes:**
- Keep meta tag approach (og:description, description)
- Add pattern-based selector: `[class*="Typography__Text"]`
- Ensure it captures the introductory paragraph

**Code:**
```typescript
private extractDescription($: CheerioRoot): string {
  // Primary: Meta tags (most reliable)
  const og = $('meta[property="og:description"]').attr('content');
  if (og) return og;
  
  const desc = $('meta[name="description"]').attr('content');
  if (desc) return desc;
  
  // Fallback: Find paragraph with Typography class
  const para = $('[class*="Typography__Text"]').filter((i, el) => {
    const text = $(el).text().trim();
    return text.length > 50; // Skip small text
  }).first().text().trim();
  
  return para || '';
}
```

#### 1.2 Fix Address & Neighborhood Extraction
**File:** `src/scraping/engines/canopus/canopus-parser.service.ts`  
**Methods:** `extractStreet()`, `extractNeighborhood()`  

**Changes:**
- Find span with location icon + address text
- Parse format: `"<NEIGHBORHOOD> - <STREET>, <NUMBER>"`
- Extract and return appropriate parts

**Code:**
```typescript
private extractStreet($: CheerioRoot): string {
  // Find span containing address with location icon
  const addressSpan = $('[class*="Wrapper-sc-1u6kgc0"]').text().trim();
  
  if (!addressSpan) return '';
  
  // Format: "Santo Antônio - Rua São Domingos do Prata, 570"
  // We want: "Rua São Domingos do Prata, 570"
  const parts = addressSpan.split(' - ');
  if (parts.length === 2) {
    return parts[1].trim(); // Second part is street + number
  }
  
  return addressSpan;
}

private extractNeighborhood($: CheerioRoot): string {
  // Parse from same address span
  const addressSpan = $('[class*="Wrapper-sc-1u6kgc0"]').text().trim();
  
  if (!addressSpan) return '';
  
  // Extract first part (neighborhood)
  const parts = addressSpan.split(' - ');
  if (parts.length >= 1) {
    return parts[0].trim(); // First part is neighborhood
  }
  
  return '';
}
```

#### 1.3 Fix Infrastructure Description & Extract Amenities
**File:** `src/scraping/engines/canopus/canopus-parser.service.ts`  
**Methods:** `extractInfraDescription()`, `extractAmenities()` (new)  

**Changes:**
- Target styled-components pattern for amenities container
- Extract all text from individual amenity items
- Map keywords to infra_* boolean fields

**Code:**
```typescript
private extractInfraDescription($: CheerioRoot): string {
  // Find amenities container
  const container = $('[class*="DifferentialsContainer"]');
  
  if (container.length === 0) return '';
  
  // Extract all text from children
  const amenityTexts: string[] = [];
  
  container.find('[class*="Differential"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0) {
      amenityTexts.push(text);
    }
  });
  
  return amenityTexts.join(', ');
}

private extractAmenitiesAsFields($: CheerioRoot): Partial<ScrapedKondoDto> {
  const amenities: Partial<ScrapedKondoDto> = {};
  
  // Get all amenity text
  const infraDesc = this.extractInfraDescription($);
  const pageText = $('body').text().toLowerCase();
  const allText = (infraDesc + ' ' + pageText).toLowerCase();
  
  // Amenity keyword map
  const amenityMap = {
    infra_pool: ['piscina', 'pool', 'swimming'],
    infra_gym: ['academia', 'gym', 'fitness', 'ginásio'],
    infra_leisure: ['lazer', 'leisure', 'recreação', 'recreation'],
    infra_parking: ['estacionamento', 'parking', 'garagem', 'garage'],
    infra_playground: ['parquinho', 'playground', 'play area'],
    infra_sports_court: ['quadra', 'court', 'tennis'],
    infra_barbecue_zone: ['churrasqueira', 'bbq', 'grill', 'churrasco'],
    infra_garden: ['jardim', 'garden', 'landscape'],
  };
  
  for (const [field, keywords] of Object.entries(amenityMap)) {
    if (keywords.some(kw => allText.includes(kw))) {
      amenities[field as keyof typeof amenities] = true as any;
    }
  }
  
  return amenities;
}
```

---

### Phase 2: Image Extraction Fix (Priority 2)

#### 2.1 Rewrite Media URL Extraction
**File:** `src/scraping/engines/canopus/canopus-parser.service.ts`  
**Method:** `extractMediaUrls()`  

**Strategy:** 4-tier approach
1. Parse CloudFront URLs from `srcSet` attributes
2. Keep `/_next/image` URLs as valid fallback
3. Extract from video sources
4. Extract from iframes (YouTube, Vimeo)

**Code:**
```typescript
extractMediaUrls(html: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const seenUrls = new Set<string>();

  // Strategy 1: Extract from srcSet (preferred for Next.js)
  $('img[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      // srcSet format: "url1 1x, url2 2x, url3 3x"
      srcset.split(',').forEach(entry => {
        const [url] = entry.trim().split(/\s+/);
        if (url && this.isValidMediaUrl(url)) {
          const decodedUrl = this.decodeNextjsImageUrl(url);
          if (!seenUrls.has(decodedUrl)) {
            urls.push(decodedUrl);
            seenUrls.add(decodedUrl);
          }
        }
      });
    }
  });

  // Strategy 2: Fallback to src attribute
  if (urls.length === 0) {
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && this.isValidMediaUrl(src)) {
        if (!seenUrls.has(src)) {
          urls.push(src);
          seenUrls.add(src);
        }
      }
    });
  }

  // Strategy 3: Video sources
  $('video source[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !seenUrls.has(src)) {
      urls.push(this.normalizeUrl(src));
      seenUrls.add(src);
    }
  });

  // Strategy 4: iframes (YouTube, Vimeo)
  $('iframe[src*="youtube"], iframe[src*="vimeo"]').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !seenUrls.has(src)) {
      urls.push(src);
      seenUrls.add(src);
    }
  });

  return Array.from(urls);
}

/**
 * Decode Next.js image optimization URLs to get direct CloudFront URLs
 * Input: /_next/image?url=https%3A%2F%2Fd1o0fuw54avhiz.cloudfront.net%2F...&w=1920&q=50
 * Output: https://d1o0fuw54avhiz.cloudfront.net/...
 */
private decodeNextjsImageUrl(url: string): string {
  if (!url.includes('/_next/image')) {
    return url; // Not a Next.js URL, return as-is
  }

  try {
    const urlObj = new URL(url, 'https://canopus.com.br');
    const decodedUrl = urlObj.searchParams.get('url');
    if (decodedUrl) {
      return decodeURIComponent(decodedUrl);
    }
  } catch (e) {
    // URL parsing failed, return original
    this.logger.debug(`Failed to parse Next.js image URL: ${url}`);
  }

  return url; // Return original if decoding fails
}

/**
 * Check if URL looks like valid media (not placeholder, icon, etc.)
 */
private isValidMediaUrl(url: string): boolean {
  if (!url) return false;

  // Exclude data URIs and SVGs
  if (url.startsWith('data:')) return false;

  // Exclude icons and logos
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('icon') || lowerUrl.includes('logo')) {
    return false;
  }

  // Include: images, videos, Next.js optimized URLs, CloudFront
  return /\.(jpe?g|png|webp|gif|mp4|webm|mov)(\?|$)/i.test(url) ||
         url.includes('/_next/image') ||
         url.includes('cloudfront');
}
```

---

### Phase 3: Update Parser Main Method

**File:** `src/scraping/engines/canopus/canopus-parser.service.ts`  
**Method:** `parse()`  

**Change:** Call new `extractAmenitiesAsFields()` method

**Code:**
```typescript
parse(html: string): Partial<ScrapedKondoDto> {
  const $ = cheerio.load(html);

  try {
    const name = this.extractName($);
    const amenities = this.extractAmenitiesAsFields($); // NEW
    
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
      
      // New: Amenities extracted as individual fields
      ...amenities,

      status: KondoStatus.DONE,
      active: true,
    };
  } catch (error) {
    this.logger.error(`Error parsing Canopus HTML: ${error.message}`);
    throw error;
  }
}
```

---

### Phase 4: Optional - JSON Data Extraction

**Enhancement:** Extract from embedded `__NEXT_DATA__` JSON script  
**Effort:** Low (15 min)  
**Benefit:** Structured data, more reliable than HTML parsing  

**Implementation:**
- Find `<script id="__NEXT_DATA__" type="application/json">`
- Parse JSON
- Extract property metadata from props
- Use as supplementary/fallback source

**Status:** DEFERRED - implement if time permits

---

## Implementation Order

### Session 1 (Next Session - ~2 hours)
1. ✅ Fix description extraction (Phase 1.1)
2. ✅ Fix address/neighborhood extraction (Phase 1.2)
3. ✅ Fix amenities extraction (Phase 1.3)
4. ✅ Rewrite media URL extraction (Phase 2.1)
5. ✅ Update parser main method (Phase 3)
6. ✅ Test with `npm run scrape -- --kondo-id 198 --dry-run`

### Session 2 (Optional)
1. Add JSON data extraction (Phase 4)
2. Create Next.js-specific parser as reusable template
3. Test with additional Canopus properties

---

## Testing & Validation

### Pre-Implementation
```bash
npm run scrape -- --kondo-id 198 --dry-run
# Expected: 0 media URLs, empty fields
```

### Post-Implementation
```bash
npm run scrape -- --kondo-id 198 --dry-run
# Expected: 20+ media URLs, all fields populated
# Expected in logs:
#   ✓ name: "Infinity Art Residences - BH"
#   ✓ description: "[intro paragraph]"
#   ✓ address: "Rua São Domingos do Prata, 570"
#   ✓ neighborhood: "Santo Antônio"
#   ✓ infra_pool: true (if mentioned)
#   ✓ infra_gym: true (if mentioned)
#   ✓ etc.
```

### Validation Checklist
- [ ] All field extractors return non-empty values where data exists
- [ ] Media count > 10 (property has carousel of 20+ images)
- [ ] No data:// URLs in extracted media
- [ ] No icon/logo URLs in media list
- [ ] Address correctly parsed into street & neighborhood
- [ ] Amenities correctly mapped to infra_* fields
- [ ] Protected fields (name, type) not overwritten
- [ ] Differential changes logged correctly
- [ ] Logs show "X media, Y fields updated"

---

## Key Files to Modify

```
src/scraping/engines/canopus/
├── canopus-parser.service.ts    ← PRIMARY (all methods)
├── canopus-scraper.service.ts   ← Secondary (may need config tweaks)
└── canopus.config.ts            ← No changes needed
```

---

## Dependencies & Prerequisites

- ✅ Cheerio (HTML parsing) - already in use
- ✅ Logger - already available
- ✅ URL class (built-in Node.js) - for Next.js URL decoding
- ✅ ScrapedKondoDto - DTO definition exists

**No external dependencies needed**

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Media URLs extracted | 0 | 20+ |
| Name field | ❌ empty | ✅ "Infinity Art Residences - BH" |
| Address field | ❌ null | ✅ "Rua São Domingos do Prata, 570" |
| Neighborhood | ❌ null | ✅ "Santo Antônio" |
| Description | ❌ empty | ✅ [property intro] |
| Infrastructure | ❌ empty | ✅ [amenities list] |
| Amenities (infra_*) | ❌ all false | ✅ mixed true/false |
| Total fields updated | 6 | 12+ |

---

## Notes & Observations

1. **No Puppeteer/Playwright Needed**  
   - Site is server-rendered, all data in HTML
   - Standard HTML parsing sufficient
   - Scrapfly's JS rendering (`dynamic: true`) as safety net only

2. **Styled-Components Pattern**  
   - All classes are hashed (sc-* format)
   - Use pattern matching: `[class*="ClassName-sc"]`
   - Hashes may change in future builds

3. **Next.js Image Optimization**  
   - Images served through `/_next/image` route
   - Parameters include original CloudFront URL (encoded)
   - Can decode or use as-is (both valid)

4. **Price Not on Page**  
   - Contact form only (not scrapable)
   - Mark as unavailable

5. **Future Considerations**  
   - If Canopus changes build strategy (CSR instead of SSR), scrapers may break
   - Monitor for JSON data endpoints (`/_next/data/...`)
   - Consider caching discovered selectors

---

## Related Issues

- #SCRAPING-CANOPUS: 0 media extraction
- Kondo 198 (Infinity Art Residence) not being scraped properly
- Next.js site scraping strategy

---

## Status Timeline

- **Created:** 2025-12-10 23:30 UTC
- **Status:** PENDING IMPLEMENTATION
- **Next Review:** Tomorrow (2025-12-11)
- **Estimated Implementation Time:** 2 hours
- **Priority:** HIGH (affects all Canopus properties)

---

## Contact & Follow-up

For questions or clarifications before implementation, refer to:
- Canopus HTML structure analysis (in this repo)
- Next.js/Styled-Components documentation
- Cheerio selector reference

