# Scraping Module - Quick Start Guide

## Installation

### 1. Install Dependencies

**Note:** Requires Node.js 24.11.0 and npm 11.x

```bash
npm install cheerio @types/cheerio
```

### 2. Environment Setup

Add to your `.env` file:

```env
# ScrapingDog API Key (already added)
SCRAPINGDOG_API_KEY=693728784788b65c56a68168

# Optional: Retry configuration (defaults shown)
SCRAPING_RETRY_MAX_ATTEMPTS=3
SCRAPING_RETRY_DELAY_MS=1000
SCRAPING_RETRY_BACKOFF=2
```

### 3. Database Preparation

The `SCRAPING` status has already been added to `KondoStatus` enum:

```typescript
export const KondoStatus = Object.freeze({
    DRAFT: 'draft',
    TEXT_READY: 'text_ready',
    MEDIA_GATHERING: 'media_gathering',
    DONE: 'done',
    SCRAPING: 'scraping',  // ✅ Already added
});
```

## Usage

### Quick Test

1. **Set a kondo to scraping status:**
   ```sql
   UPDATE kondos 
   SET status = 'scraping', 
       url = 'https://somattos.com.br/empreendimentos/mira'
   WHERE id = 1;
   ```

2. **Run dry-run test:**
   ```bash
   npm run scrape:dry -- --verbose
   ```

3. **If successful, run actual scrape:**
   ```bash
   npm run scrape
   ```

### Commands Available

```bash
# Scrape all pending kondos
npm run scrape

# Dry run (no DB writes)
npm run scrape:dry

# Scrape with options
npm run scrape -- --platform=somattos --verbose
npm run scrape -- --kondo-id=123
```

## What Gets Scraped

From Somattos pages, the module extracts:

### Kondo Data
- ✅ Name
- ✅ Description  
- ✅ Type (casas, chacaras, predios)
- ✅ Slug (auto-generated)
- ✅ Address (street, neighborhood, city, state)
- ✅ Financial info (prices, financing)
- ✅ Infrastructure description
- ✅ Conveniences (pool, gym, security, etc.)

### Media
- ✅ Property images (JPG, PNG, WebP)
- ✅ Videos (MP4, YouTube/Vimeo embeds)
- ❌ UI elements filtered out (logos, icons, buttons)

## Expected Output

```
==================================================
🕷️  Kondos API - Web Scraping Tool
==================================================

🔍 Scraping: Mirá (ID: 1)
   URL: https://somattos.com.br/empreendimentos/mira
✅ Success: Mirá

==================================================
📊 Scraping Summary
==================================================
✅ Success:  1
❌ Failed:   0
⏭️  Skipped:  0
==================================================
```

## Status Flow

```
SCRAPING (before) → scrape → MEDIA_GATHERING (after) → ... → DONE
```

After scraping:
- Kondo status changes to `MEDIA_GATHERING`
- Media records are created with status `draft`
- Ready for next phase (media download/CDN upload)

## Troubleshooting

### Node Version Mismatch
```
npm error engine Unsupported engine
```
**Solution:** Use Node.js 24.11.0 and npm 11.x

### Missing Cheerio
```
Cannot find module 'cheerio'
```
**Solution:** Run `npm install cheerio @types/cheerio`

### ScrapingDog API Error
```
Invalid ScrapingDog API key
```
**Solution:** Verify `SCRAPINGDOG_API_KEY` in `.env`

### No Kondos Found
```
Found 0 kondos to scrape
```
**Solution:** 
- Check DB for kondos with `status = 'scraping'`
- Ensure `url` field is not null

## Next Steps

See full documentation in `src/scraping/README.md` for:
- Architecture details
- Adding new platforms
- Advanced configuration
- API reference
