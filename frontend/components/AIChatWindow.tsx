'use client'

import { useEffect, useRef } from 'react'

export interface TransactionData {
  id?: string
  type: 'income' | 'expense'
  amount: number
  name: string
  category: string
  description: string
}

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
  transaction_data?: TransactionData | TransactionData[] | BillData | BillData[] | null
  bill_data?: BillData | BillData[] | null
  created_at?: string
}

interface AIChatWindowProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

export default function AIChatWindow({ messages, isLoading }: AIChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div 
      className="h-full w-full overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-white dark:bg-[#1E1E1E]"
      style={{ 
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">👋 Halo! Saya AI Assistant WealthEase</p>
            <p className="text-sm">Saya bisa membantu Anda membuat transaksi keuangan yang sudah terjadi.</p>
            <p className="text-sm mt-2"><strong>Contoh transaksi:</strong></p>
            <p className="text-sm">• &quot;Saya dapat gaji 5 juta hari ini&quot;</p>
            <p className="text-sm">• &quot;Beli makan siang 50 ribu&quot;</p>
            <p className="text-sm">• &quot;Sudah bayar listrik 500 ribu tadi&quot;</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">💡 Untuk membuat Smart Bill, gunakan AI Chat Bill yang terpisah.</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-emerald-green text-white'
                : 'bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Only show message if it doesn't contain success message AND transaction_data exists (avoid duplicate) */}
            {!(msg.transaction_data && (
              msg.message.includes('berhasil dibuat') || 
              msg.message.includes('Berhasil membuat') ||
              msg.message.match(/✅.*[Tt]ransaksi.*berhasil/i)
            )) && (
              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
            )}
            
            {/* Show simplified message if transaction_data exists */}
            {msg.transaction_data && (
              msg.message.includes('berhasil dibuat') || 
              msg.message.includes('Berhasil membuat') ||
              msg.message.match(/✅.*[Tt]ransaksi.*berhasil/i)
            ) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                ✅ Transaksi berhasil disimpan
              </p>
            )}
            
            {/* Handle transaction data */}
            {msg.transaction_data && !msg.bill_data && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {Array.isArray(msg.transaction_data) ? (
                  // Multiple transactions
                  <div className="space-y-2">
                    <p className="text-xs font-semibold mb-2">
                      ✅ {msg.transaction_data.length} Transaksi dibuat:
                    </p>
                    {msg.transaction_data.map((tx, index) => {
                      // Check if it's a transaction or bill
                      const isBill = 'billName' in tx || 'dueDate' in tx;
                      if (isBill) {
                        const bill = tx as BillData;
                        return (
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
                              {new Date(bill.dueDate).toLocaleDateString('id-ID')}
                            </p>
                            <p>
                              <span className="font-medium">Kategori:</span>{' '}
                              {bill.category}
                            </p>
                          </div>
                        );
                      } else {
                        const transaction = tx as TransactionData;
                        // Only show transaction details if transaction has an ID (actually saved)
                        if (!transaction.id) {
                          return null; // Don't show details if transaction wasn't saved
                        }
                        return (
                          <div key={index} className="bg-gray-50 dark:bg-[#1A1A1A] rounded p-2 text-xs space-y-1">
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {index + 1}. {transaction.name}
                            </p>
                            <p>
                              <span className="font-medium">Tipe:</span>{' '}
                              {transaction.type === 'income' ? 'Pendapatan' : 'Pengeluaran'}
                            </p>
                            <p>
                              <span className="font-medium">Jumlah:</span>{' '}
                              Rp {transaction.amount.toLocaleString('id-ID')}
                            </p>
                            <p>
                              <span className="font-medium">Kategori:</span>{' '}
                              {transaction.category}
                            </p>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  // Single transaction or bill
                  (() => {
                    const data = msg.transaction_data;
                    const isBill = 'billName' in data || 'dueDate' in data;
                    
                    if (isBill) {
                      const bill = data as BillData;
                      return (
                        <div className="text-xs space-y-1">
                          <p className="text-xs font-semibold mb-1">✅ Smart Bill dibuat:</p>
                          <p>
                            <span className="font-medium">Nama Bill:</span>{' '}
                            {bill.billName}
                          </p>
                          <p>
                            <span className="font-medium">Jumlah:</span>{' '}
                            Rp {bill.amount.toLocaleString('id-ID')}
                          </p>
                          <p>
                            <span className="font-medium">Jatuh Tempo:</span>{' '}
                            {new Date(bill.dueDate).toLocaleDateString('id-ID')}
                          </p>
                          <p>
                            <span className="font-medium">Kategori:</span>{' '}
                            {bill.category}
                          </p>
                        </div>
                      );
                    } else {
                      const transaction = data as TransactionData;
                      // Only show transaction details if transaction has an ID (actually saved)
                      if (!transaction.id) {
                        return null; // Don't show details if transaction wasn't saved
                      }
                      return (
                        <div className="text-xs space-y-1">
                          <p className="text-xs font-semibold mb-1 text-emerald-600 dark:text-emerald-400">✅ Transaksi berhasil:</p>
                          <p>
                            <span className="font-medium">Tipe:</span>{' '}
                            {transaction.type === 'income' ? 'Pendapatan' : 'Pengeluaran'}
                          </p>
                          <p>
                            <span className="font-medium">Jumlah:</span>{' '}
                            Rp {transaction.amount.toLocaleString('id-ID')}
                          </p>
                          <p>
                            <span className="font-medium">Kategori:</span>{' '}
                            {transaction.category}
                          </p>
                          <p>
                            <span className="font-medium">Nama:</span>{' '}
                            {transaction.name}
                          </p>
                        </div>
                      );
                    }
                  })()
                )}
              </div>
            )}
            
            {/* Handle bill data (if separate) */}
            {msg.bill_data && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {Array.isArray(msg.bill_data) ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold mb-2">
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
                          {new Date(bill.dueDate).toLocaleDateString('id-ID')}
                        </p>
                        <p>
                          <span className="font-medium">Kategori:</span>{' '}
                          {bill.category}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs space-y-1">
                    <p className="text-xs font-semibold mb-1">✅ Smart Bill dibuat:</p>
                    <p>
                      <span className="font-medium">Nama Bill:</span>{' '}
                      {msg.bill_data.billName}
                    </p>
                    <p>
                      <span className="font-medium">Jumlah:</span>{' '}
                      Rp {msg.bill_data.amount.toLocaleString('id-ID')}
                    </p>
                    <p>
                      <span className="font-medium">Jatuh Tempo:</span>{' '}
                      {new Date(msg.bill_data.dueDate).toLocaleDateString('id-ID')}
                    </p>
                    <p>
                      <span className="font-medium">Kategori:</span>{' '}
                      {msg.bill_data.category}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

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

