-- Migration: Add avatar_url column to profiles table
-- This allows users to upload their own profile pictures

-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user uploaded profile picture stored in Supabase Storage';
