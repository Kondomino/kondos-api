# Agentic WhatsApp Module Analysis

## Overview

The agentic module is responsible for orchestrating multi-turn conversations via WhatsApp Business API with real estate agents, extracting detailed information about condominium offerings and marketing details.

## Architecture

### Core Components Hierarchy

```
AgenticService (Entry Point)
    ↓
AgentOrchestrator (State Machine)
    ├── VerificationService (Agent Detection)
    ├── DatabaseTool (Conversation Management)
    ├── ChattyAgent (LLM Processing)
    │   ├── ConversationTool (History Retrieval)
    │   ├── RelevanceAssessmentTool (Message Filtering)
    │   ├── GrokService (LLM Integration)
    │   └── MessagePersistenceTool (Response Storage)
    ├── OutboundWhatsAppClient (Message Sending)
    └── MessageQueueService (Async Processing)
```

## Processing Pipeline

### 1. Entry Point: AgenticService

**Location:** `src/agentic/agentic.service.ts`

**Responsibilities:**
- Receives raw incoming messages from WhatsApp
- Transforms message data into standardized `IncomingMessage` format
- Extracts metadata (phone number, content, message type, media, contact context)
- Delegates to `AgentOrchestrator` for processing
- Returns `AgentResponse` (shouldRespond flag + message)

**Input Parameters:**
```typescript
{
  phoneNumber: string
  content: string
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video'
  whatsappMessageId: string
  mediaData?: any
  contactContext?: {
    contactName?: string
    isBusinessAccount?: boolean
    businessProfile?: {
      business_name?: string
      website?: string[]
      email?: string
      category?: string
      description?: string
    }
  }
}
```

### 2. Orchestration Layer: AgentOrchestrator

**Location:** `src/agentic/orchestrator/agent.orchestrator.ts`

**Core State Machine with 5 Sequential Steps:**

#### Step 1: Verification
- **Service:** `VerificationService`
- **Purpose:** Determine if sender is a legitimate real estate agent
- **Output:** Boolean verification status + confidence score
- See [Verification Strategy](#verification-strategy) below

#### Step 2: Agency Management
- **Tool:** `DatabaseTool`
- **Purpose:** Create or retrieve `RealEstateAgency` record linked to phone number
- **Outcome:** Agency ID persisted for conversation grouping

#### Step 3: Conversation Creation
- **Tool:** `DatabaseTool`
- **Purpose:** Get or create `Conversation` record
- **Mapping:** Phone number + Agency ID → Unique conversation thread
- **Tracks:** Conversation metadata, creation timestamp, message count

#### Step 4: Message Queueing (Optional)
- **Service:** `MessageQueueService`
- **Purpose:** Optionally defer message processing for async handling
- **Entity:** `MessageQueue` stores pending messages with status tracking
- **States:** pending → processing → completed/failed
- **Use Case:** High-volume scenarios or rate limiting

#### Step 5: Response Generation
- **Agent:** `ChattyAgent`
- **Purpose:** Generate contextual response using LLM
- **Process:** See [Chatty Agent Processing](#chatty-agent-processing) below
- **Output:** Generated message + relevance metadata

---

## Verification Strategy

**Location:** `src/agentic/orchestrator/verification.service.ts`

### Multi-Stage Detection Pipeline

```
Incoming Message
    ↓
[Stage 1] Check Database
    └─ Is phone number in known RealEstateAgency records?
    ├─ YES → Mark as verified ✓
    └─ NO → Continue to Stage 2
    ↓
[Stage 2] Test Whitelist
    └─ Is phone in dev/test whitelist?
    ├─ YES → Mark as verified ✓
    └─ NO → Continue to Stage 3
    ↓
[Stage 3] Business Profile Analysis (if isBusinessAccount)
    ├─ Scan business_name for real estate keywords
    ├─ Analyze category field (realtor, broker, agency, etc.)
    └─ Cross-reference with message content
    ↓
[Stage 4] Message Content Analysis (fallback)
    ├─ Real estate keywords (0.3 weight each)
    │   └─ "propriedad", "inmueble", "piso", "casa", etc.
    ├─ Business indicators (0.15 weight each)
    │   └─ "empresa", "negocio", "profesional", etc.
    ├─ Professional language patterns (+0.2 bonus)
    ├─ Contact information sharing (+0.15 bonus)
    └─ Return: confidence score (0-1) + reasoning log
```

### Confidence Scoring Thresholds

| Score Range | Decision | Action |
|------------|----------|--------|
| ≥ 0.7 | **High Confidence** | Verify as agent, proceed with orchestration |
| 0.3 - 0.7 | **Medium Confidence** | Request clarification or ask for verification details |
| < 0.3 | **Low Confidence** | Reject/log as non-agent, halt processing |

---

## Chatty Agent Processing

**Location:** `src/agentic/agents/chatty/chatty.agent.ts`

### LangChain-Based Agentic Chain

The ChattyAgent implements a 4-step processing chain:

#### Step 1: Fetch Conversation History
- **Tool:** `ConversationTool`
- **Purpose:** Retrieve all prior messages in conversation
- **Query:** Filters by ConversationID + sorted by timestamp (ascending)
- **Result:** Full message history array with metadata

#### Step 2: Assess Message Relevance
- **Tool:** `RelevanceAssessmentTool`
- **Purpose:** Evaluate if current message is relevant to condominium data extraction
- **Scoring:** Binary relevance flag + explanation
- **Filters:** Out-of-scope messages (spam, off-topic, etc.)
- **Result:** Relevance metadata attached to message context

#### Step 3: Build LLM Context & Call Grok
- **Component:** `GrokService`
- **System Prompt:** Loaded from `CHATTY_SYSTEM_PROMPT` (see prompts file)
- **Context Assembly:**
  ```
  System Instructions
      ↓
  Conversation History (formatted with speaker roles)
      ↓
  Current Message + Relevance Analysis
      ↓
  Property Extraction Guidelines
      ↓
  → LLM Call
  ```
- **LLM Settings:**
  - **Model:** Grok (XAI)
  - **Temperature:** 0.7 (balanced creativity/consistency)
  - **Max Tokens:** 1500
  - **Timeout:** Configurable with error handling

#### Step 4: Persist Response
- **Tool:** `MessagePersistenceTool`
- **Purpose:** Store generated response + metadata
- **Data Stored:**
  - Message content
  - Relevance score
  - Extracted entities/properties
  - Timestamp
  - Direction: outgoing
- **Database:** `Message` entity with ConversationID foreign key

---

## LLM Integration: GrokService

**Location:** `src/agentic/agents/chatty/grok.service.ts`

### Capabilities
- Interfaces with XAI's Grok API
- Constructs message history with role mapping (system, user, assistant)
- Handles credential validation & error scenarios
- Implements retry logic with exponential backoff

### Message Format
```typescript
[
  { role: "system", content: CHATTY_SYSTEM_PROMPT },
  { role: "user", content: historicalMessage1 },
  { role: "assistant", content: historicalResponse1 },
  ...
  { role: "user", content: currentMessage }
]
```

---

## Message Persistence & Storage

### DatabaseTool
**Location:** `src/agentic/tools/database.tool.ts`

- **Entities Managed:**
  - `RealEstateAgency` (phone → agency mapping)
  - `Conversation` (agency + WhatsApp # → thread)
  - `Message` (individual messages with direction)
  
- **Core Operations:**
  - Create/retrieve agency by phone number
  - Create/retrieve conversation by agencyID + phoneNumber
  - Persist bidirectional messages (incoming/outgoing)

### MessagePersistenceTool
**Location:** `src/agentic/tools/message-persistence.tool.ts`

- **Stores:** Individual messages with relevance scoring
- **Metadata:**
  - Message type (text/image/document/video/audio)
  - Relevance score (0-1)
  - Direction (incoming/outgoing)
  - Extracted entities

### ConversationTool
**Location:** `src/agentic/tools/conversation.tool.ts`

- **Retrieval:** Full conversation history by ConversationID
- **Summarization:** `ConversationSummaryTool` generates concise summaries
- **Keyword Extraction:** Property-related keywords from message history
- **Use Case:** Context building for LLM calls

---

## Outbound Messaging

**Location:** `src/agentic/services/outbound-whatsapp.client.ts`

### WhatsApp Business API Integration

- **Supported Types:** Text, image, document, audio, video
- **API:** Official Meta WhatsApp Business API
- **Flow:**
  1. Generate message via ChattyAgent
  2. Format per WhatsApp API requirements
  3. Send to recipient phone number
  4. Track delivery status
  5. Log send events

### Error Handling
- API credential validation
- Rate limiting awareness
- Retry mechanisms for transient failures
- Logging of all send attempts

---

## Async Message Processing

**Location:** `src/agentic/services/message-queue.service.ts`

### Message Queue Entity
**Location:** `src/agentic/entities/message-queue.entity.ts`

### Processing States
```
pending
    ↓
processing
    ├─ Success → completed
    └─ Failure → failed (with error log)
```

### Use Cases
- Batch processing multiple incoming messages
- Rate limiting compliance
- Deferred processing during high load
- Retry logic for failed messages

### Status Tracking
- Timestamp per state transition
- Error messages for failed messages
- Attempt count & retry policy

---

## Data Models

### Entity Relationships

```
RealEstateAgency
    ├─ phoneNumber (PK)
    ├─ name
    ├─ verificationStatus
    └─ metadata
        ↓
    Conversation (1-to-Many)
        ├─ conversationId (PK)
        ├─ agencyId (FK)
        ├─ whatsappPhoneNumber
        ├─ createdAt
        └─ metadata
            ↓
        Message (1-to-Many)
            ├─ messageId (PK)
            ├─ conversationId (FK)
            ├─ content
            ├─ direction (incoming/outgoing)
            ├─ messageType
            ├─ relevanceScore
            ├─ timestamp
            └─ mediaData
```

### MessageQueue Entity

```
MessageQueue
    ├─ queueId (PK)
    ├─ conversationId (FK)
    ├─ messageContent
    ├─ status (pending/processing/completed/failed)
    ├─ attemptCount
    ├─ lastAttemptAt
    ├─ createdAt
    ├─ completedAt
    └─ errorLog
```

---

## Current Features Implemented

### ✅ Verification & Agent Detection
- Multi-stage confidence-based verification pipeline
- Database lookups for known agents
- Business profile analysis (if WhatsApp business account)
- Message content analysis with keyword scoring
- Test whitelist support for development

### ✅ Conversation Management
- Automatic conversation creation per agency + phone combination
- Bidirectional message history tracking
- Message filtering by type and direction
- Conversation metadata (notes, tags, status)

### ✅ AI Agent Orchestration
- LangChain chain-based processing
- Grok LLM integration with context assembly
- Conversation history awareness (full context in LLM calls)
- Relevance assessment filtering
- System prompt-driven response templating

### ✅ Message Handling
- Multi-format support (text, image, document, audio, video)
- Media metadata tracking and storage
- Message persistence with relevance scoring
- Outbound WhatsApp Business API integration

### ✅ Database Integration
- Sequelize ORM with TypeScript entities
- Conversation context retrieval with history
- Message filtering, sorting, and summarization
- JSON metadata storage for flexible attributes

### ✅ Async Processing
- Message queue system for deferred processing
- Comprehensive status tracking (pending → completed/failed)
- Error logging and retry policy support

---

## Known Limitations & TODOs

### 🔄 In Progress / Planned

1. **Quality Scoring Integration**
   - ADR 002 (`adr/002-kondo-data-quality-scoring-flow.md`) outlines data quality assessment
   - Not yet fully integrated into core orchestration flow
   - Requires entity extraction & validation scoring

2. **Media Processing**
   - References to `VerifiedMediaProcessorService` in `src/whatsapp/services/`
   - Image/document extraction workflows not yet finalized
   - OCR/PDF parsing for condominium documents

3. **Conversation Lifecycle Management**
   - No explicit mechanism for gracefully concluding conversations
   - Missing "conversation complete" logic when data quality threshold reached
   - Needs conversation state machine (active → completed → archived)

4. **Error Recovery & Resilience**
   - Limited retry logic for failed Grok API calls
   - No exponential backoff strategy documented
   - Missing circuit breaker pattern for LLM service

5. **Message Type Handling**
   - Audio/video message processing workflows incomplete
   - Media file storage and cleanup policies needed

---

## Related Documentation

- **ADR 001:** `adr/001-tests-within-modules.md` - Testing strategy
- **ADR 002:** `adr/002-kondo-data-quality-scoring-flow.md` - Data quality scoring
- **Auth Strategy:** `references/auth/stytch.auth.flow.md` - Authentication flow
- **Integration Docs:** `docs/auth-strategy-analysis.md`

---

## Module Structure

```
src/agentic/
├── agentic.module.ts          # Module definition
├── agentic.service.ts         # Entry point service
├── agentic.service.spec.ts    # Unit tests
├── orchestrator/
│   ├── agent.orchestrator.ts  # Main state machine
│   └── verification.service.ts # Agent verification
├── agents/
│   └── chatty/
│       ├── chatty.agent.ts    # LangChain agent
│       ├── chatty.prompts.ts  # System prompts
│       ├── grok.service.ts    # LLM integration
│       └── tests/
├── tools/
│   ├── database.tool.ts       # Entity persistence
│   ├── conversation.tool.ts   # History retrieval
│   ├── message-persistence.tool.ts
│   └── relevance-assessment.tool.ts
├── services/
│   ├── outbound-whatsapp.client.ts
│   └── message-queue.service.ts
├── entities/
│   ├── real-estate-agency.entity.ts
│   ├── conversation.entity.ts
│   ├── message.entity.ts
│   └── message-queue.entity.ts
├── interfaces/
│   └── agent.interface.ts     # Type definitions
└── __tests__/                 # Integration tests
```

---

## Quick Reference: Message Flow Diagram

```
Incoming WhatsApp Message
    ↓
AgenticService.processIncomingMessage()
    ↓ [Creates IncomingMessage]
AgentOrchestrator.processMessage()
    ├─ [1] VerificationService.verify()
    ├─ [2] DatabaseTool.getOrCreateAgency()
    ├─ [3] DatabaseTool.getOrCreateConversation()
    ├─ [4] MessageQueueService.enqueue() [optional]
    └─ [5] ChattyAgent.process()
        ├─ ConversationTool.getHistory()
        ├─ RelevanceAssessmentTool.assess()
        ├─ GrokService.generateResponse()
        └─ MessagePersistenceTool.save()
            ↓
OutboundWhatsAppClient.sendMessage()
    ↓
Return AgentResponse {
  shouldRespond: boolean,
  message: string
}
```

---

*Last Updated: November 25, 2025*
