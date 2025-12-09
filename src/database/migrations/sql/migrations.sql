-- ============================================================================
-- Kondos API - Complete Database Schema
-- ============================================================================
-- This file contains all table creations, relationships, and indexes
-- Execute AFTER running: 00_create_enum_types.sql
-- Usage: psql -U username -d database_name -f migrations.sql
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255),
  "picture" VARCHAR(255),
  "password" VARCHAR(255),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "gender" "enum_Users_gender",
  "age" INTEGER,
  "active" BOOLEAN DEFAULT true,
  "whatsapp_id" VARCHAR(255),
  "phone_number" VARCHAR(255),
  "is_deleted" BOOLEAN DEFAULT false,
  "deleted_at" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "Users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_whatsapp_id" ON "Users"("whatsapp_id");
CREATE INDEX IF NOT EXISTS "idx_users_phone_number" ON "Users"("phone_number");
CREATE INDEX IF NOT EXISTS "idx_users_is_deleted" ON "Users"("is_deleted");
CREATE INDEX IF NOT EXISTS "idx_users_active" ON "Users"("active");

-- ============================================================================
-- KONDOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Kondos" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) UNIQUE,
  "email" VARCHAR(255),
  "active" BOOLEAN DEFAULT true,
  "status" "enum_Kondos_status" DEFAULT 'draft',
  "highlight" BOOLEAN DEFAULT false,
  "featured_image" VARCHAR(255),
  "type" "enum_Kondos_type" DEFAULT 'casas',
  "description" TEXT,
  "minutes_from_bh" VARCHAR(255),
  "cep" VARCHAR(255),
  "address_street_and_numbers" VARCHAR(255),
  "neighborhood" VARCHAR(255),
  "city" VARCHAR(255),
  "lot_avg_price" DECIMAL(15, 2),
  "condo_rent" DECIMAL(15, 2),
  "lots_available" BOOLEAN DEFAULT false,
  "lots_min_size" VARCHAR(255),
  "finance" BOOLEAN DEFAULT false,
  "finance_tranches" VARCHAR(255),
  "finance_fees" BOOLEAN DEFAULT false,
  "entry_value_percentage" VARCHAR(255),
  "total_area" VARCHAR(255),
  "immediate_delivery" BOOLEAN,
  "delivery" VARCHAR(255),
  "url" TEXT,
  "phone" VARCHAR(255),
  "video" TEXT,
  "infra_description" TEXT,
  "infra_eletricity" BOOLEAN,
  "infra_water" BOOLEAN,
  "infra_sidewalks" BOOLEAN,
  "infra_internet" BOOLEAN,
  "infra_lobby_24h" BOOLEAN,
  "infra_security_team" BOOLEAN,
  "infra_wall" BOOLEAN,
  "infra_sports_court" BOOLEAN,
  "infra_barbecue_zone" BOOLEAN,
  "infra_pool" BOOLEAN,
  "infra_living_space" BOOLEAN,
  "infra_pet_area" BOOLEAN,
  "infra_kids_area" BOOLEAN,
  "infra_grass_area" BOOLEAN,
  "infra_gourmet_area" BOOLEAN,
  "infra_parking_lot" BOOLEAN,
  "infra_party_saloon" BOOLEAN,
  "infra_lounge_bar" BOOLEAN,
  "infra_home_office" BOOLEAN,
  "infra_lagoon" BOOLEAN,
  "infra_generates_power" BOOLEAN,
  "infra_woods" BOOLEAN,
  "infra_vegetable_garden" BOOLEAN,
  "infra_nature_trail" BOOLEAN,
  "infra_gardens" BOOLEAN,
  "infra_heliport" BOOLEAN,
  "infra_gym" BOOLEAN,
  "infra_interactive_lobby" BOOLEAN,
  "infra_market_nearby" BOOLEAN,
  "kondo_data_updated" TIMESTAMP,
  "kondo_data_content_quality" DECIMAL(3, 2) DEFAULT 0.00,
  "kondo_data_media_quality" DECIMAL(3, 2) DEFAULT 0.00,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_kondos_slug" ON "Kondos"("slug");
CREATE INDEX IF NOT EXISTS "idx_kondos_status" ON "Kondos"("status");
CREATE INDEX IF NOT EXISTS "idx_kondos_type" ON "Kondos"("type");
CREATE INDEX IF NOT EXISTS "idx_kondos_city" ON "Kondos"("city");
CREATE INDEX IF NOT EXISTS "idx_kondos_active" ON "Kondos"("active");
CREATE INDEX IF NOT EXISTS "idx_kondos_highlight" ON "Kondos"("highlight");

-- ============================================================================
-- UNITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Units" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "kondoId" INTEGER REFERENCES "Kondos"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "userId" INTEGER REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "active" BOOLEAN DEFAULT true,
  "status" "enum_Units_status" DEFAULT 'draft',
  "bedrooms" INTEGER DEFAULT 0,
  "baths" INTEGER DEFAULT 0,
  "suites" INTEGER DEFAULT 0,
  "parking_spaces" INTEGER DEFAULT 0,
  "is_roof" BOOLEAN DEFAULT false,
  "value" VARCHAR(255),
  "furnished" BOOLEAN DEFAULT false,
  "closet" BOOLEAN DEFAULT false,
  "unit_type" "enum_Units_unit_type" NOT NULL,
  "area" DECIMAL(10, 2),
  "lot_size" VARCHAR(255),
  "floor" INTEGER,
  "building" VARCHAR(255),
  "description" TEXT,
  "features" JSON,
  "images" JSON,
  "video_url" VARCHAR(255),
  "contact_phone" VARCHAR(255),
  "contact_email" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_units_kondo_id" ON "Units"("kondoId");
CREATE INDEX IF NOT EXISTS "idx_units_user_id" ON "Units"("userId");
CREATE INDEX IF NOT EXISTS "idx_units_status" ON "Units"("status");
CREATE INDEX IF NOT EXISTS "idx_units_unit_type" ON "Units"("unit_type");
CREATE INDEX IF NOT EXISTS "idx_units_active" ON "Units"("active");

-- ============================================================================
-- MEDIA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Media" (
  "id" SERIAL PRIMARY KEY,
  "filename" VARCHAR(255) NOT NULL,
  "type" "enum_Media_type" DEFAULT 'image' NOT NULL,
  "status" VARCHAR(10) DEFAULT 'draft' NOT NULL,
  "storage_url" VARCHAR(255),
  "kondoId" INTEGER REFERENCES "Kondos"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "unitId" INTEGER REFERENCES "Units"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chk_media_status" CHECK (status IN ('draft', 'final'))
);

CREATE INDEX IF NOT EXISTS "idx_media_kondo_id" ON "Media"("kondoId");
CREATE INDEX IF NOT EXISTS "idx_media_unit_id" ON "Media"("unitId");
CREATE INDEX IF NOT EXISTS "idx_media_status" ON "Media"("status");
CREATE INDEX IF NOT EXISTS "idx_media_type" ON "Media"("type");
CREATE INDEX IF NOT EXISTS "idx_media_kondo_status" ON "Media"("kondoId", "status");

-- ============================================================================
-- LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Likes" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "kondoId" INTEGER REFERENCES "Kondos"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "unitId" INTEGER REFERENCES "Units"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_likes_user_id" ON "Likes"("userId");
CREATE INDEX IF NOT EXISTS "idx_likes_kondo_id" ON "Likes"("kondoId");
CREATE INDEX IF NOT EXISTS "idx_likes_unit_id" ON "Likes"("unitId");
CREATE INDEX IF NOT EXISTS "idx_likes_user_kondo" ON "Likes"("userId", "kondoId");
CREATE INDEX IF NOT EXISTS "idx_likes_user_unit" ON "Likes"("userId", "unitId");

-- ============================================================================
-- REAL ESTATE AGENCIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "RealEstateAgencies" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "description" VARCHAR(255),
  "phone_number" VARCHAR(255) NOT NULL UNIQUE,
  "email" VARCHAR(255),
  "website" VARCHAR(255),
  "address" VARCHAR(255),
  "city" VARCHAR(255),
  "state" VARCHAR(255),
  "country" VARCHAR(255),
  "postal_code" VARCHAR(255),
  "is_active" BOOLEAN DEFAULT true,
  "metadata" JSON,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_real_estate_agencies_name" ON "RealEstateAgencies"("name");
CREATE INDEX IF NOT EXISTS "idx_real_estate_agencies_phone" ON "RealEstateAgencies"("phone_number");
CREATE INDEX IF NOT EXISTS "idx_real_estate_agencies_is_active" ON "RealEstateAgencies"("is_active");

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Conversations" (
  "id" SERIAL PRIMARY KEY,
  "real_estate_agency_id" INTEGER NOT NULL REFERENCES "RealEstateAgencies"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "whatsapp_number" VARCHAR(255) NOT NULL,
  "agent_name" VARCHAR(255),
  "status" "enum_Conversations_status" DEFAULT 'active',
  "notes" TEXT,
  "metadata" JSON,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_conversations_agency_id" ON "Conversations"("real_estate_agency_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_whatsapp_number" ON "Conversations"("whatsapp_number");
CREATE INDEX IF NOT EXISTS "idx_conversations_status" ON "Conversations"("status");

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Messages" (
  "id" SERIAL PRIMARY KEY,
  "conversation_id" INTEGER NOT NULL REFERENCES "Conversations"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "whatsapp_message_id" VARCHAR(255) NOT NULL,
  "direction" "enum_Messages_direction" NOT NULL,
  "message_type" "enum_Messages_message_type" NOT NULL,
  "text_content" TEXT,
  "media_id" VARCHAR(255),
  "media_url" VARCHAR(255),
  "media_filename" VARCHAR(255),
  "media_mime_type" VARCHAR(255),
  "media_size" INTEGER,
  "media_sha256" VARCHAR(255),
  "latitude" DECIMAL(10, 8),
  "longitude" DECIMAL(11, 8),
  "location_name" VARCHAR(255),
  "location_address" VARCHAR(255),
  "contact_name" VARCHAR(255),
  "contact_phone" VARCHAR(255),
  "contact_email" VARCHAR(255),
  "timestamp" TIMESTAMP NOT NULL,
  "is_read" BOOLEAN DEFAULT false,
  "is_delivered" BOOLEAN DEFAULT false,
  "is_sent" BOOLEAN DEFAULT false,
  "metadata" JSON,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "Messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_messages_whatsapp_message_id" ON "Messages"("whatsapp_message_id");
CREATE INDEX IF NOT EXISTS "idx_messages_direction" ON "Messages"("direction");
CREATE INDEX IF NOT EXISTS "idx_messages_message_type" ON "Messages"("message_type");
CREATE INDEX IF NOT EXISTS "idx_messages_timestamp" ON "Messages"("timestamp");

-- ============================================================================
-- MESSAGE QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MessageQueue" (
  "id" SERIAL PRIMARY KEY,
  "phone_number" VARCHAR(255) NOT NULL,
  "message_content" TEXT NOT NULL,
  "whatsapp_message_id" VARCHAR(255) NOT NULL,
  "conversation_id" INTEGER NOT NULL REFERENCES "Conversations"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "agency_id" INTEGER NOT NULL REFERENCES "RealEstateAgencies"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "message_data" JSONB NOT NULL,
  "verification_metadata" JSONB NOT NULL,
  "status" "enum_MessageQueue_status" DEFAULT 'pending' NOT NULL,
  "retry_count" INTEGER DEFAULT 0 NOT NULL,
  "max_retries" INTEGER DEFAULT 3 NOT NULL,
  "processed_at" TIMESTAMP,
  "error_message" TEXT,
  "grok_response" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_message_queue_status_created" ON "MessageQueue"("status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_message_queue_phone_number" ON "MessageQueue"("phone_number");
CREATE INDEX IF NOT EXISTS "idx_message_queue_conversation_id" ON "MessageQueue"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_message_queue_agency_id" ON "MessageQueue"("agency_id");
CREATE INDEX IF NOT EXISTS "idx_message_queue_whatsapp_message_id" ON "MessageQueue"("whatsapp_message_id");
CREATE INDEX IF NOT EXISTS "idx_message_queue_status" ON "MessageQueue"("status");

-- ============================================================================
-- RAW CONTENT ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "RawContentEntries" (
  "id" SERIAL PRIMARY KEY,
  "agency_id" INTEGER NOT NULL REFERENCES "RealEstateAgencies"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "message_id" VARCHAR(255) NOT NULL,
  "content_type" "enum_RawContentEntries_content_type" NOT NULL,
  "storage_path" VARCHAR(255) NOT NULL,
  "processing_status" "enum_RawContentEntries_processing_status" DEFAULT 'pending' NOT NULL,
  "metadata" JSON,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_raw_content_agency_id" ON "RawContentEntries"("agency_id");
CREATE INDEX IF NOT EXISTS "idx_raw_content_message_id" ON "RawContentEntries"("message_id");
CREATE INDEX IF NOT EXISTS "idx_raw_content_processing_status" ON "RawContentEntries"("processing_status");
CREATE INDEX IF NOT EXISTS "idx_raw_content_content_type" ON "RawContentEntries"("content_type");
CREATE INDEX IF NOT EXISTS "idx_raw_content_agency_status" ON "RawContentEntries"("agency_id", "processing_status");

-- ============================================================================
-- End of Database Schema
-- ============================================================================
-- Total Tables: 10
-- Total Indexes: 47
-- ============================================================================
