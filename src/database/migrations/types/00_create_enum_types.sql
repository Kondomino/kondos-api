-- ============================================================================
-- PostgreSQL ENUM Types Setup
-- ============================================================================
-- This file creates all ENUM types used across the application
-- Run this file BEFORE running Sequelize migrations
-- Usage: psql -U username -d database_name -f 00_create_enum_types.sql
-- ============================================================================

-- Users Table ENUMs
-- ============================================================================

-- Gender enum for Users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_gender') THEN
        CREATE TYPE "enum_Users_gender" AS ENUM ('male', 'female');
    END IF;
END
$$;

-- Kondos Table ENUMs
-- ============================================================================

-- Status enum for Kondos table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Kondos_status') THEN
        CREATE TYPE "enum_Kondos_status" AS ENUM ('draft', 'text_ready', 'media_gathering', 'done', 'scraping');
    END IF;
END
$$;

-- Type enum for Kondos table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Kondos_type') THEN
        CREATE TYPE "enum_Kondos_type" AS ENUM ('bairro', 'casas', 'chacatas', 'predios', 'comercial', 'industrial');
    END IF;
END
$$;

-- Units Table ENUMs
-- ============================================================================

-- Status enum for Units table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Units_status') THEN
        CREATE TYPE "enum_Units_status" AS ENUM ('draft', 'text_ready', 'media_gathering', 'published');
    END IF;
END
$$;

-- Unit type enum for Units table (apartment, house, lot)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Units_unit_type') THEN
        CREATE TYPE "enum_Units_unit_type" AS ENUM ('apartment', 'house', 'lot');
    END IF;
END
$$;

-- Media Table ENUMs
-- ============================================================================

-- Type enum for Media table (video, image)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Media_type') THEN
        CREATE TYPE "enum_Media_type" AS ENUM ('video', 'image');
    END IF;
END
$$;

-- Status enum for Media table (draft, final)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Media_status') THEN
        CREATE TYPE "enum_Media_status" AS ENUM ('draft', 'final');
    END IF;
END
$$;

-- Conversations Table ENUMs
-- ============================================================================

-- Status enum for Conversations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Conversations_status') THEN
        CREATE TYPE "enum_Conversations_status" AS ENUM ('active', 'paused', 'closed', 'archived');
    END IF;
END
$$;

-- Messages Table ENUMs
-- ============================================================================

-- Direction enum for Messages table (incoming, outgoing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Messages_direction') THEN
        CREATE TYPE "enum_Messages_direction" AS ENUM ('incoming', 'outgoing');
    END IF;
END
$$;

-- Message type enum for Messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Messages_message_type') THEN
        CREATE TYPE "enum_Messages_message_type" AS ENUM ('text', 'image', 'document', 'audio', 'video', 'location', 'contact', 'sticker');
    END IF;
END
$$;

-- MessageQueue Table ENUMs
-- ============================================================================

-- Status enum for MessageQueue table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_MessageQueue_status') THEN
        CREATE TYPE "enum_MessageQueue_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
END
$$;

-- RawContentEntries Table ENUMs
-- ============================================================================

-- Content type enum for RawContentEntries table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_RawContentEntries_content_type') THEN
        CREATE TYPE "enum_RawContentEntries_content_type" AS ENUM ('pdf', 'image', 'video');
    END IF;
END
$$;

-- Processing status enum for RawContentEntries table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_RawContentEntries_processing_status') THEN
        CREATE TYPE "enum_RawContentEntries_processing_status" AS ENUM ('pending', 'processed', 'failed');
    END IF;
END
$$;

-- ============================================================================
-- End of ENUM Types Setup
-- ============================================================================
