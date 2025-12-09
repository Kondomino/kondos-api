# Scraping Module

Web scraping functionality for extracting real estate (Kondo) data from external platforms.

## 🏗️ Architecture

```
src/scraping/
├── core/                          # Core services
│   ├── scrapingdog.service.ts    # ScrapingDog API integration
│   ├── retry.service.ts          # Retry logic with exponential backoff
│   └── base-scraper.ts           # Abstract base class for scrapers
│
├── engines/                       # Platform-specific implementations
│   └── somattos/                 # Somattos platform
│       ├── somattos-scraper.service.ts
│       ├── somattos-parser.service.ts
│       └── somattos.config.ts
│
├── dto/                          # Data transfer objects
│   ├── scraped-kondo.dto.ts
│   └── scraping-result.dto.ts
│
├── interfaces/                    # TypeScript interfaces
│   ├── scraper-engine.interface.ts
│   └── scraper-config.interface.ts
│
├── scraping.service.ts           # Main orchestration service
├── scraping.command.ts           # CLI command
└── scraping.module.ts            # NestJS module
```

## 🚀 Usage

### Prerequisites

1. **Install dependencies** (requires Node 24.11.0 & npm 11.x):
   ```bash
   npm install cheerio @types/cheerio
   ```

2. **ScrapingDog API Key** must be set in `.env`:
   ```env
   SCRAPINGDOG_API_KEY=your_api_key_here
   ```

### Prepare Kondos for Scraping

1. Set kondos to `scraping` status:
   ```sql
   UPDATE kondos 
   SET status = 'scraping', 
       url = 'https://somattos.com.br/empreendimentos/mira'
   WHERE id = 1;
   ```

2. Ensure the `url` field contains the source URL to scrape.

### Run Scraping

#### Basic Usage
```bash
# Scrape all kondos with status = 'scraping'
npm run scrape
```

#### Advanced Options
```bash
# Dry run (no database writes)
npm run scrape:dry
npm run scrape -- --dry-run

# Scrape specific platform
npm run scrape -- --platform=somattos

# Scrape single kondo by ID
npm run scrape -- --kondo-id=123

# Verbose logging
npm run scrape -- --verbose

# Combine options
npm run scrape -- --platform=somattos --verbose --dry-run
```

## 📊 Output

### Console Output
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

### Database Updates

After successful scraping:

1. **Kondo record** is updated with scraped data:
   - name, description, type
   - address fields (street, neighborhood, city)
   - financial info (prices, financing)
   - infrastructure/conveniences
   - status changes to `MEDIA_GATHERING`

2. **Media records** are created:
   - Each image/video URL becomes a Media record
   - Linked to the Kondo via `kondoId`
   - Status set to `draft`
   - Type auto-detected (image/video)

## 🔧 Configuration

### Environment Variables

```env
# Required
SCRAPINGDOG_API_KEY=your_api_key_here

# Optional (with defaults)
SCRAPING_RETRY_MAX_ATTEMPTS=3
SCRAPING_RETRY_DELAY_MS=1000
SCRAPING_RETRY_BACKOFF=2
```

### ScrapingDog Options

Default configuration per platform:

**Somattos:**
- `dynamic: true` - JavaScript rendering enabled
- `premium: false` - Standard proxy pool
- `country: 'br'` - Brazilian geo-targeting

## 🧩 Adding New Platforms

To add support for a new platform (e.g., 5andar):

1. **Create engine directory:**
   ```
   src/scraping/engines/5andar/
   ```

2. **Implement parser service:**
   ```typescript
   // 5andar-parser.service.ts
   @Injectable()
   export class AndarParserService {
     parse(html: string): Partial<ScrapedKondoDto> { ... }
     extractMediaUrls(html: string): string[] { ... }
   }
   ```

3. **Implement scraper service:**
   ```typescript
   // 5andar-scraper.service.ts
   @Injectable()
   export class AndarScraperService extends BaseScraper {
     platform = '5andar';
     // ... implement abstract methods
   }
   ```

4. **Register in module:**
   ```typescript
   // scraping.module.ts
   providers: [
     // ... existing
     AndarParserService,
     AndarScraperService,
   ]
   ```

5. **Add platform detection:**
   ```typescript
   // scraping.service.ts
   private getScraper(url: string) {
     if (isSomattosUrl(url)) return this.somattosScraperService;
     if (is5AndarUrl(url)) return this.andarScraperService; // NEW
     throw new Error(`No scraper found for URL: ${url}`);
   }
   ```

## 🛠️ How It Works

### Scraping Flow

```
1. Find Kondos
   └─ Query DB for kondos with status='scraping' and url IS NOT NULL

2. For Each Kondo:
   ├─ Detect Platform (from URL pattern)
   ├─ Get Appropriate Scraper
   │
   ├─ Scrape with Retry Logic:
   │  ├─ Fetch HTML via ScrapingDog API
   │  ├─ Parse HTML with Cheerio
   │  ├─ Extract Kondo fields
   │  └─ Extract Media URLs
   │
   └─ Save Results:
      ├─ Update Kondo record
      ├─ Create Media records
      └─ Change status to 'MEDIA_GATHERING'

3. Log Summary
```

### Retry Mechanism

- **Max attempts:** 3 (configurable)
- **Backoff strategy:** Exponential
  - Attempt 1 fails → wait 1s
  - Attempt 2 fails → wait 2s
  - Attempt 3 fails → abort
- **Retryable errors:** Network issues, timeouts, 5xx errors
- **Non-retryable:** 400 Bad Request, 401 Unauthorized

## 🧪 Testing

### Manual Testing

1. **Create test kondo:**
   ```sql
   INSERT INTO kondos (name, status, url) 
   VALUES ('Test Kondo', 'scraping', 'https://somattos.com.br/empreendimentos/mira');
   ```

2. **Run dry-run scrape:**
   ```bash
   npm run scrape:dry -- --kondo-id=<id> --verbose
   ```

3. **Verify output** in console logs

4. **Run actual scrape:**
   ```bash
   npm run scrape -- --kondo-id=<id>
   ```

5. **Check database** for updated data

### Troubleshooting

**Issue: "No scraper found for URL"**
- Verify URL matches platform pattern
- Check `isSomattosUrl()` in `somattos.config.ts`

**Issue: "SCRAPINGDOG_API_KEY not found"**
- Add key to `.env` file
- Restart application

**Issue: "Rate limit exceeded (429)"**
- ScrapingDog API limit reached
- Wait or upgrade plan

**Issue: Parsing returns incomplete data**
- HTML structure may have changed
- Update selectors in `somattos-parser.service.ts`
- Run with `--verbose` to debug

## 📝 Notes

- **Status Flow:** `scraping` → `MEDIA_GATHERING` → `done`
- **Media URLs:** Stored as-is, not downloaded (CDN upload is separate process)
- **Idempotency:** Safe to re-run on same kondo (will update existing data)
- **Performance:** ScrapingDog handles proxy rotation and rate limiting
- **Cost:** Each scrape = 1 ScrapingDog API credit

## 🔮 Future Enhancements

- [ ] Add more platforms (5andar, VivaReal, ZAP)
- [ ] Implement search-based scraping (not just direct URLs)
- [ ] Add scheduling (cron jobs)
- [ ] Download and upload media to CDN
- [ ] Track price/availability changes over time
- [ ] Webhook notifications on completion
- [ ] Web UI for managing scraping jobs

## 📚 References

- [ScrapingDog API Docs](https://docs.scrapingdog.com/)
- [Cheerio Documentation](https://cheerio.js.org/)
- [NestJS Commander](https://docs.nestjs.com/recipes/nest-commander)
