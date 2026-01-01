'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AIChatWindow, { ChatMessage } from '@/components/AIChatWindow'
import AIChatInput from '@/components/AIChatInput'

export default function AIChatPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        router.push('/login')
        return
      }
      setToken(storedToken)
    }

    checkAuth()
  }, [router])

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!token) return

    try {
      setIsLoadingHistory(true)
      const response = await fetch(`${API_URL}/api/ai-chat/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load chat history')
      }

      const data = await response.json()
      setMessages(data.history || [])
    } catch (err) {
      console.error('Error loading chat history:', err)
      setError('Gagal memuat riwayat chat')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [token, API_URL, router])

  useEffect(() => {
    if (token) {
      loadChatHistory()
    }
  }, [token, loadChatHistory])

  const handleSendMessage = useCallback(async (message: string) => {
    // FORCE LOG - This must appear! Use simple log without emoji
    console.log('[Frontend] handleSendMessage CALLED');
    console.log('[Frontend] Message:', message);
    console.log('[Frontend] Token exists?', !!token);
    console.log('[Frontend] Function called at:', new Date().toISOString());
    
    // Also use alert for testing (can remove later)
    // alert('handleSendMessage called with: ' + message);
    
    if (!token) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    setError(null)
    console.log('🚀 [Frontend] Starting to send message to backend...')

    // Add user message immediately to UI
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: message,
      role: 'user',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch(`${API_URL}/api/ai-chat/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        
        if (response.status === 404) {
          throw new Error('Endpoint tidak ditemukan. Pastikan backend server sudah di-restart dan route /api/ai-chat/chat tersedia.')
        }
        
        throw new Error(`Server mengembalikan response non-JSON (Status: ${response.status}). Pastikan backend server berjalan dengan benar.`)
      }

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()

      // Handle transaction data (single or array)
      let transactionData = null;
      if (data.transactions && Array.isArray(data.transactions)) {
        // Multiple transactions
        transactionData = data.transactions;
      } else if (data.transaction) {
        // Single transaction (backward compatibility)
        transactionData = data.transaction;
      }

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        message: data.message,
        role: 'assistant',
        transaction_data: transactionData,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])

      // If transaction(s) was created, refresh the page to update balance
      if (transactionData) {
        // Small delay to ensure transaction is saved
        setTimeout(() => {
          console.log('Transaction(s) created:', transactionData)
          // Trigger a custom event to refresh dashboard data
          window.dispatchEvent(new CustomEvent('transactionCreated'))
        }, 500)
      }
    } catch (err: any) {
      console.error('Error sending message:', err)
      
      // Better error message
      let errorMessage = 'Gagal mengirim pesan'
      if (err.message) {
        errorMessage = err.message
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend server berjalan di http://localhost:5000'
      }
      
      setError(errorMessage)
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [token, router, API_URL])

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Memuat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Kembali ke Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                💬 AI Chat Assistant
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                Buat transaksi melalui chat
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 m-4 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Chat Window */}
          {isLoadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-green mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Memuat riwayat chat...</p>
              </div>
            </div>
          ) : (
            <AIChatWindow messages={messages} isLoading={isLoading} />
          )}

          {/* Chat Input */}
          <AIChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-soft-mint dark:bg-[#1E3A2E] border border-emerald-green/20 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Tips menggunakan AI Chat:</h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
            <li><strong>Transaksi:</strong> &quot;Saya dapat gaji 5 juta hari ini&quot; atau &quot;Beli makan siang 50 ribu&quot;</li>
            <li>AI akan otomatis membuat transaksi berdasarkan pesan Anda</li>
            <li>Untuk membuat Smart Bill, gunakan halaman AI Chat Bill terpisah</li>
            <li>Anda juga bisa chat biasa dengan AI untuk bertanya tentang keuangan</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

