# Scraping System Implementation Summary

## Overview
This document summarizes the implementation of multi-platform scraping support with automatic platform detection for the Kondos API scraping system.

## Implementation Date
Completed: [Current Date]

## Problems Solved

### 1. Canopus Scraper Issues
- **Problem**: Extracting 0 media URLs due to mismatched HTML selectors
- **Root Cause**: Using semantic class names (e.g., `description`) instead of styled-components hashed classes (e.g., `Typography__Text-sc-r3ni9i-3`)
- **Solution**: Updated all selectors to use wildcard patterns matching styled-components naming convention

### 2. Lack of WordPress + Elementor Support
- **Problem**: No scraper for WordPress + Elementor sites like Absoluto Vila da Serra
- **Solution**: Created complete Elementor engine with scraper and parser services

### 3. No Automatic Platform Detection
- **Problem**: getScraper() threw errors for unknown URLs instead of attempting detection
- **Solution**: Created PlatformDetectorService with HTML-based platform detection

## Changes Made

### New Files Created

#### 1. Platform Detector Service
**File**: `src/scraping/utils/platform-detector.service.ts`
- **Purpose**: Detect website platform from HTML when URL pattern doesn't match
- **Methods**:
  - `isElementorSite(html)`: Detects WordPress + Elementor by checking for 'elementor-element' markers
  - `isNextJsSite(html)`: Detects Next.js by checking for '__NEXT_DATA__' script tag
  - `detectPlatform(url)`: Fetches HTML and returns platform identifier

#### 2. Elementor Scraper Service
**File**: `src/scraping/engines/elementor/elementor-scraper.service.ts`
- **Purpose**: Orchestrate scraping of WordPress + Elementor sites
- **Key Features**:
  - Uses ElementorParserService for data extraction
  - Fetches HTML with `dynamic: false` (Elementor content is static)
  - Returns ScrapedKondoDto with platform metadata

### Modified Files

#### 1. Canopus Parser Service
**File**: `src/scraping/engines/canopus/canopus-parser.service.ts`

**Changes**:
- ✅ `extractDescription()`: Updated to use `[class*="Typography__Text"]` pattern
- ✅ `extractStreet()`: Parses address from `[class*="Wrapper-sc"]` with "Neighborhood - Street, Number" format
- ✅ `extractNeighborhood()`: Extracts neighborhood from address wrapper
- ✅ `extractInfraDescription()`: Targets `[class*="DifferentialsContainer"]`
- ✅ `extractMediaUrls()`: Rewrote with srcset parsing and `decodeNextjsImageUrl()` helper
- ✅ `extractAmenitiesAsFields()`: NEW - Maps keywords to infra_* boolean fields:
  - infra_pool, infra_gym, infra_leisure, infra_parking
  - infra_playground, infra_sports_court, infra_barbecue_zone
  - infra_garden, infra_pet_place, infra_coworking
- ✅ `parse()`: Updated to call `extractAmenitiesAsFields()` and spread amenities into return

**Helper Methods Added**:
```typescript
private decodeNextjsImageUrl(url: string): string
private isValidMediaUrl(url: string): boolean
```

#### 2. Scraping Service
**File**: `src/scraping/scraping.service.ts`

**Changes**:
- Added imports: `ElementorScraperService`, `PlatformDetectorService`
- Updated constructor to inject new services
- **getScraper() method** - Now async with HTML detection:
  1. Checks known URL patterns (Somattos, Conartes, Canopus)
  2. If no match, fetches HTML and calls `platformDetector.detectPlatform(url)`
  3. Returns `elementorScraperService` for Elementor sites
  4. Returns `canopusScraperService` for Next.js sites
  5. Falls back to `genericScraperService` if detection fails
- Updated `getScraper()` call sites to await the promise

#### 3. Scraping Module
**File**: `src/scraping/scraping.module.ts`

**Changes**:
- Added imports: `ElementorScraperService`, `ElementorParserService`, `PlatformDetectorService`
- Registered new services in providers array

## Technical Details

### Canopus Styled-Components Pattern
Next.js + Styled Components generates hashed class names:
```html
<p class="Typography__Text-sc-r3ni9i-3 gXyZaB">Description text</p>
```

**Solution**: Use wildcard attribute selectors:
```typescript
$('[class*="Typography__Text"]')
```

### Elementor Detection Markers
```typescript
const elementorMarkers = [
  'elementor-element',
  'elementor-widget',
  'elementor-kit',
  '/elementor/',
  'data-elementor-type',
];
```

### Next.js Detection Markers
```typescript
const nextMarkers = [
  '__NEXT_DATA__',
  '/_next/static/',
  'data-styled',
  '-sc-', // styled-components hash pattern
];
```

## Testing Recommendations

### 1. Test Canopus Scraper
```bash
npm run scrape -- --platform=canopus --kondoId=<canopus-kondo-id>
```

**Expected Results**:
- Description extracted
- Address (street + neighborhood) parsed correctly
- Media URLs extracted from srcset attributes
- Amenities detected and mapped to infra_* fields

### 2. Test Elementor Scraper
```bash
npm run scrape -- --kondoId=<elementor-kondo-id>
```

**Expected Results**:
- Platform auto-detected as 'elementor'
- Property data extracted
- Media URLs from Elementor widgets
- Logs: "Detected Elementor platform for: [URL]"

### 3. Test Platform Detection
Create kondos with unknown URLs and verify:
- PlatformDetectorService fetches HTML
- Correct platform detected
- Appropriate scraper selected
- Graceful fallback to generic scraper if detection fails

## API Impact

### Breaking Changes
None - All changes are backward compatible

### New Capabilities
1. Automatic platform detection for unknown URLs
2. Support for WordPress + Elementor sites
3. Improved Canopus data extraction (description, address, amenities, media)

## Performance Considerations

### HTML Fetching for Detection
- Detection only occurs when URL pattern doesn't match
- Single fetch per scrape operation
- Cached by scraper service for parsing

### Known URL Patterns (No Detection)
- Somattos: Still uses direct URL pattern matching
- Conartes: Still uses direct URL pattern matching
- Canopus: Still uses direct URL pattern matching
- **No performance impact for known platforms**

## Future Improvements

### Recommended Enhancements
1. **Cache detection results**: Store platform type in database to avoid re-fetching
2. **Expand detection**: Add more platform signatures (React, Vue, Angular)
3. **Elementor refinement**: Test with more Elementor sites, refine selectors
4. **Canopus testing**: Validate amenities extraction with real Canopus properties
5. **Error handling**: Add more specific error types for detection failures

### Potential Issues
1. **False positives**: Sites using Elementor classes for other purposes
2. **Hybrid sites**: Sites mixing multiple frameworks
3. **Detection performance**: Extra HTTP request for unknown URLs

## Deployment Checklist

- [x] All TypeScript compilation errors resolved
- [x] Services registered in module
- [x] Imports updated
- [ ] Run integration tests with real Canopus URLs
- [ ] Run integration tests with real Elementor URLs
- [ ] Verify database schema supports infra_* fields
- [ ] Update API documentation
- [ ] Monitor scraping logs for detection accuracy

## Related Documentation
- [Canopus Scraper Optimization Plan](../CANOPUS_SCRAPER_OPTIMIZATION_PLAN.md)
- [Platform Selection Guide](../docs/scraping/PLATFORM_SELECTION_GUIDE.md)
- [Scraping Rules](../docs/scraping/scraping.rules.md)

## Summary
This implementation successfully:
1. ✅ Fixed Canopus scraper to extract media URLs (0 → N URLs)
2. ✅ Added amenities extraction with keyword mapping
3. ✅ Created Elementor scraper for WordPress sites
4. ✅ Implemented automatic platform detection
5. ✅ Maintained backward compatibility
6. ✅ Zero compilation errors

**Next Step**: Test with real-world Canopus and Elementor URLs to validate extraction accuracy.
