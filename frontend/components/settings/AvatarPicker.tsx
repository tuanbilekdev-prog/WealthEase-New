'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AvatarProfile from '@/components/AvatarProfile'
import Toast from '@/components/Toast'
import CustomAvatarSVG from '@/components/CustomAvatarSVG'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface AvatarPickerProps {
  user: User | null
  loading?: boolean
}

// Preset avatars - Custom SVG illustrations bertema keuangan
const PRESET_AVATARS = [
  { id: 1, name: 'Growth Bars' },
  { id: 2, name: 'Ascending Wave' },
  { id: 3, name: 'Network Nodes' },
  { id: 4, name: 'Stability Circles' },
  { id: 5, name: 'Grid Pattern' },
  { id: 6, name: 'Diagonal Growth' },
  { id: 7, name: 'Hexagon Pattern' },
  { id: 8, name: 'Diamond Stack' },
  { id: 9, name: 'Pillar Structure' },
  { id: 10, name: 'Abstract Flow' },
  { id: 11, name: 'Rising Bars' },
  { id: 12, name: 'Bar Chart' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AvatarPicker({ user, loading: userLoading }: AvatarPickerProps) {
  const router = useRouter()
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    visible: boolean
  }>({
    message: '',
    type: 'success',
    visible: false,
  })

  // Fetch current avatar selection from database
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login ulang.')
        }

        const response = await fetch(`${API_URL}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Gagal mengambil data profil.')
        }

        const userData = await response.json()
        if (userData.avatar_selected) {
          setSelectedAvatar(userData.avatar_selected)
        }
      } catch (err) {
        console.error('Error fetching avatar:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (!userLoading) {
      fetchAvatar()
    }
  }, [user?.id, userLoading])

  const handleSelectAvatar = async (avatarId: number) => {
    console.log('handleSelectAvatar called with avatarId:', avatarId)
    console.log('user?.id:', user?.id, 'isSaving:', isSaving)
    
    if (!user?.id || isSaving) {
      console.warn('Avatar selection blocked:', { hasUser: !!user?.id, isSaving })
      return
    }

    console.log('Starting avatar save for avatarId:', avatarId)
    setIsSaving(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login ulang.')
      }

      const response = await fetch(`${API_URL}/user/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_selected: avatarId }),
      })

      if (!response.ok) {
        let errorData: { error?: string; details?: string } = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          // If response is not JSON, use empty object
          console.warn('Failed to parse error response as JSON:', parseError)
        }
        
        const errorMessage = errorData.error || errorData.details || `Server error: ${response.status} ${response.statusText}`
        
        console.error('Avatar save error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        
        throw new Error(errorMessage)
      }

      setSelectedAvatar(avatarId)
      showToast('Avatar berhasil dipilih!', 'success')
      
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error('Save avatar error:', error)
      showToast(
        error instanceof Error ? error.message : 'Gagal menyimpan pilihan avatar',
        'error'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, visible: true })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }))
  }


  if (userLoading || isLoading) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-8"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg p-3 border border-gray-200 dark:border-gray-700 overflow-visible">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Pilih Avatar
        </h3>
        <div className="space-y-2 overflow-visible">
          <div className="flex items-center gap-3">
            <AvatarProfile
              userId={user?.id}
              userName={user?.name}
              userEmail={user?.email}
              avatarSelected={selectedAvatar}
              size="sm"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Pilih avatar favorit Anda
            </p>
          </div>

          <div className="grid grid-cols-12 gap-1 overflow-visible">
            {PRESET_AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Button clicked for avatar:', avatar.id)
                  handleSelectAvatar(avatar.id)
                }}
                disabled={isSaving}
                className={`relative w-full aspect-square rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                  selectedAvatar === avatar.id
                    ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 ring-offset-2 dark:ring-offset-gray-800 scale-110 bg-emerald-50 dark:bg-emerald-900/30 shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                title={avatar.name}
                style={{ pointerEvents: isSaving ? 'none' : 'auto' }}
              >
                <CustomAvatarSVG 
                  avatarId={avatar.id} 
                  size={24}
                  className={selectedAvatar === avatar.id ? 'drop-shadow-lg' : ''}
                />
                {selectedAvatar === avatar.id && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 dark:bg-emerald-400 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </>
  )
}

