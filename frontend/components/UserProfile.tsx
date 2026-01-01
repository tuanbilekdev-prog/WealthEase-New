'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface UserProfileProps {
  onUserLoaded?: (user: User) => void
}

export default function UserProfile({ onUserLoaded }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token')
        
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await fetch(`${API_URL}/user/me?token=${token}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Token invalid or expired
            localStorage.removeItem('token')
            throw new Error('Session expired. Please login again.')
          }
          throw new Error('Failed to fetch user data')
        }

        const data = await response.json()
        setUser(data)
        if (onUserLoaded) {
          onUserLoaded(data)
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [API_URL, onUserLoaded])

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-red-600 dark:text-red-400">{error || 'User data not available'}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        User Information
      </h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
            Name
          </label>
          <p className="text-base font-medium text-gray-900 dark:text-white">
            {user.name}
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
            Email
          </label>
          <p className="text-base font-medium text-gray-900 dark:text-white">
            {user.email}
          </p>
        </div>
        {user.role && (
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
              Role
            </label>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {user.role}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

