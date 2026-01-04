'use client'

import { useState, useEffect } from 'react'
import CustomAvatarSVG from '@/components/CustomAvatarSVG'

interface AvatarProfileProps {
  userId?: string
  userName?: string
  userEmail?: string
  googleImageUrl?: string | null
  avatarUrl?: string | null // Add custom uploaded avatar
  avatarSelected?: number | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function AvatarProfile({
  userId,
  userName,
  userEmail,
  googleImageUrl,
  avatarUrl: initialAvatarUrl,
  avatarSelected: initialAvatarSelected,
  size = 'md',
  className = '',
}: AvatarProfileProps) {
  const [avatarSelected, setAvatarSelected] = useState<number | null>(initialAvatarSelected || null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null)
  const [loading, setLoading] = useState(false)

  // Fetch avatar selection from API if userId is provided
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!userId || (initialAvatarSelected !== undefined && initialAvatarUrl !== undefined)) {
        return
      }

      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        if (!token) return

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const response = await fetch(`${API_URL}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          if (userData.avatar_url) {
            setAvatarUrl(userData.avatar_url)
          } else if (userData.avatar_selected) {
            setAvatarSelected(userData.avatar_selected)
          }
        }
      } catch (err) {
        console.error('Error fetching avatar:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAvatar()
  }, [userId, initialAvatarSelected, initialAvatarUrl])

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-32 h-32 text-2xl',
  }

  // Get SVG size based on avatar size
  const svgSizes = {
    sm: 20,
    md: 32,
    lg: 56,
    xl: 88,
  }

  // Get initial letter for placeholder
  const getInitial = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase()
    }
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase()
    }
    return '?'
  }

  // Priority: uploaded avatar > preset avatar > google image > initial letter
  const hasUploadedAvatar = avatarUrl !== null && avatarUrl !== ''
  const hasCustomAvatar = avatarSelected !== null && avatarSelected > 0
  const displayImage = !hasUploadedAvatar && googleImageUrl && !hasCustomAvatar ? googleImageUrl : null
  const showPlaceholder = !hasUploadedAvatar && !hasCustomAvatar && !displayImage && !loading

  if (loading) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {hasUploadedAvatar ? (
        <img
          src={avatarUrl!}
          alt={userName || 'Profile picture'}
          className="w-full h-full object-cover"
          onError={() => {
            // If image fails to load, fallback to preset avatar or placeholder
            setAvatarUrl(null)
          }}
        />
      ) : hasCustomAvatar ? (
        <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 dark:from-emerald-500/20 dark:to-emerald-600/20 flex items-center justify-center border border-emerald-500/20 dark:border-emerald-400/20">
          <CustomAvatarSVG 
            avatarId={avatarSelected!} 
            size={svgSizes[size]}
            className="drop-shadow-sm"
          />
        </div>
      ) : displayImage ? (
        <img
          src={displayImage}
          alt={userName || 'Profile picture'}
          className="w-full h-full object-cover"
          onError={() => {
            // If image fails to load, fallback to placeholder
            setAvatarSelected(null)
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-dark-green flex items-center justify-center text-white font-semibold">
          {getInitial()}
        </div>
      )}
    </div>
  )
}

