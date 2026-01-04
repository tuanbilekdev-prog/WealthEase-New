# Setup Supabase Storage for Profile Pictures

Follow these steps to enable profile picture uploads:

## 1. Create Storage Bucket in Supabase

1. Open your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click **New Bucket**
5. Fill in the details:
   - **Name**: `profile-pictures`
   - **Public bucket**: ✅ Enable (check this box)
   - **File size limit**: 5MB (optional)
   - **Allowed MIME types**: Leave empty (or add: image/jpeg, image/png, image/gif, image/webp)
6. Click **Create bucket**

## 2. Set Bucket Policies (Optional - for more security)

If you want to restrict who can upload/view:

1. Click on the `profile-pictures` bucket
2. Go to **Policies** tab
3. Click **New Policy**

Example policies:

### Allow authenticated users to upload their own avatars:
```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Allow public read access:
```sql
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

## 3. Run Database Migration

Run the migration to add `avatar_url` column to profiles table:

```bash
# Connect to your Supabase SQL Editor and run:
```

Copy content from: `backend/migrations/010_add_avatar_url_column.sql`

## 4. Test the Upload Feature

1. Go to Settings page: http://localhost:3000/dashboard/settings
2. You should see "Upload Your Photo" section
3. Click the upload icon
4. Select an image (max 5MB)
5. Wait for upload to complete
6. Your avatar should be updated!

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created the `profile-pictures` bucket in Supabase Storage
- Check bucket name is exactly `profile-pictures` (case-sensitive)

### Error: "Failed to upload"
- Check if bucket is set to **Public**
- Verify your Supabase credentials in `.env` file
- Check browser console for detailed errors

### Image not showing
- Verify the bucket is set to **Public**
- Check if the URL is correct in the database
- Try accessing the URL directly in browser

## Security Notes

- Files are stored in Supabase Storage (not on your server)
- File size is limited to 5MB
- Only image files are accepted (JPEG, PNG, GIF, WEBP)
- Each user can only upload one profile picture (will overwrite previous)
