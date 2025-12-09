# Adobe PDF Service Integration Test - Quick Start

## What Was Created

### 1. **Enhanced Service with Logging** 
📄 `src/whatsapp/services/adobe-pdf.service.ts`
- Added comprehensive logging tags to all extraction phases
- Logging covers: ZIP parsing, JSON extraction, table extraction, image extraction, cleanup
- All logs prefixed with `[TAG]` for easy filtering

### 2. **Integration Test Suite**
📄 `src/whatsapp/services/specs/adobe-pdf.service.integration.spec.ts`
- Tests all 3 PDF files sequentially: Hyde_Park_Skin.pdf, mirrage.pdf, BurleMarx.pdf
- Validates extraction capabilities: text, tables, images
- Error handling tests (invalid PDFs, network issues)
- Temp file cleanup verification
- Comprehensive logging validation

### 3. **Output Documentation**
📄 `docs/PDF_EXTRACTION_OUTPUT_STRUCTURE.md`
- Detailed folder structure diagram
- Explains where all outputs go
- Storage capacity estimates
- Performance metrics format

---

## 🎯 Output Locations

| Content | Location | Lifetime | Status |
|---------|----------|----------|--------|
| **PDF Copy** | `./temp/{messageId}_{uuid}.pdf` | ~5-30sec | Auto-deleted ✓ |
| **Result ZIP** | `./temp/extraction_{uuid}.zip` | ~2-5sec | Auto-deleted ✓ |
| **Extracted Text** | `./uploads/extracted/{messageId}-text.txt` | Permanent | Saved ✓ |
| **Extracted Tables** | `./uploads/extracted/{messageId}-tables.json` | Permanent | Saved ✓ |
| **Extracted Images** | `./uploads/images/{messageId}-figure-*.png` | Permanent | Saved ✓ |
| **Structured Data** | `./uploads/extracted/{messageId}-structured-data.json` | Permanent | Saved ✓ |
| **Test Results** | `./test-results/pdf-extraction/{pdfName}-result.json` | Permanent | Saved ✓ |

---

## 📋 Test Input Files

All located in `/references/pdfs/`:

1. **Hyde_Park_Skin.pdf** - Architecture/Design document
2. **mirrage.pdf** - General document  
3. **BurleMarx.pdf** - Landscape design document

Each processed sequentially with 500ms delay between them.

---

## 🚀 Running the Tests

```bash
# Run the integration test
npm test -- adobe-pdf.service.integration

# Or more specifically
npm test -- src/whatsapp/services/specs/adobe-pdf.service.integration.spec.ts

# With coverage
npm run test:cov -- adobe-pdf.service.integration

# Watch mode
npm run test:watch -- adobe-pdf.service.integration
```

---

## 📊 What Gets Logged

### Service Logs (with [TAG] format)

**During Download Phase:**
```
[PDF-DOWNLOAD] Fetching PDF from WhatsApp servers...
[PDF-DOWNLOAD] Response received: 200 (2048576 bytes)
[PDF-DOWNLOAD] Download successful: 2048576 bytes
```

**During Extraction:**
```
[PDF-EXTRACT-BUFFER] Starting buffer-based extraction: messageId=...
[PDF-EXTRACT-BUFFER] Buffer size: 2048576 bytes
[ADOBE-API] Submitting extraction job to Adobe PDF Services
[ADOBE-API] Job submitted, polling for results...
[ADOBE-API] Job completed successfully
```

**During ZIP Parsing:**
```
[ZIP-PARSE] Starting ZIP extraction: /path/to/extraction_uuid.zip
[ZIP-PARSE] ZIP file size: 524288 bytes
[ZIP-PARSE] Extracting ZIP contents...
[JSON-PARSE] Looking for structuredData.json in ZIP...
[TABLE-EXTRACT] Extracting tables from structured data...
[TABLE-EXTRACT] Found 3 tables
[TABLE-EXTRACT] Table 0: rows=5, cols=3
[TEXT-EXTRACT] Extracting text from structured data...
[TEXT-EXTRACT] Text extracted: 45230 characters
[IMAGE-EXTRACT] Extracting images from figures/ folder...
[IMAGE-EXTRACT] Found 5 images
[IMAGE-EXTRACT] Image 0: size=2097152 bytes
```

**During Cleanup:**
```
[CLEANUP] Removing temporary PDF file: ./temp/test-123_uuid.pdf
[CLEANUP] Temporary PDF file removed successfully
[CLEANUP] Removing temporary ZIP file: ./temp/extraction_uuid.zip
[CLEANUP] Temporary ZIP file removed successfully
```

---

## 📈 Expected Test Output

```
✓ Service Initialization (3 tests)
  ✓ should be defined
  ✓ should initialize with proper logger
  ✓ should have adobePdfEnabled flag

✓ Credentials Testing (1 test)
  ✓ should test credentials successfully or gracefully fail

✓ PDF Extraction from Buffer (3 tests)
  ✓ should extract content from Hyde_Park_Skin.pdf
    📄 Testing PDF: Hyde_Park_Skin.pdf
    File size: 2.45 MB
    ✓ Extraction completed in 23450ms
    
  ✓ should extract content from mirrage.pdf
  ✓ should extract content from BurleMarx.pdf

✓ Error Handling (2 tests)
  ✓ should handle invalid PDF buffer gracefully
  ✓ should handle network errors during extraction

✓ Temp File Cleanup (1 test)
  ✓ should clean up temporary files after extraction

✓ Sequential PDF Processing (1 test)
  ✓ should process all PDFs sequentially without interference

✓ Logging Validation (1 test)
  ✓ should log all key stages of extraction

Test Suites: 1 passed, 1 total
Tests:      12 passed, 12 total
```

---

## 🔍 Inspecting Results

### View test results JSON:
```bash
cat ./test-results/pdf-extraction/Hyde_Park_Skin-result.json
```

### Sample result:
```json
{
  "file": "Hyde_Park_Skin.pdf",
  "timestamp": "2024-11-26T10:30:45.123Z",
  "duration": 23450,
  "result": {
    "success": true,
    "textLength": 45230,
    "tablesCount": 3,
    "imagesCount": 5,
    "error": null
  },
  "metadata": {
    "extractionTime": 23450,
    "elementsFound": 45238,
    "fileSize": 2048576,
    "pageCount": 12
  }
}
```

### Check extracted images:
```bash
ls -lh ./uploads/images/ | grep Hyde_Park
```

### Check extracted text/tables:
```bash
ls -lh ./uploads/extracted/ | grep Hyde_Park
```

---

## 🧹 Cleanup After Tests

```bash
# Remove test results
rm -rf ./test-results/pdf-extraction/

# Remove extracted content (keep if needed for inspection)
rm -rf ./uploads/extracted/*
rm -rf ./uploads/images/*

# Verify temp is clean
ls ./temp/  # Should be empty
```

---

## ⚙️ Key Features

✅ **No Cloud Uploads** - All mocked, runs locally  
✅ **Complete Logging** - Every stage has [TAG] logs  
✅ **Auto Cleanup** - Temp files deleted automatically  
✅ **Error Resilience** - Graceful error handling with detailed logs  
✅ **Sequential Processing** - Tests PDFs one at a time  
✅ **Metadata Tracking** - File sizes, extraction times, element counts  
✅ **Result Persistence** - All outputs saved to disk  

---

## 📝 What Each Test Validates

| Test | Validates |
|------|-----------|
| Service Initialization | Logger setup, credentials flag |
| Credentials Testing | Credential validation mechanism |
| PDF Extraction (×3) | Text/table/image extraction per PDF |
| PDF from URL | Download flow with mocking |
| Invalid PDF | Error handling for corrupt data |
| Network Errors | Error handling for connectivity issues |
| Temp File Cleanup | Automatic cleanup of temporary files |
| Sequential Processing | Multiple PDFs without interference |
| Logging Validation | All key log tags present |

---

## 🆘 Common Issues

**Q: Test times out**  
A: PDFs might be large or network slow. Timeout is set to 60s per PDF.

**Q: No images extracted?**  
A: Check if PDFs have embedded images. Look for `[IMAGE-EXTRACT]` logs.

**Q: Where are the extracted files?**  
A: Check `./uploads/extracted/` and `./uploads/images/`

**Q: Are temp files cleaned up?**  
A: Yes, automatically. Check `./temp/` - should be empty after test.

**Q: Where do logs go?**  
A: Jest console output. Look for `[TAG]` prefixed lines.

