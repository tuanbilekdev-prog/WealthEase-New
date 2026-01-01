'use client'

import { useEffect } from 'react'

interface SmartBillChatTriggerProps {
  onClick: () => void
}

export default function SmartBillChatTrigger({ onClick }: SmartBillChatTriggerProps) {
  useEffect(() => {
    console.log('✅ SmartBill Chat Trigger component mounted and visible')
  }, [])

  return (
    <div 
      className="fixed right-4 md:right-6 top-1/2"
      style={{ 
        transform: 'translateY(-50%)', 
        zIndex: 40,
      }}
    >
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('🖱️ SmartBill Chat Trigger button clicked')
          onClick()
        }}
        className="bg-emerald-green hover:bg-dark-green text-white rounded-full px-4 py-3 shadow-2xl hover:shadow-emerald-green/50 transition-all duration-300 hover:scale-105 flex items-center space-x-2 group cursor-pointer relative"
        aria-label="Buka Bantuan SmartBill"
      >
        <svg
          className="w-5 h-5 flex-shrink-0"
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
        <span className="text-sm font-medium whitespace-nowrap">Bantuan SmartBill</span>
        
        {/* Pulse animation indicator */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
      </button>
    </div>
  )
}

