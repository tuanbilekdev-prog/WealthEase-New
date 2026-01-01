-- Migration: Update profiles table to use avatar_selected instead of avatar_url
-- Run this SQL in Supabase SQL Editor

-- Add avatar_selected column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_selected INTEGER CHECK (avatar_selected >= 1 AND avatar_selected <= 24);

-- Remove avatar_url column (optional - if you want to completely remove it)
-- Note: This will delete all existing avatar URLs
-- Uncomment the line below if you want to remove avatar_url completely:
-- ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_url;

-- For now, we'll keep avatar_url for backward compatibility
-- The app will prioritize avatar_selected over avatar_url

-- Initialize avatar_selected to NULL for existing profiles
UPDATE profiles 
SET avatar_selected = NULL 
WHERE avatar_selected IS NULL;

