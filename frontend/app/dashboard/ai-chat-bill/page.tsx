'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AIChatBillWindow, { ChatMessage } from '@/components/AIChatBillWindow'
import AIChatBillInput from '@/components/AIChatBillInput'

export default function AIChatBillPage() {
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
      const response = await fetch(`${API_URL}/api/ai-chat-bill/history`, {
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
        router.push('/login')
        return
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        
        if (response.status === 404) {
          throw new Error('Endpoint tidak ditemukan. Pastikan backend server sudah di-restart dan route /api/ai-chat-bill/chat tersedia.')
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

      // Debug: Log the entire response
      console.log('📥 [Frontend] ========== RECEIVED RESPONSE ==========');
      console.log('📥 [Frontend] Full response from backend:', JSON.stringify(data, null, 2));
      console.log('📥 [Frontend] needsConfirmation:', data.needsConfirmation);
      console.log('📥 [Frontend] extractedBill:', data.extractedBill);
      console.log('📥 [Frontend] bill:', data.bill);
      console.log('📥 [Frontend] Type of needsConfirmation:', typeof data.needsConfirmation);
      console.log('📥 [Frontend] Type of extractedBill:', typeof data.extractedBill);
      console.log('📥 [Frontend] extractedBill is truthy?', !!data.extractedBill);
      console.log('📥 [Frontend] =======================================');

      // Check if this needs confirmation (extracted data, not created yet)
      // Add explicit check for both conditions
      const shouldRedirect = data.needsConfirmation === true && data.extractedBill !== null && data.extractedBill !== undefined;
      console.log('📥 [Frontend] Should redirect?', shouldRedirect);
      console.log('📥 [Frontend] needsConfirmation === true?', data.needsConfirmation === true);
      console.log('📥 [Frontend] extractedBill exists?', !!data.extractedBill);
      
      if (shouldRedirect) {
        console.log('📋 [Frontend] Extracted bill data needs confirmation:', data.extractedBill);
        
        // Redirect to SmartBill creation page with pre-filled data
        const params = new URLSearchParams({
          billName: data.extractedBill.billName || '',
          amount: (data.extractedBill.amount || 0).toString(),
          due: data.extractedBill.dueDate || '',
          category: data.extractedBill.category || 'utilities',
          desc: data.extractedBill.description || ''
        });
        
        const redirectUrl = `/dashboard/bills?${params.toString()}`;
        console.log('🔄 [Frontend] Redirect URL constructed:', redirectUrl);
        console.log('🔄 [Frontend] Params:', {
          billName: data.extractedBill.billName,
          amount: data.extractedBill.amount,
          due: data.extractedBill.dueDate,
          category: data.extractedBill.category,
          desc: data.extractedBill.description
        });
        
        // Show message and redirect after short delay
        console.log('📥 [Frontend] Setting up redirect timeout...');
        console.log('📥 [Frontend] Redirect URL:', redirectUrl);
        
        // Add AI response to messages first
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          message: data.message,
          role: 'assistant',
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMessage])
        
        // Redirect after short delay - use window.location as fallback
        setTimeout(() => {
          console.log('📥 [Frontend] Executing redirect now to:', redirectUrl);
          try {
            router.push(redirectUrl);
            // Fallback: if router.push doesn't work, use window.location
            setTimeout(() => {
              if (window.location.pathname !== '/dashboard/bills') {
                console.warn('📥 [Frontend] Router.push might have failed, using window.location as fallback');
                window.location.href = redirectUrl;
              }
            }, 500);
          } catch (err) {
            console.error('📥 [Frontend] Error with router.push, using window.location:', err);
            window.location.href = redirectUrl;
          }
        }, 1500);
        
        console.log('📥 [Frontend] Exiting early - redirect scheduled');
        return; // Exit early, don't proceed with normal bill creation flow
      }

      // Handle bill data (single or array) - only for created bills
      let billData = null;
      if (data.bills && Array.isArray(data.bills) && data.bills.length > 0) {
        // Multiple bills
        billData = data.bills;
        console.log('✅ Multiple bills created:', billData);
      } else if (data.bill && data.bill.id) {
        // Single bill (backward compatibility) - check for id to ensure it's a valid bill object
        billData = data.bill;
        console.log('✅ Single bill created:', billData);
      } else {
        console.warn('⚠️ No bill data in response, even though message might indicate success');
        console.warn('Response data:', data);
      }

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        message: data.message,
        role: 'assistant',
        bill_data: billData,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])

      // If bill(s) was created, refresh the page to update bills list
      // Only trigger refresh if bill data actually exists
      if (billData) {
        // Small delay to ensure bill is saved
        setTimeout(() => {
          // Optionally refresh dashboard data or show notification
          console.log('✅ Bill(s) successfully created, triggering refresh:', billData)
          // Trigger a custom event to refresh dashboard data
          window.dispatchEvent(new CustomEvent('billCreated'))
        }, 500)
      } else {
        console.warn('⚠️ Message says success but no bill data found. Bill may not have been created.');
        // Show warning to user
        setError('Pesan sukses diterima, tetapi bill tidak ditemukan. Silakan coba lagi atau cek halaman Bills.')
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
                💬 AI Smart Bill Assistant
              </h1>
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
            <AIChatBillWindow messages={messages} isLoading={isLoading} />
          )}

          {/* Chat Input */}
          <AIChatBillInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-soft-mint dark:bg-[#1E3A2E] border border-emerald-green/20 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Tips menggunakan AI Smart Bill Chat:</h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
            <li>Ketik pesan natural seperti: &quot;Tambahkan tagihan listrik 500 ribu tanggal 15 bulan depan&quot;</li>
            <li>AI akan otomatis membuat Smart Bill berdasarkan pesan Anda</li>
            <li>Smart Bill akan langsung tersimpan ke database</li>
            <li>Anda juga bisa chat biasa dengan AI untuk bertanya tentang bills</li>
            <li>Kategori yang didukung: utilities, subscription, rent, food, others</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

