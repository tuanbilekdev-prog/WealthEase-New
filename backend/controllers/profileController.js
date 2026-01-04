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

    // Update user profile with avatar URL in profiles table
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ [Profile] Update profile error:', updateError);
      return res.status(500).json({ error: 'Failed to update profile: ' + updateError.message });
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
