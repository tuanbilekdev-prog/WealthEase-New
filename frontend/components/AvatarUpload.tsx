'use client';

import React, { useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarUpdate: (url: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatar, onAvatarUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/profile/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onAvatarUpdate(data.avatarUrl);
      
      // Show success message
      setError(null);
      alert('✅ Avatar updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setError(error.message || 'Failed to upload avatar');
      setPreview(currentAvatar || null); // Revert preview
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center ring-2 ring-gray-600 hover:ring-green-500 transition-all">
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-12 h-12 text-gray-400" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
        <label 
          htmlFor="avatar-upload" 
          className={`absolute bottom-0 right-0 bg-green-500 hover:bg-green-600 text-white rounded-full p-2.5 cursor-pointer transition-all shadow-lg hover:scale-110 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="w-5 h-5" />
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-300 font-medium mb-1">
          {uploading ? 'Uploading...' : 'Upload Your Photo'}
        </p>
        <p className="text-xs text-gray-500">
          Max 5MB • JPG, PNG, GIF, WEBP
        </p>
      </div>

      {error && (
        <div className="w-full px-4 py-2 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
          <p className="text-xs text-red-400 text-center">{error}</p>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
