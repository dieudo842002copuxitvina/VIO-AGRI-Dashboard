-- Escrow Payment System - Step by Step Setup
-- Run this in Supabase SQL Editor

-- STEP 1: Verify deals table structure
-- This will show you what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deals' AND table_schema = 'public'
ORDER BY ordinal_position;
