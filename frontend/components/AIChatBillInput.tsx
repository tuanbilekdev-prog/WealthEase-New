'use client'

import { useState, FormEvent, KeyboardEvent } from 'react'

interface AIChatBillInputProps {
  onSendMessage: (message: string) => Promise<void>
  isLoading?: boolean
}

export default function AIChatBillInput({ onSendMessage, isLoading }: AIChatBillInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    const messageToSend = message.trim()
    setMessage('')
    await onSendMessage(messageToSend)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && message.trim()) {
        handleSubmit(e as any)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-[#1E1E1E] rounded-b-2xl">
      <div className="flex items-end space-x-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan Anda... (Contoh: 'Tambahkan tagihan listrik 500 ribu tanggal 15 bulan depan')"
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent"
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="bg-emerald-green hover:bg-dark-green disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center min-w-[100px]"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Mengirim...
            </span>
          ) : (
            'Kirim'
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
      </p>
    </form>
  )
}

