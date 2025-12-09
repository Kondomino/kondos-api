# WhatsApp Media Verification & Processing Flow

## Overview

The media verification flow is integrated into the agent orchestration pipeline, specifically handling document, image, and video content from **verified real estate agents only**. The flow occurs **after agent verification** but **before** entering the message queue for LLM processing.

---

## Current Processing Pipeline

### Complete Message Flow Diagram

```
Incoming WhatsApp Message
    ↓
[1] Agent Verification (VerificationService)
    ├─ Check database
    ├─ Check whitelist
    ├─ Analyze business profile
    └─ Analyze message content
    ↓
[2] Classification Results
    ├─ High Confidence (≥0.7) → Continue
    ├─ Medium Confidence (0.3-0.69) → Ask for clarification + EXIT
    └─ Low Confidence (<0.3) → Ignore + EXIT
    ↓
[3] Agency Management
    ├─ Retrieve existing agency
    └─ Create new agency if needed
    ↓
[4] Conversation Management
    └─ Get or create conversation thread
    ↓
[5] MEDIA PROCESSING (NEW STEP) ✨
    ├─ Check if message has media
    ├─ Filter supported types (document, image, video)
    └─ Process media for verified users only
    ↓
[6] Message Queue
    └─ Enqueue enhanced message for async processing
    ↓
[7] LLM Response Generation (via ChattyAgent)
    └─ Process when queue worker picks it up
```

---

## Media Processing Steps (Step 5 - Detailed)

### 5.1 Media Detection & Type Filtering

**Location:** `AgentOrchestrator.processMessage()` (lines 79-85)

**Current Status:** ✅ **WORKING**

**Logic:**
```typescript
if (message.mediaData && 
    (message.messageType === 'document' || 
     message.messageType === 'image' || 
     message.messageType === 'video')) {
  // Process media
}
```

**Supported Types:**
- ✅ `document` - PDFs, Word docs, etc.
- ✅ `image` - PNG, JPEG, WebP, etc.
- ✅ `video` - MP4, MOV, etc.

**Filtered Out:**
- ❌ `text` - No media to process
- ❌ `audio` - Not implemented
- ❌ `location` - Not implemented
- ❌ `contact` - Not implemented
- ❌ `sticker` - Not implemented

---

### 5.2 Call VerifiedMediaProcessorService

**Location:** `AgentOrchestrator` (lines 87-94)

**Current Status:** ✅ **WORKING**

**Service:** `VerifiedMediaProcessorService.processVerifiedUserMedia()`

**Input Parameters:**
```typescript
{
  messageType: string                    // 'document' | 'image' | 'video'
  mediaData: MediaData                   // WhatsApp media metadata
  messageId: string                      // WhatsApp message ID
  agencyId: number                       // Verified agency ID
}
```

**Returns:** `MediaProcessingResult`
```typescript
{
  shouldProcessMedia: boolean            // Was processing attempted?
  processedContent?: string              // Extracted text/summary
  enhancedMediaData?: any                // Enriched media metadata
  processingMetadata?: any               // Timing, stats, URLs
}
```

---

### 5.3 VerifiedMediaProcessorService - Processing Steps

**Location:** `src/whatsapp/services/verified-media-processor.service.ts`

#### 5.3.1 Type Validation

**Status:** ✅ **WORKING**

```
Input: message.messageType
    ↓
shouldProcessMediaType() checks:
    ├─ 'document' → YES
    ├─ 'image' → YES
    ├─ 'video' → YES
    └─ Other → NO (return early)
```

#### 5.3.2 Media Download

**Status:** ✅ **WORKING** (delegated to MediaProcessingService)

- Downloads media from WhatsApp URL
- Returns raw Buffer object
- Used by all subsequent processors

#### 5.3.3 Parallel Processing Pipeline

**Status:** ✅ **WORKING**

Two operations run in parallel via `Promise.all()`:

```
mediaBuffer (from download)
    ├─ Upload to Local Storage (MediaUploadService)
    │   └─ Returns: local file path + public URL
    │
    └─ Extract Content (MediaProcessingService.processContentFromBuffer())
        ├─ [PDF] PDF Extraction (Adobe PDF Service)
        │   ├─ Extract text ✅
        │   ├─ Extract tables ✅
        │   └─ Extract images ✅
        │
        ├─ [IMAGE] Image Processing ⏳ PLACEHOLDER
        │   ├─ OCR extraction (TODO)
        │   ├─ Object detection (TODO)
        │   └─ Floor plan detection (TODO)
        │
        ├─ [VIDEO] Video Processing ⏳ PLACEHOLDER
        │   ├─ Audio transcription (TODO)
        │   ├─ Frame extraction (TODO)
        │   └─ Property tour analysis (TODO)
        │
        └─ [OTHER] Generic File ✅
            └─ Fallback: filename only
```

#### 5.3.4 NEW: Upload to DigitalOcean Spaces (Cloud Storage)

**Status:** ✅ **WORKING** (NEW FEATURE)

**Location:** Lines 66-113 in verified-media-processor.service.ts

**Flow:**
```
processedMedia.originalBuffer
    ↓
uploadProcessedMedia() {
    ├─ Upload original file → Spaces
    ├─ Upload extracted images → Spaces
    └─ Get CDN URLs for all files
}
    ↓
Returns: BatchUploadResult
    ├─ originalFileUrl (CDN URL)
    ├─ extractedImageUrls[] (CDN URLs)
    ├─ uploadTime (milliseconds)
    └─ error (if any failed)
```

**Key Benefit:** Files are backed up to cloud storage with CDN distribution

---

#### 5.3.5 NEW: Save as Draft Media Entities

**Status:** ✅ **WORKING** (NEW FEATURE)

**Location:** Lines 115-145 in verified-media-processor.service.ts

**Flow:**
```
For each file uploaded to Spaces:
    ├─ Create Media entity
    ├─ Set status = 'draft' (not yet linked to Kondo)
    ├─ Store Spaces URL
    ├─ Set kondoId = null (will be filled later)
    └─ Save to database

Result: Media entities ready to link when condominium is identified
```

**Database Model:**
```
Media Entity {
  id: number
  filename: string
  type: 'image' | 'video' | 'document'
  status: 'draft' | 'published' | 'archived'
  storage_url: string (CDN URL)
  kondoId: number | null
  unitId: number | null
  created_at: timestamp
}
```

---

#### 5.3.6 Content Enhancement

**Status:** ✅ **WORKING**

**Method:** `buildEnhancedContent()`

**Transforms extracted data into readable summary:**

```
Input: ProcessedMedia {
  extractedText: "2 bedroom, swimming pool...",
  extractedTables: [{...}],
  extractedImages: ["image1.jpg", "image2.jpg"],
  metadata: { pageCount: 5, ... }
}

Output: String
  "[Documento recebido: property_brochure.pdf]
   
   --- CONTEÚDO EXTRAÍDO ---
   2 bedroom, swimming pool...
   
   --- 3 TABELA(S) ENCONTRADA(S) ---
   [Dados de tabelas disponíveis para análise]
   
   --- 2 IMAGEM(NS) EXTRAÍDA(S) ---
   [Imagens extraídas disponíveis]
   
   --- INFORMAÇÕES DO ARQUIVO ---
   Páginas: 5
   Elementos encontrados: 47
   Tabelas: 3
   Imagens: 2"
```

---

### 5.4 Result Integration

**Status:** ✅ **WORKING**

**Location:** AgentOrchestrator (lines 96-111)

**Logic:**
```typescript
if (mediaResult.shouldProcessMedia && mediaResult.processedContent) {
  // SUCCESS: Use processed content
  processedContent = mediaResult.processedContent;
  enhancedMediaData = mediaResult.enhancedMediaData;
  mediaProcessingMetadata = mediaResult.processingMetadata;
  
} else if (mediaResult.processedContent) {
  // FALLBACK: Use fallback even if processing failed
  processedContent = mediaResult.processedContent;
  
} else {
  // NO PROCESSING: Skip enhancement
  // Keep original message content
}
```

---

### 5.5 Enqueue with Enriched Data

**Status:** ✅ **WORKING**

**Location:** AgentOrchestrator (lines 113-136)

**Enhanced message includes:**
```typescript
{
  ...originalMessage,
  content: processedContent,           // Extracted/enhanced text
  mediaData: enhancedMediaData,         // Enriched metadata with URLs
}

+ Metadata logged:
  {
    media_processing: {
      processingSuccessful: boolean
      extractionType: 'pdf' | 'image' | 'video' | 'generic'
      processingTime: milliseconds
      mediaProcessingTime: milliseconds
      contentBuildTime: milliseconds
      spacesUploadTime: milliseconds
      spacesUpload: {
        success: boolean
        totalFiles: number
        originalFileUrl: string (CDN)
        extractedImagesCount: number
      }
    }
  }
```

---

## Service Architecture & Dependencies

### Service Hierarchy

```
AgentOrchestrator (orchestration layer)
    │
    └─ VerifiedMediaProcessorService (policy layer - "only for verified users")
         │
         ├─ MediaProcessingService (content extraction)
         │   ├─ AdobePdfService (PDF extraction) ✅
         │   └─ MediaUploadService (local storage) ✅
         │
         ├─ DigitalOceanSpacesService (cloud storage) ✅ NEW
         │   └─ AWS S3 SDK wrapper
         │
         └─ MediaRepository (database persistence) ✅ NEW
             └─ Sequelize ORM
```

---

## Supporting Services Detail

### 1. MediaProcessingService

**Location:** `src/whatsapp/services/media-processing.service.ts`

**Purpose:** Content extraction from different file types

**Status:** ✅ **WORKING** (PDF) | ⏳ **PLACEHOLDER** (Image, Video)

**Key Methods:**

| Method | Status | Purpose |
|--------|--------|---------|
| `processMedia()` | ✅ | Main orchestrator, handles parallel upload + extraction |
| `processPDFFromBuffer()` | ✅ | Extract text, tables, images from PDF via Adobe API |
| `processImageFromBuffer()` | ⏳ | Placeholder - OCR not implemented |
| `processVideoFromBuffer()` | ⏳ | Placeholder - transcription not implemented |
| `processGenericFileFromBuffer()` | ✅ | Fallback - returns filename only |
| `downloadMedia()` | ✅ | Downloads from WhatsApp URL |
| `uploadToLocalStorage()` | ✅ | Saves to disk (via MediaUploadService) |

**Output:** `ProcessedMedia`
```typescript
{
  success: boolean
  originalBuffer: Buffer              // Raw file data for cloud upload
  extractedText: string               // Extracted content
  extractedTables: any[]              // Structured data
  extractedImages: string[]           // Local URLs
  extractedImageBuffers: Buffer[]     // Raw image data for cloud upload
  metadata: {
    processingTime: number
    fileSize: number
    extractionType: 'pdf' | 'image' | 'video' | 'generic'
  }
}
```

---

### 2. MediaUploadService

**Location:** `src/whatsapp/services/media-upload.service.ts`

**Purpose:** Local file storage (temporary/backup)

**Status:** ✅ **WORKING** | 🚀 **CLOUD MIGRATION READY**

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `uploadMedia()` | Save file to local disk in organized subdirs |
| `uploadMultipleFiles()` | Batch upload multiple files |
| `deleteFile()` | Clean up old files |
| `getFileInfo()` | Check file existence and size |

**Directory Structure:**
```
uploads/
├── images/          # Image files
├── documents/       # PDFs, Word docs, etc.
├── videos/          # Video files
└── extracted/       # Extracted content
```

**TODO Comments:** References to S3, Google Cloud Storage, but not implemented

---

### 3. DigitalOceanSpacesService ✨ NEW

**Location:** `src/whatsapp/services/digital-ocean-spaces.service.ts`

**Purpose:** Cloud storage for long-term file persistence

**Status:** ✅ **WORKING**

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `uploadFile()` | Upload single file to Spaces (CDN enabled) |
| `uploadMultipleFiles()` | Batch upload (parallel) |
| `uploadProcessedMedia()` | Specialized: original + extracted images |
| `deleteFile()` | Remove from cloud storage |
| `testConnection()` | Verify Spaces credentials |

**Features:**
- AWS S3-compatible API
- Public-read ACL (CDN accessible)
- Organized folder structure: `agencies/{agencyId}/{category}/{fileType}/`
- Automatic CDN URL generation
- Metadata tagging

**Output:** `BatchUploadResult`
```typescript
{
  success: boolean
  originalFileUrl: string              // CDN URL to original
  extractedImageUrls: string[]         // CDN URLs to images
  totalUploads: number
  failedUploads: number
  uploadTime: milliseconds
  error?: string
}
```

---

### 4. WhatsAppMediaService

**Location:** `src/whatsapp/services/whatsapp-media.service.ts`

**Purpose:** Communication with WhatsApp API

**Status:** ✅ **WORKING**

**Key Methods:**

| Method | Purpose |
|--------|---------|
| `getMediaInfo()` | Get download URL + metadata from WhatsApp |
| `downloadMedia()` | Download file from WhatsApp URL |
| `getMediaInfoAndDownload()` | Combined operation |
| `testConnection()` | Verify WhatsApp credentials |

**Uses:** Facebook Graph API v20.0

---

### 5. AdobePdfService

**Location:** (reference in attached services)

**Purpose:** PDF content extraction

**Status:** ✅ **WORKING**

**Capabilities:**
- Text extraction
- Table extraction
- Image extraction (embedded in PDF)
- Page count detection
- Element detection

---

## What's Working vs. What's Disabled/TODO

### ✅ Working Components

| Component | Details |
|-----------|---------|
| **Agent Verification** | Confidence-based verification (high/medium/low) |
| **PDF Processing** | Text, tables, images extraction via Adobe API |
| **Local Storage** | Files saved to organized disk directories |
| **Cloud Upload (Spaces)** | Files backed up to DigitalOcean CDN |
| **Draft Media Entities** | Database records created for future linking |
| **Message Queueing** | Messages queued for async LLM processing |
| **Parallel Processing** | Upload + extraction happen simultaneously |
| **Fallback Handling** | Graceful degradation if extraction fails |
| **Metadata Tracking** | Detailed timing and processing stats |

### ⏳ Placeholder/TODO Components

| Component | Reason | Notes |
|-----------|--------|-------|
| **Image Processing** | OCR not implemented | Would extract text from image files |
| **Video Processing** | Transcription not implemented | Would convert audio to text |
| **Audio Processing** | Not implemented | Not even in scope yet |
| **Kondo Linking** | Requires AI/NLP | When/how to link media to specific condos |
| **Quality Scoring** | ADR 002 in progress | Needs integration with quality metrics |
| **Conversation Exit** | Not implemented | No mechanism to end conversation |

### ❌ Disabled/Skipped

| Component | Why | Impact |
|-----------|-----|--------|
| **Non-verified media** | Security | Only verified agents' media is processed |
| **Audio messages** | Not supported | Ignored if received |
| **Location sharing** | Out of scope | Not for property data extraction |

---

## Data Flow Through Services

### Example: PDF Document Flow

```
WhatsApp User sends PDF
    ↓
[1] WhatsAppMediaService.getMediaInfoAndDownload()
    └─ Downloads: property_brochure.pdf (5MB)
    ↓
[2] VerifiedMediaProcessorService.processVerifiedUserMedia()
    ├─ Check: Document type? YES
    ├─ Check: Verified user? YES
    └─ Call MediaProcessingService
        ↓
[3] MediaProcessingService.processContentFromBuffer()
    ├─ Parallel 1: MediaUploadService.uploadMedia()
    │   └─ Saves to: uploads/documents/uuid.pdf
    │
    └─ Parallel 2: MediaProcessingService.processPDFFromBuffer()
        ├─ Call AdobePdfService.extractPdfFromBuffer()
        ├─ Extract text: "3 bedrooms, swimming pool..."
        ├─ Extract tables: [price table, amenities table]
        └─ Extract images: [floor_plan.jpg, exterior.jpg]
    ↓
[4] DigitalOceanSpacesService.uploadProcessedMedia()
    ├─ Upload original PDF → Spaces
    ├─ Upload extracted JPGs → Spaces
    └─ Return CDN URLs
    ↓
[5] MediaRepository.create() - Create Draft Media Entities
    ├─ Media entity 1: original PDF (draft, no kondoId)
    ├─ Media entity 2: floor_plan.jpg (draft, no kondoId)
    └─ Media entity 3: exterior.jpg (draft, no kondoId)
    ↓
[6] AgentOrchestrator combines:
    ├─ processedContent: "[Documento recebido: property_brochure.pdf]\n\n--- CONTEÚDO EXTRAÍDO ---\n3 bedrooms..."
    ├─ enhancedMediaData: {
    │   storage_url: "https://cdn.spaces.com/agencies/123/original/documents/uuid.pdf",
    │   extractedImages: ["https://cdn.spaces.com/.../floor_plan.jpg", ...]
    │ }
    └─ mediaProcessingMetadata: {
        processingTime: 2345ms,
        spacesUpload: { success: true, totalFiles: 3 }
      }
    ↓
[7] MessageQueueService.enqueueMessage()
    └─ Enhanced message queued with all metadata
    ↓
[8] ChattyAgent processes when dequeued
    └─ LLM sees extracted content + media URLs in context
    ↓
[9] Response generated with condominium insights
    ↓
[10] Eventually: Media entities linked to identified Kondo
     └─ Update: kondoId = 456 (after condominium identified)
```

---

## Performance Characteristics

### Processing Times (Typical)

| Operation | Time | Bottleneck |
|-----------|------|-----------|
| PDF extraction (5-page doc) | 500-1500ms | Adobe API |
| Image upload to Spaces | 200-500ms | Network |
| Local file save | 50-100ms | Disk I/O |
| Download from WhatsApp | 200-800ms | Network |
| **Total End-to-End** | **1-3 seconds** | Adobe API |

### Concurrency

- ✅ Parallel: download + extraction
- ✅ Parallel: original upload + image uploads (batch)
- ✅ Async: Message queue processing

---

## Current Limitations & Known Issues

1. **Image/Video placeholder:** No real content extraction yet
2. **No Kondo identification:** Media saved as draft, no linking logic
3. **No quality scoring:** Can't assess data completeness
4. **No conversation exit:** No mechanism to end talking
5. **CDN URL generation:** Basic pattern, no dynamic CDN selection
6. **Single region:** Spaces only in one region (NYE3)

---

## Recommended Next Steps

1. **Implement Image OCR** - Extract text from photos
2. **Implement Video transcription** - Convert audio to text
3. **Add Kondo linking logic** - Identify which condo media relates to
4. **Integrate Quality Scoring** - Measure data extraction quality
5. **Implement Conversation Lifecycle** - Gracefully end conversations
6. **Add Multi-region Spaces** - Support international agents

---

*Last Updated: November 25, 2025*
