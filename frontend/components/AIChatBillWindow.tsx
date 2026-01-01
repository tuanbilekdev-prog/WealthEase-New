'use client'

import { useEffect, useRef } from 'react'

export interface BillData {
  id?: string
  billName: string
  amount: number
  dueDate: string
  category: string
  description: string
  completed?: boolean
}

export interface ChatMessage {
  id: string
  message: string
  role: 'user' | 'assistant'
  bill_data?: BillData | BillData[] | null
  extracted_bill_data?: BillData | null // For extracted bills that need confirmation
  created_at?: string
}

interface AIChatBillWindowProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

export default function AIChatBillWindow({ messages, isLoading }: AIChatBillWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      utilities: 'Utilities',
      subscription: 'Subscription',
      rent: 'Rent',
      food: 'Food',
      others: 'Others'
    }
    return labels[category] || category
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-white dark:bg-[#1E1E1E]">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 min-h-[400px]">
          <div className="text-center">
            <p className="text-lg mb-2">👋 Halo! Saya AI Assistant untuk Smart Bill</p>
            <p className="text-sm">Saya bisa membantu Anda membuat Smart Bill melalui chat.</p>
            <p className="text-sm mt-2">Contoh: &quot;Tambahkan tagihan listrik 500 ribu tanggal 15 bulan depan&quot; atau &quot;Reminder Netflix 150 ribu setiap tanggal 1&quot;</p>
          </div>
        </div>
      )}

      {messages.map((msg) => {
        // Only trigger refresh for created bills (has id), not extracted bills
        if (msg.bill_data && msg.role === 'assistant') {
          const hasId = Array.isArray(msg.bill_data) 
            ? msg.bill_data.some(b => b.id)
            : msg.bill_data.id;
          
          if (hasId && typeof window !== 'undefined') {
            // Dispatch event to refresh dashboard only for created bills
            window.dispatchEvent(new Event('billCreated'));
            window.dispatchEvent(new CustomEvent('refreshData'));
          }
        }

        return (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user'
                  ? 'bg-emerald-green text-white'
                  : 'bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>

              {/* Display extracted bill data (needs confirmation) */}
              {msg.extracted_bill_data && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs space-y-1 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                    <p className="text-xs font-semibold mb-1 text-blue-700 dark:text-blue-300">
                      📋 Bill Anda:
                    </p>
                    <p>
                      <span className="font-medium">Nama:</span>{' '}
                      {msg.extracted_bill_data.billName}
                    </p>
                    <p>
                      <span className="font-medium">Jumlah:</span>{' '}
                      Rp {msg.extracted_bill_data.amount.toLocaleString('id-ID')}
                    </p>
                    <p>
                      <span className="font-medium">Jatuh Tempo:</span>{' '}
                      {formatDate(msg.extracted_bill_data.dueDate)}
                    </p>
                    <p>
                      <span className="font-medium">Kategori:</span>{' '}
                      {getCategoryLabel(msg.extracted_bill_data.category)}
                    </p>
                    <p>
                      <span className="font-medium">Deskripsi:</span>{' '}
                      {msg.extracted_bill_data.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Display created bill data (already created) */}
              {msg.bill_data && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {Array.isArray(msg.bill_data) ? (
                    // Multiple bills
                    <div className="space-y-2">
                      <p className="text-xs font-semibold mb-2 text-emerald-600 dark:text-emerald-400">
                        ✅ {msg.bill_data.length} Smart Bill dibuat:
                      </p>
                      {msg.bill_data.map((bill, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-[#1A1A1A] rounded p-2 text-xs space-y-1">
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {index + 1}. {bill.billName}
                          </p>
                          <p>
                            <span className="font-medium">Jumlah:</span>{' '}
                            Rp {bill.amount.toLocaleString('id-ID')}
                          </p>
                          <p>
                            <span className="font-medium">Jatuh Tempo:</span>{' '}
                            {formatDate(bill.dueDate)}
                          </p>
                          <p>
                            <span className="font-medium">Kategori:</span>{' '}
                            {getCategoryLabel(bill.category)}
                          </p>
                          <p>
                            <span className="font-medium">Deskripsi:</span>{' '}
                            {bill.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single bill
                    <div className="text-xs space-y-1 bg-emerald-50 dark:bg-emerald-900/20 rounded p-2">
                      <p className="text-xs font-semibold mb-1 text-emerald-700 dark:text-emerald-300">
                        ✅ Smart Bill dibuat:
                      </p>
                      <p>
                        <span className="font-medium">Nama:</span>{' '}
                        {msg.bill_data.billName}
                      </p>
                      <p>
                        <span className="font-medium">Jumlah:</span>{' '}
                        Rp {msg.bill_data.amount.toLocaleString('id-ID')}
                      </p>
                      <p>
                        <span className="font-medium">Jatuh Tempo:</span>{' '}
                        {formatDate(msg.bill_data.dueDate)}
                      </p>
                      <p>
                        <span className="font-medium">Kategori:</span>{' '}
                        {getCategoryLabel(msg.bill_data.category)}
                      </p>
                      <p>
                        <span className="font-medium">Deskripsi:</span>{' '}
                        {msg.bill_data.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">AI sedang mengetik...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

