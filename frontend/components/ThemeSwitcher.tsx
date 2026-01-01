'use client'

import { useEffect, useState, useLayoutEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeSwitcherProps {
  onThemeChange?: (theme: 'light' | 'dark') => void
}

export default function ThemeSwitcher({ onThemeChange }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  // Helper function to apply theme - make it synchronous and immediate
  const applyTheme = (t: 'light' | 'dark') => {
    if (typeof document === 'undefined') return
    
    const root = document.documentElement
    
    // Force remove dark class
    root.classList.remove('dark')
    
    // Force add if dark
    if (t === 'dark') {
      root.classList.add('dark')
    }
    
    // Force browser to apply changes immediately
    root.style.colorScheme = t === 'dark' ? 'dark' : 'light'
    
    // Also set data attribute for additional compatibility
    root.setAttribute('data-theme', t)
    
    // Force a reflow to ensure styles are applied
    void root.offsetHeight
    
    // Debug: Log to console
    console.log(`Theme applied: ${t}, HTML classes:`, root.classList.toString())
  }

  // Initialize theme on mount
  useLayoutEffect(() => {
    setMounted(true)
    
    // Get saved theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const initialTheme = savedTheme || 'light'
    setTheme(initialTheme)
    
    // Apply theme immediately before render
    applyTheme(initialTheme)
  }, [])

  // Update theme when theme state changes
  useEffect(() => {
    if (!mounted) return
    
    // Apply theme immediately
    applyTheme(theme)
    
    if (onThemeChange) {
      onThemeChange(theme)
    }
  }, [theme, mounted, onThemeChange])

  const handleThemeChange = (newTheme: Theme) => {
    // Apply theme IMMEDIATELY - BEFORE state update
    // This ensures the change is visible immediately
    const root = document.documentElement
    
    // Force remove dark class
    root.classList.remove('dark')
    
    // Force add if dark
    if (newTheme === 'dark') {
      root.classList.add('dark')
    }
    
    // Force browser to apply changes immediately
    root.style.colorScheme = newTheme === 'dark' ? 'dark' : 'light'
    root.setAttribute('data-theme', newTheme)
    
    // Force a reflow
    void root.offsetHeight
    
    // Then update state
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)

    if (onThemeChange) {
      onThemeChange(newTheme)
    }

    // Optional: Save to backend (don't block UI)
    try {
      const token = localStorage.getItem('token')
      if (token) {
        fetch(`${API_URL}/user/theme?token=${token}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ theme: newTheme }),
          credentials: 'include',
        }).catch(err => {
          console.error('Failed to save theme to backend:', err)
        })
      }
    } catch (err) {
      console.error('Failed to save theme to backend:', err)
    }
  }

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Theme Settings
      </h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
            Current Theme: <span className="font-medium text-gray-900 dark:text-white capitalize">{theme}</span>
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                theme === 'light'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 dark:bg-gray-700 text-white shadow-md'
                  : 'bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Theme preference is saved in your browser and synced across sessions.
        </p>
      </div>
    </div>
  )
}

