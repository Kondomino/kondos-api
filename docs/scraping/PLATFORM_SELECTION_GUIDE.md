# Scraping Platform Selection Guide

## Overview

The scraping system now supports switching between **ScrapingDog** and **Scrapfly** platforms via environment configuration. This enables seamless migration between providers without code changes.

## Quick Start

### 1. Configure Environment Variables

Add to your `.env` file:

```env
# Platform selection (default: scrapingdog)
SCRAPING_PLATFORM_PROVIDER=scrapfly

# API Keys
SCRAPINGDOG_API_KEY=your_scrapingdog_key_here
SCRAPFLY_API_KEY=your_scrapfly_key_here
```

### 2. Switch Platforms

Simply change the `SCRAPING_PLATFORM_PROVIDER` value:

- `scrapingdog` - Use ScrapingDog (default)
- `scrapfly` - Use Scrapfly

Restart your application for changes to take effect.

## Architecture

### Platform Abstraction

All scrapers now use a **factory pattern** to get the appropriate platform service:

```
BaseScraper
  └─> ScrapingPlatformFactory
        ├─> ScrapingDogService (implements IScrapingPlatform)
        └─> ScrapflyService (implements IScrapingPlatform)
```

### Key Components

1. **IScrapingPlatform** - Common interface for all platforms
   - `fetchHtml(url, options)` - Fetch HTML content
   - `isConfigured()` - Check if API key is present

2. **ScrapingPlatformFactory** - Returns configured platform service
   - Reads `config.platform.provider` from config
   - Falls back to ScrapingDog if Scrapfly not configured

3. **ScrapingPlatformOptions** - Platform-agnostic options
   - `dynamic` - Enable JavaScript rendering
   - `premium` - Use premium/residential proxies
   - `country` - Geo-targeting (e.g., 'br')

## Platform Comparison

### ScrapingDog

**Endpoint:** `https://api.scrapingdog.com/scrape`

**Parameters:**
- `dynamic=true` - JavaScript rendering
- `premium=true` - Premium proxy pool
- `country=br` - Geo-targeting

**Response:** HTML string

### Scrapfly

**Endpoint:** `https://api.scrapfly.io/scrape`

**Parameters:**
- `asp=true` - Anti-scraping protection + JS rendering (equivalent to `dynamic`)
- `proxy_pool=public_residential_pool` - Residential proxies (equivalent to `premium`)
- `country=br` - Geo-targeting

**Response:** 
- `format=text` → HTML string directly
- `format=json` → `{ result: { content: "html" } }`

## Configuration Details

### Global Config Structure

```typescript
{
  platform: {
    provider: 'scrapingdog' | 'scrapfly'
  },
  scrapfly: {
    apiKey: process.env.SCRAPFLY_API_KEY
  },
  delay: {
    betweenRequestsMs: 4000
  },
  media: {
    relevanceScoreThreshold: 0.7,
    autoApproveMinWidth: 420,
    autoApproveMinHeight: 420,
    downloadBatchSize: 4
  }
}
```

### Engine Configurations

All scrapers use platform-agnostic options:

**Somattos:**
```typescript
{
  dynamic: true,   // JavaScript rendering required
  premium: false,  // Standard proxies
  country: 'br'    // Brazilian servers
}
```

**Conartes:**
```typescript
{
  dynamic: true,
  premium: false,
  country: 'br'
}
```

**Canopus:**
```typescript
{
  dynamic: true,
  premium: false,
  country: 'br'
}
```

## Error Handling

Both services handle common errors:

- **401** - Invalid API key
- **429** - Rate limit exceeded
- **400** - Invalid URL/parameters
- **422** (Scrapfly only) - Scrape failed (site blocked)
- **500** - Provider internal error

### Fallback Strategy

If Scrapfly is selected but not configured (missing API key), the factory automatically falls back to ScrapingDog:

```
[ScrapingPlatformFactory] Scrapfly not configured, falling back to ScrapingDog
```

## Migration Guide

### From ScrapingDog to Scrapfly

1. **Get Scrapfly API key** from https://scrapfly.io

2. **Add to `.env`:**
   ```env
   SCRAPFLY_API_KEY=your_key_here
   SCRAPING_PLATFORM_PROVIDER=scrapfly
   ```

3. **Restart application** - no code changes needed

4. **Verify logs:**
   ```
   [ScrapingPlatformFactory] Using scraping platform: scrapfly
   ```

### Testing Both Platforms

Keep both API keys in `.env` and toggle the provider:

```bash
# Test with ScrapingDog
SCRAPING_PLATFORM_PROVIDER=scrapingdog npm run scraping:run

# Test with Scrapfly
SCRAPING_PLATFORM_PROVIDER=scrapfly npm run scraping:run
```

## Extending with New Platforms

To add a new platform (e.g., BrightData, Oxylabs):

1. **Create service** implementing `IScrapingPlatform`:
   ```typescript
   @Injectable()
   export class NewPlatformService implements IScrapingPlatform {
     async fetchHtml(url: string, options?: ScrapingPlatformOptions): Promise<string> {
       // Implementation
     }
     isConfigured(): boolean {
       // Check API key
     }
   }
   ```

2. **Update factory** to include new platform:
   ```typescript
   case 'newplatform':
     return this.newPlatformService;
   ```

3. **Register in module:**
   ```typescript
   providers: [
     NewPlatformService,
     // ...
   ]
   ```

4. **Add config type:**
   ```typescript
   type ScrapingPlatformProvider = 'scrapingdog' | 'scrapfly' | 'newplatform';
   ```

## Troubleshooting

### "ScrapingDog not configured - scraping will fail"
- Add `SCRAPINGDOG_API_KEY` to `.env`

### "Scrapfly not configured, falling back to ScrapingDog"
- Add `SCRAPFLY_API_KEY` to `.env` if you want to use Scrapfly

### "Property 'scrapingDogService' does not exist"
- Old code - scrapers now use `platformService` instead
- Verify all scrapers extend `BaseScraper` correctly

### Rate limit errors (429)
- Increase `SCRAPING_DELAY_BETWEEN_REQUESTS_MS` (default: 4000)
- Consider upgrading API plan
- Use `skipDelay: true` option sparingly (testing only)

## Related Files

- `src/config/scraping.config.ts` - Global configuration
- `src/scraping/interfaces/scraping-platform.interface.ts` - Platform contract
- `src/scraping/core/scraping-platform.factory.ts` - Platform selector
- `src/scraping/core/scrapingdog.service.ts` - ScrapingDog implementation
- `src/scraping/core/scrapfly.service.ts` - Scrapfly implementation
- `src/scraping/core/base-scraper.ts` - Base scraper using factory
