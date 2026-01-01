'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AIChatWindow, { ChatMessage } from './AIChatWindow'
import AIChatInput from './AIChatInput'

interface AIChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    if (isOpen) {
      // Check authentication when modal opens
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        router.push('/login')
        return
      }
      setToken(storedToken)
      
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Re-enable body scroll when modal is closed
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup: re-enable scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, router])

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!token || !isOpen) return

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
  }, [token, API_URL, router, isOpen])

  useEffect(() => {
    if (token && isOpen) {
      loadChatHistory()
    }
  }, [token, isOpen, loadChatHistory])

  const handleSendMessage = async (message: string) => {
    if (!token) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    setError(null)

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
        transactionData = data.transactions;
      } else if (data.transaction) {
        transactionData = data.transaction;
      }

      // Handle bill data (single or array)
      let billData = null;
      if (data.bills && Array.isArray(data.bills)) {
        billData = data.bills;
      } else if (data.bill) {
        billData = data.bill;
      }

      // If bill data is stored in transaction_data (for compatibility)
      if (!billData && transactionData) {
        const firstItem = Array.isArray(transactionData) ? transactionData[0] : transactionData;
        if (firstItem && ('billName' in firstItem || 'dueDate' in firstItem)) {
          billData = transactionData;
          transactionData = null;
        }
      }

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        message: data.message,
        role: 'assistant',
        transaction_data: transactionData,
        bill_data: billData,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])

      // If transaction(s) was created, refresh the page to update balance
      if (transactionData) {
        setTimeout(() => {
          console.log('Transaction(s) created:', transactionData)
          window.dispatchEvent(new CustomEvent('transactionCreated'))
        }, 500)
      }

      // If bill(s) was created, refresh bills page
      if (billData) {
        setTimeout(() => {
          console.log('Bill(s) created:', billData)
          window.dispatchEvent(new CustomEvent('billCreated'))
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
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl h-[85vh] max-h-[700px] bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-10 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          // Only stop propagation if scrolling at the modal level (not in chat window)
          const target = e.target as HTMLElement
          if (!target.closest('.overflow-y-auto')) {
            e.stopPropagation()
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-emerald-green/10 dark:bg-emerald-green/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-green rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Chat Assistant
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Buat transaksi dan Smart Bill melalui chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3 mx-4 mt-4 rounded">
            <p className="font-medium text-sm">Error</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Chat Window */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-green mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Memuat riwayat chat...</p>
              </div>
            </div>
          ) : (
            <AIChatWindow messages={messages} isLoading={isLoading} />
          )}
        </div>

        {/* Chat Input */}
        <AIChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}

