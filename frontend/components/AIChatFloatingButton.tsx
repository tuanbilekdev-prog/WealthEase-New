'use client'

import { useState } from 'react'
import AIChatModal from './AIChatModal'

export default function AIChatFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-emerald-green hover:bg-dark-green text-white rounded-full p-4 shadow-2xl hover:shadow-emerald-green/50 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
          aria-label="Open AI Chat"
        >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {/* Pulse animation indicator */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
      )}

      {/* Chat Modal */}
      <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

