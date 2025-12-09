# 📊 Adobe PDF Service - Output Directory Visual Guide

## Quick Visual Reference

### 🎯 Final Output Structure

```
Your Project Root
│
├── 📁 uploads/ ......................... PERSISTENT STORAGE
│   │
│   ├── 📁 extracted/ .................. Extracted Data
│   │   ├── test-20231126-Hyde_Park_Skin-text.txt
│   │   │   └─ Plain text: 45,230 characters
│   │   ├── test-20231126-Hyde_Park_Skin-tables.json
│   │   │   └─ Structured table data (3 tables)
│   │   ├── test-20231126-Hyde_Park_Skin-structured-data.json
│   │   │   └─ Complete Adobe API response
│   │   ├── test-20231126-mirrage-text.txt
│   │   └── ... (more PDFs)
│   │
│   ├── 📁 images/ ..................... Extracted Figures
│   │   ├── test-20231126-Hyde_Park_Skin-figure-001.png  (2.1 MB)
│   │   ├── test-20231126-Hyde_Park_Skin-figure-002.png  (1.8 MB)
│   │   ├── test-20231126-Hyde_Park_Skin-table-001-render.png
│   │   ├── test-20231126-mirrage-figure-001.jpg
│   │   └── ... (all extracted images)
│   │
│   ├── 📁 documents/ .................. Original uploads
│   └── 📁 videos/ ..................... Video files
│
├── 📁 temp/ ........................... TEMPORARY (AUTO-CLEANED)
│   ├── test-20231126_uuid.pdf ......... DELETED ✓
│   ├── extraction_uuid.zip ............ DELETED ✓
│   └── (all temp files auto-removed)
│
├── 📁 test-results/ ................... TEST METRICS
│   └── 📁 pdf-extraction/
│       ├── Hyde_Park_Skin-result.json
│       │   {
│       │     "file": "Hyde_Park_Skin.pdf",
│       │     "duration": 23450,
│       │     "result": {
│       │       "success": true,
│       │       "textLength": 45230,
│       │       "tablesCount": 3,
│       │       "imagesCount": 5
│       │     }
│       │   }
│       ├── mirrage-result.json
│       └── BurleMarx-result.json
│
├── 📁 references/pdfs/ ............... INPUT PDFs
│   ├── Hyde_Park_Skin.pdf ............ (2.45 MB) - Input
│   ├── mirrage.pdf ................... Input
│   └── BurleMarx.pdf ................ Input
│
└── 📁 docs/
    ├── ADOBE_PDF_TEST_QUICK_START.md
    ├── PDF_EXTRACTION_OUTPUT_STRUCTURE.md
    └── ADOBE_PDF_INTEGRATION_TEST_SUMMARY.md
```

---

## 🔄 Data Flow During Extraction

```
START: Input PDF
  │
  └─▶ references/pdfs/Hyde_Park_Skin.pdf (2.45 MB)
       │
       ├─▶ Read file to Buffer
       │    └─ 2,048,576 bytes in memory
       │
       ├─▶ Copy to temp/ [TEMPORARY]
       │    └─ temp/test-123_uuid.pdf
       │       [DELETED after use ✓]
       │
       ├─▶ Submit to Adobe API
       │    └─ [ADOBE-API] Job submitted
       │
       ├─▶ Download result ZIP [TEMPORARY]
       │    └─ temp/extraction_uuid.zip (524 KB)
       │       [DELETED after parsing ✓]
       │
       ├─▶ Extract ZIP Contents
       │    ├─ structuredData.json
       │    ├─ figures/ (folder with images)
       │    └─ renditions/ (table renders)
       │
       └─▶ Parse & Save Permanently
            │
            ├─▶ uploads/extracted/test-...-text.txt
            │    └─ 45,230 characters
            │
            ├─▶ uploads/extracted/test-...-tables.json
            │    └─ 3 tables with structure
            │
            ├─▶ uploads/extracted/test-...-structured-data.json
            │    └─ Complete Adobe response
            │
            ├─▶ uploads/images/test-...-figure-001.png
            ├─▶ uploads/images/test-...-figure-002.png
            ├─▶ uploads/images/test-...-table-render.png
            │    └─ All image data
            │
            └─▶ test-results/pdf-extraction/test-...-result.json
                 └─ Metrics & timing
```

---

## 📦 File Lifecycle

```
┌─ FILE LIFECYCLE ────────────────────────────────────────────┐
│                                                             │
│  INPUT PDF                    PROCESSING                 OUTPUT
│  ─────────                    ──────────                 ──────
│
│  references/pdfs/
│  ├─ Hyde_Park_Skin.pdf ──▶ Buffer ──▶ temp/xyz.pdf ──▶ [DELETED]
│     (2.45 MB)              (memory)   [5 seconds]      ✓
│
│                            ──▶ Adobe SDK
│                                ──▶ ZIP result ──▶ temp/ext_xyz.zip ──▶ [DELETED]
│                                    [10-45 sec]     [2 seconds]        ✓
│                                    
│                                    ──▶ Parse ZIP
│                                        ──▶ uploads/extracted/*
│                                        ──▶ uploads/images/*
│                                        ──▶ test-results/*-result.json
│                                            [PERMANENT - stays on disk]
│
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Storage Breakdown Per PDF

```
Single PDF Processing: Hyde_Park_Skin.pdf (2.45 MB)

TEMPORARY USAGE (During ~30 seconds):
├─ temp/test-123_uuid.pdf .............. 2.45 MB  ──▶ DELETED ✓
├─ temp/extraction_uuid.zip ............ 0.50 MB  ──▶ DELETED ✓
└─ Extracted in memory ................. ~5-10 MB ──▶ Released ✓

PERMANENT STORAGE (After completion):
├─ uploads/extracted/
│  ├─ test-...-text.txt ............... 0.15 MB  ✓ Saved
│  ├─ test-...-tables.json ............ 0.05 MB  ✓ Saved
│  └─ test-...-structured-data.json ... 0.10 MB  ✓ Saved
│
├─ uploads/images/
│  ├─ figure-001.png .................. 2.10 MB  ✓ Saved
│  ├─ figure-002.png .................. 1.80 MB  ✓ Saved
│  ├─ figure-003.png .................. 2.00 MB  ✓ Saved
│  └─ table-001-render.png ............ 0.50 MB  ✓ Saved
│
└─ test-results/pdf-extraction/
   └─ Hyde_Park_Skin-result.json ...... 0.01 MB  ✓ Saved

TOTAL PERMANENT: ~10 MB (mainly images)
TOTAL TEMPORARY: ~15 MB (cleaned up automatically)
```

---

## 🎯 Log Output Locations

```
SERVICE LOGS (shown in Jest console)
├─ [PDF-EXTRACT] .................... Extraction start
├─ [PDF-DOWNLOAD] ................... File download
├─ [PDF-EXTRACT-BUFFER] ............. Buffer setup
├─ [ADOBE-API] ...................... SDK calls
├─ [ZIP-PARSE] ...................... ZIP extraction
├─ [JSON-PARSE] ..................... JSON parsing
├─ [TABLE-EXTRACT] .................. Table data
│  └─ "Table 0: rows=5, cols=3"
├─ [TEXT-EXTRACT] ................... Text data
│  └─ "Text extracted: 45,230 characters"
├─ [IMAGE-EXTRACT] .................. Image data
│  └─ "Found 5 images"
│  └─ "Image 0: size=2,097,152 bytes"
└─ [CLEANUP] ........................ File cleanup

TEST RESULTS (saved to JSON)
└─ test-results/pdf-extraction/*.json
   {
     "duration": 23450,
     "textLength": 45230,
     "tablesCount": 3,
     "imagesCount": 5,
     "fileSize": 2048576,
     "pageCount": 12
   }
```

---

## ✅ Verification Checklist

After running tests, you can verify:

```
✓ Check extracted text exists
  ls -lh uploads/extracted/*-text.txt

✓ Check extracted tables exist
  ls -lh uploads/extracted/*-tables.json

✓ Check extracted images exist
  ls -lh uploads/images/*

✓ Check temp directory is clean
  ls temp/  # Should be empty or minimal

✓ Check test results saved
  cat test-results/pdf-extraction/*.json | jq .

✓ Verify file sizes make sense
  - Text files: 50KB-10MB
  - Table JSON: 10KB-5MB
  - Images: 100KB-1GB (depends on PDF)

✓ Verify extraction timing
  - Small PDF: 5-10 seconds
  - Large PDF: 20-60 seconds
  - Extraction: usually 10-45 seconds
```

---

## 🔍 Example Directory After Test

```
uploads/
├── extracted/
│   ├── test-20231126-001-Hyde_Park_Skin-text.txt (154 KB)
│   ├── test-20231126-001-Hyde_Park_Skin-tables.json (48 KB)
│   ├── test-20231126-001-Hyde_Park_Skin-structured-data.json (102 KB)
│   ├── test-20231126-002-mirrage-text.txt (203 KB)
│   ├── test-20231126-002-mirrage-tables.json (65 KB)
│   ├── test-20231126-002-mirrage-structured-data.json (156 KB)
│   ├── test-20231126-003-BurleMarx-text.txt (178 KB)
│   ├── test-20231126-003-BurleMarx-tables.json (72 KB)
│   └── test-20231126-003-BurleMarx-structured-data.json (131 KB)
│
└── images/
    ├── test-20231126-001-Hyde_Park_Skin-figure-001.png (2.1 MB)
    ├── test-20231126-001-Hyde_Park_Skin-figure-002.png (1.8 MB)
    ├── test-20231126-001-Hyde_Park_Skin-figure-003.png (2.0 MB)
    ├── test-20231126-001-Hyde_Park_Skin-table-001-render.png (512 KB)
    ├── test-20231126-002-mirrage-figure-001.jpg (3.1 MB)
    ├── test-20231126-002-mirrage-figure-002.jpg (2.5 MB)
    ├── test-20231126-003-BurleMarx-figure-001.png (1.5 MB)
    └── test-20231126-003-BurleMarx-figure-002.png (1.8 MB)

test-results/pdf-extraction/
├── Hyde_Park_Skin-result.json
├── mirrage-result.json
└── BurleMarx-result.json

temp/
(empty - all files auto-deleted ✓)
```

---

## 📈 Memory & Storage Impact

```
During Processing (per PDF):
├─ Memory: ~5-15 MB (extracted content in RAM)
├─ Disk temp: ~3 MB (PDF + ZIP copies)
└─ Duration: 10-45 seconds (depends on Adobe API)

After Processing (per PDF):
├─ Disk used: 5-500 MB (mainly images)
├─ No memory: All released
└─ Duration: Permanent (stays on disk)

For 3 PDFs Sequentially:
├─ Peak temp storage: ~15 MB (during processing)
├─ Final storage: ~30-1500 MB (depends on images)
├─ Total time: ~60-180 seconds
└─ Temp cleanup: ✓ Automatic
```

---

## 🎓 Key Takeaways

| Item | Location | Type | Duration | Action |
|------|----------|------|----------|--------|
| Input PDFs | `references/pdfs/` | Read | Start | None |
| Temp PDF copy | `temp/` | Write/Delete | 5-30s | Auto-deleted |
| Temp ZIP result | `temp/` | Write/Delete | 2-5s | Auto-deleted |
| Extracted text | `uploads/extracted/` | Write/Keep | Permanent | Kept |
| Extracted tables | `uploads/extracted/` | Write/Keep | Permanent | Kept |
| Extracted images | `uploads/images/` | Write/Keep | Permanent | Kept |
| Test results | `test-results/` | Write/Keep | Permanent | Kept |
| Service logs | Console | Write/Display | Live | Jest output |

