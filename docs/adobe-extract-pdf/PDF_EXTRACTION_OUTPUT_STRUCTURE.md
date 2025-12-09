# PDF Extraction Output Structure

## Overview
This document describes the directory structure and output locations for the Adobe PDF Service integration test and extraction process.

---

## 📁 Output Directory Structure

```
kondos-api/
├── uploads/                          # Main output directory for extracted content
│   ├── extracted/                    # Extracted structured data (JSON, text)
│   │   ├── {messageId}-structured-data.json
│   │   ├── {messageId}-text.txt
│   │   └── {messageId}-tables.json
│   │
│   ├── images/                       # Extracted images and figures
│   │   ├── {messageId}-figure-001.png
│   │   ├── {messageId}-figure-002.jpg
│   │   ├── {messageId}-table-001-render.png
│   │   └── ...
│   │
│   ├── documents/                    # Original uploaded documents
│   └── videos/                       # Video files (if applicable)
│
├── temp/                             # Temporary working directory (AUTO-CLEANED)
│   ├── {messageId}_{uuid}.pdf       # Temp PDF copy (DELETED after processing)
│   ├── extraction_{uuid}.zip        # Adobe API result ZIP (DELETED after parsing)
│   └── ...
│
├── test-results/
│   └── pdf-extraction/              # Integration test results
│       ├── Hyde_Park_Skin-result.json
│       ├── mirrage-result.json
│       └── BurleMarx-result.json
│
└── logs/                             # Application logs (if configured)
    └── pdf-extraction-{date}.log
```

---

## 🎯 Specific Output Locations

### 1. **Extracted Content** (`./uploads/extracted/`)
**Purpose**: Store parsed and structured data from PDFs

- **structuredData.json**: Complete parsed output from Adobe PDF Extract API
  ```json
  {
    "documentStructure": { ... },
    "elements": [ ... ],
    "tables": [ ... ],
    "metadata": { "pageCount": 5, ... }
  }
  ```

- **text.txt**: Plain text extraction from all pages
  - File size: Varies by PDF content
  - Encoding: UTF-8
  - Format: Raw text with page breaks

- **tables.json**: Structured table data
  ```json
  [
    {
      "tableIndex": 0,
      "pageNumber": 2,
      "rows": 5,
      "columns": 3,
      "data": [ ... ]
    }
  ]
  ```

**Where it goes during extraction:**
```
During processing:
1. Adobe API returns ZIP file
2. ZIP saved to: ./temp/extraction_{uuid}.zip
3. Contents parsed
4. JSON/text saved to: ./uploads/extracted/{messageId}-*
5. ZIP file deleted from ./temp/
```

---

### 2. **Extracted Images** (`./uploads/images/`)
**Purpose**: Store all figures, images, and table renderings extracted from PDFs

**File naming convention:**
- Figures: `{messageId}-figure-{pageNumber}-{index}.{format}`
- Table renderings: `{messageId}-table-{tableIndex}-render.{format}`
- Diagrams: `{messageId}-diagram-{index}.{format}`

**Supported formats:**
- PNG (most common for documents)
- JPG/JPEG
- TIFF (for high-resolution scans)

**Size considerations:**
- Typical figure: 100KB - 5MB each
- Depends on PDF quality and original image resolution
- Highly variable across different PDFs

**Example output:**
```
uploads/images/
├── test-20231126-001-Hyde_Park_Skin-figure-001.png    (2.3 MB)
├── test-20231126-001-Hyde_Park_Skin-figure-002.png    (1.8 MB)
├── test-20231126-001-Hyde_Park_Skin-table-001-render.png (512 KB)
├── test-20231126-002-mirrage-figure-001.jpg            (3.1 MB)
└── test-20231126-003-BurleMarx-figure-001.png         (1.5 MB)
```

---

### 3. **Temporary Files** (`./temp/`) - AUTO-CLEANED
**Purpose**: Intermediate processing files (automatically removed)

**Files created and deleted:**
1. **PDF copy**: `{messageId}_{uuid}.pdf`
   - Created: When buffer extracted to disk for Adobe SDK
   - Deleted: After Adobe job submission ✓

2. **Result ZIP**: `extraction_{uuid}.zip`
   - Created: Adobe API returns ZIP with results
   - Contains: `structuredData.json`, `figures/`, renditions/
   - Deleted: After contents parsed ✓

**Cleanup flow:**
```typescript
// Service automatically cleans up:
await fs.promises.unlink(tempPdfPath);           // ✓ Deleted
await fs.promises.unlink(extractionZipPath);    // ✓ Deleted
```

**Cleanup logs:**
```
[CLEANUP] Removing temporary PDF file: ./temp/test-123_uuid.pdf
[CLEANUP] Temporary PDF file removed successfully
[CLEANUP] Removing temporary ZIP file: ./temp/extraction_uuid.zip
[CLEANUP] Temporary ZIP file removed successfully
```

---

### 4. **Test Results** (`./test-results/pdf-extraction/`)
**Purpose**: Store integration test execution results

**Result file format:** `{pdfName}-result.json`

**Sample output:**
```json
{
  "file": "Hyde_Park_Skin.pdf",
  "timestamp": "2024-11-26T10:30:45.123Z",
  "duration": 2543,
  "result": {
    "success": true,
    "textLength": 45230,
    "tablesCount": 3,
    "imagesCount": 5,
    "error": null
  },
  "metadata": {
    "extractionTime": 2543,
    "elementsFound": 45238,
    "fileSize": 2048576,
    "pageCount": 12
  }
}
```

---

## 📊 Processing Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Input: PDF File (./references/pdfs/*.pdf)              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Read PDF from references/  │
    │ Create buffer             │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Copy to temp/              │
    │ {messageId}_{uuid}.pdf    │
    │ [LOGGED: PDF-DOWNLOAD]     │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Submit to Adobe API        │
    │ [LOGGED: ADOBE-API]        │
    │ Wait for job completion    │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Download result ZIP        │
    │ Save to temp/              │
    │ extraction_{uuid}.zip      │
    │ [LOGGED: ADOBE-API]        │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────────┐
    │ Parse ZIP contents                      │
    │ [LOGGED: ZIP-PARSE]                     │
    └────────────┬────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
    ┌──────────┐  ┌──────────────────────┐
    │ Extract  │  │ Extract images from  │
    │ text     │  │ figures/ folder      │
    │ [TEXT]   │  │ [IMAGE-EXTRACT]      │
    │          │  │                      │
    │ Extract  │  └──────┬───────────────┘
    │ tables   │         │
    │ [TABLE]  │         ▼ Buffers saved to
    │          │    ./uploads/images/
    └────┬─────┘
         │
         ▼
    ┌─────────────────────────────────────────┐
    │ Save parsed data:                       │
    │ - uploads/extracted/*.json              │
    │ - uploads/extracted/*.txt               │
    │ [LOGGED: JSON-PARSE, TEXT-EXTRACT]      │
    └────────────┬────────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────────┐
    │ Cleanup temporary files:                │
    │ - Delete temp/{messageId}_{uuid}.pdf    │
    │ - Delete temp/extraction_{uuid}.zip     │
    │ [LOGGED: CLEANUP]                       │
    └────────────┬────────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────────┐
    │ Return PdfExtractionResult:             │
    │ {                                       │
    │   success: true,                        │
    │   text: string,                         │
    │   tables: any[],                        │
    │   images: Buffer[],                     │
    │   metadata: { ... }                     │
    │ }                                       │
    └─────────────────────────────────────────┘
```

---

## 🔍 Log Tags and Locations

All logs appear in the service logger output with standardized tags:

| Tag | Location | Purpose |
|-----|----------|---------|
| `[PDF-EXTRACT]` | Initial extraction call | Download & setup |
| `[PDF-DOWNLOAD]` | Download phase | WhatsApp media fetch |
| `[PDF-EXTRACT-BUFFER]` | Buffer-based extraction | In-memory processing |
| `[ADOBE-API]` | Adobe SDK interaction | Job submission/results |
| `[ZIP-PARSE]` | ZIP extraction | Archive processing |
| `[JSON-PARSE]` | JSON parsing | Structure data |
| `[TABLE-EXTRACT]` | Table extraction | Table parsing details |
| `[TEXT-EXTRACT]` | Text extraction | Text content parsing |
| `[IMAGE-EXTRACT]` | Image extraction | Figure/diagram extraction |
| `[METADATA-EXTRACT]` | Metadata parsing | Page count, etc. |
| `[CLEANUP]` | Cleanup phase | Temp file deletion |

---

## 📈 Storage Capacity

### Per PDF Processing:
- **Temp files**: ~150-500MB (depends on PDF size)
  - Temp duration: ~5-30 seconds (then auto-deleted)
  - No permanent storage

- **Extracted content** (`uploads/extracted/`): 50KB-20MB per PDF
  - JSON files: 10-50% of original PDF size
  - Text files: 5-30% of original PDF size
  - Tables JSON: 1-10MB depending on table complexity

- **Images** (`uploads/images/`): 100KB-1GB+ per PDF
  - Depends entirely on number and resolution of figures
  - Can be the largest storage consumer

### Total per PDF Example:
```
Small PDF (500KB):
- Extracted: ~50KB
- Images: ~5MB
- Temp (during): ~500KB → 0KB
- Total permanent: ~5MB

Large PDF (50MB with many images):
- Extracted: ~10MB
- Images: ~200MB
- Temp (during): ~50MB → 0MB
- Total permanent: ~210MB
```

---

## ⚙️ Running the Integration Test

```bash
# Run the integration test
npm test -- src/whatsapp/services/specs/adobe-pdf.service.integration.spec.ts

# With coverage
npm run test:cov -- src/whatsapp/services/specs/adobe-pdf.service.integration.spec.ts

# Watch mode
npm run test:watch -- adobe-pdf.service.integration
```

### Test Output Includes:
1. **Console logs** with timing information
2. **Test results** in `./test-results/pdf-extraction/`
3. **Service logs** from Logger (all [TAG] messages)
4. **Error handling validation** with graceful failure messages

---

## 🚀 Performance Metrics

Test will output timing for:
- Download time (mocked in tests, ~0ms)
- Adobe API processing time (actual, usually 10-45 seconds per PDF)
- ZIP parsing time (usually 500ms-2 seconds)
- Total extraction time (logged in metadata)

Example output:
```
📄 Testing PDF: Hyde_Park_Skin.pdf
   File size: 2.45 MB
   ✓ Extraction completed in 23450ms
   ✓ Result: success=true
   ✓ Text characters: 45230
   ✓ Tables found: 3
   ✓ Images found: 5
   ✓ File size recorded: 2.45 MB
   ✓ Total elements: 45238
```

---

## 🛠️ Troubleshooting

### No images extracted?
- Check `./uploads/images/` directory
- Verify Adobe API credentials
- Check logs for `[IMAGE-EXTRACT]` messages

### Temp files not cleaning up?
- Files should auto-delete after extraction
- Check `./temp/` directory - should be empty
- Look for `[CLEANUP]` log entries

### Large extracted files?
- Text files: Check for scanned PDFs (more text extracted)
- Images: High-resolution PDFs = larger images
- Check metadata.fileSize vs actual extraction size

### Test results not saved?
- Ensure `./test-results/pdf-extraction/` exists
- Check write permissions on uploads directory
- Verify disk space available

