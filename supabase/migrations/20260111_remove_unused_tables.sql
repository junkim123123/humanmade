-- ============================================================================
-- Remove Unused Tables
-- ============================================================================
-- This migration removes tables that are defined in schema.sql but not used
-- in the actual codebase. Safe to execute after verifying no code references.
-- Created: 2025-01-11
-- ============================================================================

BEGIN;

-- 1. Drop verifications table (not used - verification_requests is used instead)
-- Check: grep shows 0 references to "verifications" table (only verification_requests)
DROP TABLE IF EXISTS public.verifications CASCADE;

-- 2. Drop messages table (not used - order_messages is used instead)
-- Check: grep shows 0 references to "messages" table (only order_messages)
DROP TABLE IF EXISTS public.messages CASCADE;

-- 3. Drop files table (not used - Supabase Storage is used directly)
-- Check: grep shows 0 references to "files" table (only file uploads via Storage)
DROP TABLE IF EXISTS public.files CASCADE;

-- Note: Related RLS policies, triggers, and indexes are automatically dropped via CASCADE

COMMIT;

-- ============================================================================
-- Verification Query (run after migration to confirm)
-- ============================================================================
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('verifications', 'messages', 'files');
-- Should return 0 rows

