-- Migration: Create Supabase Storage bucket for profile pictures
-- Run this SQL in Supabase SQL Editor

-- Create storage bucket for profile pictures
-- Note: This needs to be done via Supabase Dashboard or API
-- SQL below is for reference only

-- Option 1: Create via Supabase Dashboard (Recommended)
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: profile-pictures
-- 4. Public: Yes (so images can be accessed via public URL)
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- 7. Click "Create bucket"

-- Option 2: Create via SQL (if you have RLS policies set up)
-- Note: Storage buckets are typically created via Dashboard or Storage API
-- The following is a reference for bucket policies

-- Create bucket policy for public read access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public read access to avatars
CREATE POLICY "Public can read avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Policy: Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

