'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGetStarted = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 dark:from-[#121212] dark:via-[#1E1E1E] dark:to-[#121212] transition-colors duration-200">
      {/* Navbar */}
      <nav className="w-full px-4 sm:px-6 lg:px-8 py-4 bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-green rounded-xl flex items-center justify-center">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200" style={{ fontFamily: 'Inter, sans-serif' }}>
              WealthEase
            </span>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-emerald-green text-white rounded-lg font-medium hover:bg-dark-green transition-colors duration-200 shadow-sm hover:shadow-md"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-24 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-colors duration-200"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Kelola Keuangan{' '}
              <span className="text-emerald-green">Lebih Pintar.</span>
            </h1>
            <p
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed transition-colors duration-200"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Catat transaksi dengan AI Chatbot, kelola Smart Bill otomatis, dan dapatkan insight finansial cerdas untuk mengelola keuanganmu dengan lebih baik.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-emerald-green text-white rounded-xl font-semibold text-lg hover:bg-dark-green transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-4"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Mulai Sekarang
            </button>
          </div>

          {/* Right Illustration - Custom Original Design */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-lg relative">
              <style jsx>{`
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateY(20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                
                @keyframes pulse {
                  0%, 100% {
                    opacity: 0.6;
                    transform: scale(1);
                  }
                  50% {
                    opacity: 1;
                    transform: scale(1.05);
                  }
                }
                
                @keyframes growBar {
                  from {
                    transform: scaleY(0);
                    transform-origin: bottom;
                  }
                  to {
                    transform: scaleY(1);
                    transform-origin: bottom;
                  }
                }
                
                .illustration-container {
                  animation: fadeInUp 0.8s ease-out;
                }
                
                .bar-1 {
                  animation: growBar 0.6s ease-out 0.1s both;
                }
                
                .bar-2 {
                  animation: growBar 0.6s ease-out 0.2s both;
                }
                
                .bar-3 {
                  animation: growBar 0.6s ease-out 0.3s both;
                }
                
                .bar-4 {
                  animation: growBar 0.6s ease-out 0.4s both;
                }
                
                .bar-5 {
                  animation: growBar 0.6s ease-out 0.5s both;
                }
                
                .ai-node {
                  animation: pulse 2s ease-in-out infinite;
                }
                
                .ai-node-delay-1 {
                  animation: pulse 2s ease-in-out 0.3s infinite;
                }
                
                .ai-node-delay-2 {
                  animation: pulse 2s ease-in-out 0.6s infinite;
                }
              `}</style>
              
              {/* Custom SVG Illustration */}
              <svg
                viewBox="0 0 600 500"
                className="w-full h-auto illustration-container"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background Gradient Circles */}
                <defs>
                  <linearGradient id="bgGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D1F2EB" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#E8F8F5" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="bgGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A8E6CF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#D1F2EB" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#1E8449" />
                    <stop offset="100%" stopColor="#2ECC71" />
                  </linearGradient>
                  <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2ECC71" />
                    <stop offset="100%" stopColor="#27AE60" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Background Layers */}
                <circle cx="300" cy="250" r="200" fill="url(#bgGradient1)" />
                <circle cx="300" cy="250" r="160" fill="url(#bgGradient2)" />
                
                {/* Base Line for Chart */}
                <line x1="150" y1="380" x2="450" y2="380" stroke="#B0E0C4" strokeWidth="3" strokeLinecap="round" />

                {/* Growing Bar Chart */}
                <g className="bar-1">
                  <rect x="170" y="280" width="35" height="100" rx="6" fill="url(#barGradient)" opacity="0.85" />
                  <rect x="170" y="280" width="35" height="20" rx="6" fill="#E8F8F5" opacity="0.9" />
                </g>
                
                <g className="bar-2">
                  <rect x="220" y="240" width="35" height="140" rx="6" fill="url(#barGradient)" opacity="0.9" />
                  <rect x="220" y="240" width="35" height="25" rx="6" fill="#E8F8F5" opacity="0.95" />
                </g>
                
                <g className="bar-3">
                  <rect x="270" y="260" width="35" height="120" rx="6" fill="url(#barGradient)" opacity="0.95" />
                  <rect x="270" y="260" width="35" height="22" rx="6" fill="#E8F8F5" opacity="1" />
                </g>
                
                <g className="bar-4">
                  <rect x="320" y="200" width="35" height="180" rx="6" fill="url(#barGradient)" opacity="1" filter="url(#glow)" />
                  <rect x="320" y="200" width="35" height="30" rx="6" fill="#E8F8F5" opacity="1" />
                </g>
                
                <g className="bar-5">
                  <rect x="370" y="230" width="35" height="150" rx="6" fill="url(#barGradient)" opacity="0.9" />
                  <rect x="370" y="230" width="35" height="26" rx="6" fill="#E8F8F5" opacity="0.95" />
                </g>

                {/* Trend Line Connecting Top of Bars */}
                <polyline
                  points="187,280 237,240 287,260 337,200 387,230"
                  fill="none"
                  stroke="#2ECC71"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="0"
                  opacity="0.6"
                />

                {/* AI Neural Network Nodes (Abstract Representation) */}
                <circle cx="300" cy="120" r="28" fill="url(#aiGradient)" className="ai-node" filter="url(#glow)" />
                <circle cx="300" cy="120" r="20" fill="#E8F8F5" opacity="0.3" />
                {/* Inner AI Symbol - Abstract Geometric Shape */}
                <path d="M295 115 L300 105 L305 115 L300 120 Z M295 125 L300 135 L305 125 L300 120 Z" fill="#FFFFFF" opacity="0.9" />
                <circle cx="300" cy="120" r="4" fill="#FFFFFF" />

                {/* Connected AI Nodes */}
                <circle cx="200" cy="140" r="18" fill="#2ECC71" className="ai-node-delay-1" opacity="0.8" />
                <circle cx="200" cy="140" r="12" fill="#E8F8F5" opacity="0.4" />
                <circle cx="200" cy="140" r="5" fill="#FFFFFF" opacity="0.9" />
                
                <circle cx="400" cy="160" r="18" fill="#1E8449" className="ai-node-delay-2" opacity="0.8" />
                <circle cx="400" cy="160" r="12" fill="#E8F8F5" opacity="0.4" />
                <circle cx="400" cy="160" r="5" fill="#FFFFFF" opacity="0.9" />
                
                <circle cx="160" cy="200" r="15" fill="#2ECC71" className="ai-node" opacity="0.7" />
                <circle cx="160" cy="200" r="8" fill="#E8F8F5" opacity="0.5" />
                
                <circle cx="440" cy="220" r="15" fill="#27AE60" className="ai-node-delay-1" opacity="0.7" />
                <circle cx="440" cy="220" r="8" fill="#E8F8F5" opacity="0.5" />

                {/* Connection Lines Between AI Nodes */}
                <line x1="272" y1="128" x2="218" y2="146" stroke="#2ECC71" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
                <line x1="328" y1="128" x2="382" y2="154" stroke="#2ECC71" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
                <line x1="218" y1="146" x2="172" y2="194" stroke="#2ECC71" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
                <line x1="382" y1="154" x2="432" y2="214" stroke="#27AE60" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />

                {/* Financial Growth Indicators - Small Highlights */}
                <circle cx="187" cy="275" r="4" fill="#E8F8F5" opacity="0.9" />
                <circle cx="237" cy="235" r="4" fill="#E8F8F5" opacity="0.9" />
                <circle cx="337" cy="195" r="5" fill="#FFFFFF" opacity="1" />
                <circle cx="337" cy="195" r="8" fill="#E8F8F5" opacity="0.6" />

                {/* Subtle Data Points */}
                <circle cx="287" cy="255" r="3" fill="#A8E6CF" opacity="0.8" />
                <circle cx="387" cy="225" r="3" fill="#A8E6CF" opacity="0.8" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 bg-white/50 dark:bg-[#1E1E1E]/50 transition-colors duration-200">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Fitur Utama
          </h2>
          <p
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors duration-200"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Semua yang Anda butuhkan untuk mengelola keuangan dengan lebih baik
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature Card 1 - AI Chatbot Transaksi */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-emerald-green/10 dark:bg-emerald-green/20 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-emerald-green"
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
            <h3
              className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-200"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              AI Chatbot Transaksi
            </h3>
            <p
              className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-200"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Catat transaksi dengan mudah melalui obrolan alami. Cukup ketik "saya beli makan 50 ribu" dan AI akan otomatis mencatatnya. Mendukung bahasa Indonesia dan format fleksibel.
            </p>
          </div>

          {/* Feature Card 2 - Smart Bill AI */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-emerald-green/10 dark:bg-emerald-green/20 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-emerald-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3
              className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-200"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Smart Bill AI
            </h3>
            <p
              className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-200"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Buat tagihan otomatis dengan AI Chatbot Bill. Katakan "saya akan bayar listrik 500 ribu tanggal 15" dan sistem akan membuat reminder tagihan. Tidak akan lupa bayar tagihan lagi!
            </p>
          </div>

          {/* Feature Card 3 - Laporan & Analytics */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-emerald-green/10 dark:bg-emerald-green/20 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-emerald-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3
              className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-200"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Laporan & Analytics
            </h3>
            <p
              className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-200"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Dapatkan laporan keuangan otomatis dengan visualisasi grafik yang mudah dipahami. Analisis pengeluaran dan pemasukan, plus AI Forecast untuk prediksi keuangan masa depan.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-[#1E1E1E] border-t border-gray-200 dark:border-gray-700 mt-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-green rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span
                className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                WealthEase
              </span>
            </div>
            <div className="text-center md:text-right">
              <p
                className="text-sm text-gray-600 dark:text-gray-400 mb-2 transition-colors duration-200"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                © 2024 WealthEase. All rights reserved.
              </p>
              <p
                className="text-sm text-gray-500 dark:text-gray-500 transition-colors duration-200"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Email: support@wealthease.com
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
