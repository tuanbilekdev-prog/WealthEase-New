'use client'

import { useState, useEffect, useCallback } from 'react'
import AIChatBillWindow, { ChatMessage } from './AIChatBillWindow'
import AIChatBillInput from './AIChatBillInput'

interface SmartBillChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  onExtractedBill?: (billData: {
    billName: string
    amount: number
    dueDate: string
    category: string
    description: string
  }) => void
}

export default function SmartBillChatDrawer({ isOpen, onClose, onExtractedBill }: SmartBillChatDrawerProps) {
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
        setError('Tidak ada token autentikasi')
        return
      }
      setToken(storedToken)
    }

    checkAuth()
  }, [])

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!token || !isOpen) return

    try {
      setIsLoadingHistory(true)
      setError(null) // Clear any previous errors
      
      const response = await fetch(`${API_URL}/api/ai-chat-bill/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        setError('Sesi telah berakhir, silakan login kembali')
        setIsLoadingHistory(false)
        return
      }

      if (!response.ok) {
        // If error, don't set main error, just log and continue with empty history
        console.warn('⚠️ Failed to load chat history:', response.status)
        setMessages([])
        setIsLoadingHistory(false)
        return
      }

      const data = await response.json()
      setMessages(data.history || [])
    } catch (err: any) {
      console.error('Error loading chat history:', err)
      // Don't set error for history loading failure, just continue with empty history
      // Only show error if it's a network error (not just history loading)
      if (err.message && err.message.includes('fetch')) {
        // Network error - might be backend not running, but don't block the UI
        console.warn('⚠️ Could not load chat history - backend may not be running')
      }
      setMessages([])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [token, API_URL, isOpen])

  useEffect(() => {
    if (token && isOpen) {
      loadChatHistory()
    }
  }, [token, isOpen, loadChatHistory])

  const handleSendMessage = useCallback(async (message: string) => {
    if (!token) {
      setError('Tidak ada token autentikasi')
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
      const response = await fetch(`${API_URL}/api/ai-chat-bill/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        setError('Sesi telah berakhir, silakan login kembali')
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()

      // Handle extracted bill data (needs form confirmation)
      if (data.needsConfirmation === true && data.extractedBill) {
        console.log('📋 [Drawer] Extracted bill received, pre-filling form:', data.extractedBill)
        
        // Call callback to pre-fill form
        if (onExtractedBill) {
          onExtractedBill({
            billName: data.extractedBill.billName || '',
            amount: data.extractedBill.amount || 0,
            dueDate: data.extractedBill.dueDate || '',
            category: data.extractedBill.category || 'utilities',
            description: data.extractedBill.description || ''
          })
        }
        
        // Store extracted bill separately (not as bill_data, which is for created bills)
        // We'll pass it as extracted_bill_data to distinguish it
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          message: data.message,
          role: 'assistant',
          bill_data: null, // Don't set bill_data for extracted bills (not created yet)
          extracted_bill_data: data.extractedBill, // Store extracted data separately
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        // Handle created bill data (already created, has id)
        let billData = null
        if (data.bills && Array.isArray(data.bills) && data.bills.length > 0) {
          billData = data.bills
        } else if (data.bill && data.bill.id) {
          billData = data.bill
        }

        // Add AI response to messages
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          message: data.message,
          role: 'assistant',
          bill_data: billData, // Only set if bill was created (has id)
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMessage])
        
        // If bill(s) was created (has id), refresh bills
        if (billData && (billData.id || (Array.isArray(billData) && billData[0]?.id))) {
          setTimeout(() => {
            console.log('Bill(s) created:', billData)
            window.dispatchEvent(new CustomEvent('billCreated'))
          }, 500)
        }
      }

    } catch (err: any) {
      console.error('Error sending message:', err)
      
      // More specific error messages
      let errorMessage = 'Gagal mengirim pesan'
      if (err.message) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Gagal terhubung ke server. Pastikan backend server berjalan di http://localhost:5000'
        } else if (err.message.includes('401')) {
          errorMessage = 'Sesi telah berakhir, silakan login kembali'
          localStorage.removeItem('token')
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [token, API_URL])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[90%] sm:max-w-[400px] md:max-w-[35%] bg-white dark:bg-[#1E1E1E] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ minWidth: '300px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-emerald-green/10 dark:bg-emerald-green/20 flex-shrink-0">
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
                  Asisten SmartBill
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bantuan untuk membuat Smart Bill
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Close drawer"
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
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 m-4 rounded flex-shrink-0">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Chat Window */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-green mx-auto mb-2"></div>
                  <p className="text-gray-500 dark:text-gray-400">Memuat riwayat chat...</p>
                </div>
              </div>
            ) : (
              <AIChatBillWindow messages={messages} isLoading={isLoading} />
            )}
          </div>

          {/* Chat Input */}
          <div className="flex-shrink-0">
            <AIChatBillInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </>
  )
}

