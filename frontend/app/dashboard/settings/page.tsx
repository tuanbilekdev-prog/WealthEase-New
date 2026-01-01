'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import UserProfile from '@/components/UserProfile'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import ClearDataModal from '@/components/settings/ClearDataModal'
import AvatarPicker from '@/components/settings/AvatarPicker'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

function SettingsContent() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleConfirmClear = async () => {
    try {
      setIsClearing(true)
      setFeedback(null)

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('User tidak terautentikasi. Silakan login ulang.')
      }

      const response = await fetch(`${API_URL}/api/clear-data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Gagal menghapus data finansial.')
      }

      setFeedback({ type: 'success', message: 'Semua data finansial berhasil dihapus!' })
      // Dispatch events to refresh all components
      window.dispatchEvent(new Event('transactionCreated'))
      window.dispatchEvent(new Event('billCreated'))
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus data.',
      })
    } finally {
      setIsClearing(false)
      setShowModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-200">
      <nav className="bg-white dark:bg-[#1E1E1E] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Back to Dashboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WealthEase</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-green-600 dark:bg-green-500 hover:opacity-90 text-white rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your account preferences and application settings
          </p>
        </div>

        {feedback && (
          <div
            className={`rounded-2xl px-4 py-3 border text-sm ${feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900 dark:text-red-200'
              }`}
          >
            {feedback.message}
          </div>
        )}

        <AvatarPicker user={user} loading={userLoading} />

        <div className="grid gap-6 md:grid-cols-2">
          <UserProfile onUserLoaded={(loadedUser) => {
            setUser(loadedUser)
            setUserLoading(false)
          }} />
          <ThemeSwitcher />
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Settings</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            More settings and preferences will be available in future updates.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl border border-red-200 dark:border-red-800 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Hapus seluruh data finansial (transaksi, Smart Bill, histori AI) tanpa menghapus akun Anda. Tindakan ini tidak
            dapat dibatalkan.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
          >
            ⚠️ Clear All Financial Data
          </button>
        </div>
      </main>

      <ClearDataModal
        isOpen={showModal}
        isProcessing={isClearing}
        onConfirm={handleConfirmClear}
        onCancel={() => {
          if (!isClearing) {
            setShowModal(false)
          }
        }}
      />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
          <div className="text-center">
            <p className="text-gray-900 dark:text-white">Loading settings...</p>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}

