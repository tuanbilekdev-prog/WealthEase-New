import { getServiceRoleClient } from '../config/supabaseClient.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.email || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📸 [Profile] Uploading avatar for user:', userId);
    console.log('📸 [Profile] File size:', req.file.size, 'bytes');
    console.log('📸 [Profile] File type:', req.file.mimetype);

    const adminClient = getServiceRoleClient();
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${userId}-${Date.now()}${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('profile-pictures')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ [Profile] Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload avatar: ' + uploadError.message });
    }

    console.log('✅ [Profile] File uploaded to storage:', filePath);

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;
    console.log('✅ [Profile] Public URL:', avatarUrl);

    // Check if profile exists, create if not
    const { data: existingProfile, error: checkError } = await adminClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('📝 [Profile] Profile does not exist, creating...');
      const { error: createError } = await adminClient
        .from('profiles')
        .insert({
          user_id: userId,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        console.error('❌ [Profile] Create profile error:', createError);
        return res.status(500).json({ error: 'Failed to create profile: ' + createError.message });
      }

      console.log('✅ [Profile] Profile created successfully');
    } else if (checkError) {
      console.error('❌ [Profile] Check profile error:', checkError);
      return res.status(500).json({ error: 'Failed to check profile: ' + checkError.message });
    } else {
      // Profile exists, update it
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [Profile] Update profile error:', updateError);
        return res.status(500).json({ error: 'Failed to update profile: ' + updateError.message });
      }

      console.log('✅ [Profile] Profile updated successfully');
    }

    console.log('✅ [Profile] Profile updated successfully');

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl 
    });

  } catch (error) {
    console.error('❌ [Profile] Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar: ' + error.message });
  }
};

export const avatarUploadMiddleware = upload.single('avatar');
