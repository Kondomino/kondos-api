# Scraping REST API

## Overview

The Scraping module now exposes a REST API endpoint for on-demand scraping of individual kondos with intelligent data quality protection.

## Endpoint

### Scrape Single Kondo

```http
POST /scraping/:kondoId/scrape
```

Scrape a single kondo by ID with smart data merging and quality validation.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kondoId` | number | Yes | ID of the kondo to scrape |

#### Request Body (Optional)

```typescript
{
  "dryRun": boolean,      // Scrape but don't save to database
  "forceEngine": string,  // Force specific scraping engine ('somattos', 'elementor', 'generic')
  "verbose": boolean,     // Include detailed change logs in response
  "skipDelay": boolean    // Skip delay between requests (default: true for API)
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "kondoId": 123,
  "platform": "Elementor",
  "stats": {
    "fieldsUpdated": 8,
    "protectedSkipped": 3,
    "qualityRejected": 2,
    "mediaUploaded": 12,
    "media": {
      "totalDiscovered": 15,
      "imagesDiscovered": 14,
      "videosDiscovered": 1,
      "imagesUploaded": 11,
      "videosDownloaded": 0,
      "videosEmbedded": 1,
      "totalSaved": 12
    }
  },
  "updatedFields": [
    "description",
    "neighborhood",
    "city",
    "lot_avg_price"
  ],
  "rejections": [
    {
      "field": "name",
      "reason": "Protected field 'name' (mode: never)",
      "existingValue": "Beautiful Condo",
      "attemptedValue": "Nice Place"
    },
    {
      "field": "address_street_and_numbers",
      "reason": "Rejected: new value is shorter/less detailed (20 vs 45 chars)",
      "existingValue": "Rua das Flores, 123 - Apt 501",
      "attemptedValue": "Rua das Flores, 123"
    }
  ],
  "featuredImage": "kondo-123-image-001-1704132000000.jpg",
  "validationWarnings": [
    "Field 'condo_rent' has zero value, likely scraping error"
  ],
  "dryRun": false
}
```

#### Error Response (404 Not Found)

```json
{
  "success": false,
  "kondoId": 999,
  "error": "Kondo with ID 999 not found"
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "kondoId": 123,
  "error": "Kondo has no URL to scrape"
}
```

## Data Quality Protection

The API implements a sophisticated data quality system to prevent overwriting good data with poor scraped data:

### Protected Fields System

Fields are protected with three modes:

1. **`never`** - Never allow overwriting (manually curated fields)
   - `name`
   - `url`
   - `highlight`
   - `type`

2. **`if-empty`** - Only update if existing value is empty/null
   - `featured_image`
   - `video`

3. **`quality-check`** - Allow updates but validate quality first
   - `description`
   - `address_street_and_numbers`
   - All other fields (by default)

### Quality Validation Rules

The system automatically rejects updates that would degrade data quality:

| Scenario | Existing | New | Decision | Reason |
|----------|----------|-----|----------|--------|
| Text field | "Beautiful condo with 3 bedrooms" | "" | ❌ REJECT | Never overwrite with empty |
| Text field | "Nice place" | "Beautiful condo with pool" | ✅ ACCEPT | New is more detailed |
| Text field | null | "New description" | ✅ ACCEPT | Filling empty field |
| Number field | 250000 | 0 | ❌ REJECT | Zero likely scraping error |
| Number field | null | 250000 | ✅ ACCEPT | Filling empty field |
| Number field (price) | 250000 | 500000 | ⚠️ REJECT | Suspicious change (>2x) |
| Array field | [1,2,3] | [] | ❌ REJECT | Never replace with empty |
| String length | "Lorem ipsum dolor..." (50 chars) | "Lorem..." (8 chars) | ❌ REJECT | Significant data loss |

### Validation Checks

The system checks for common scraping issues:

- ✅ Placeholder text detection ("lorem ipsum", "teste", "TBD", "coming soon")
- ✅ Suspiciously short values (< 3 characters)
- ✅ Zero values in price fields
- ✅ Negative numbers in non-coordinate fields
- ✅ Type mismatches (string → number)
- ✅ Significant price changes (>2x or <0.5x)

## Examples

### Basic Scraping

```bash
curl -X POST http://localhost:3000/scraping/123/scrape
```

### Dry Run (Preview Changes)

```bash
curl -X POST http://localhost:3000/scraping/123/scrape \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "verbose": true}'
```

### Force Specific Engine

```bash
curl -X POST http://localhost:3000/scraping/123/scrape \
  -H "Content-Type: application/json" \
  -d '{"forceEngine": "elementor"}'
```

### Verbose Mode (Detailed Changes)

```bash
curl -X POST http://localhost:3000/scraping/123/scrape \
  -H "Content-Type: application/json" \
  -d '{"verbose": true}'
```

Response includes detailed `changes` field:

```json
{
  "changes": {
    "description": {
      "before": "Old description",
      "after": "New improved description with more details"
    },
    "lot_avg_price": {
      "before": null,
      "after": 250000
    }
  }
}
```

## Configuration

Protected fields and quality rules can be configured in `src/config/scraping.config.ts`:

```typescript
protectedFields: [
  // Never overwrite
  { field: 'name', mode: 'never' },
  { field: 'url', mode: 'never' },
  
  // Only update if empty
  { field: 'featured_image', mode: 'if-empty' },
  { field: 'video', mode: 'if-empty' },
  
  // Allow with quality checks
  { field: 'description', mode: 'quality-check' },
]
```

## Integration with Existing CLI

The CLI commands (`npm run scrape`) continue to work as before, using a simplified protection system. The API provides enhanced protection and detailed reporting.

## Notes

- **Featured Image Selection**: Automatically selects best-scoring image if no featured image is set
- **Media Filtering**: Same robust media filtering as CLI (relevance scoring, dimensions, file size)
- **Logging**: All operations logged to `logs/scraping-YYYY-MM-DD.log`
- **Idempotent**: Safe to re-run on same kondo (won't degrade data quality)
- **Authentication**: Currently uses `@Public()` decorator - update for production use
