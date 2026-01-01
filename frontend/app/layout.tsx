import type { Metadata } from 'next'
import './globals.css'
import ThemeScript from './theme-script'

export const metadata: Metadata = {
  title: 'WealthEase - Financial Management',
  description: 'Kelola keuangan dengan mudah. Catat transaksi via AI Chatbot, kelola Smart Bill otomatis, dan dapatkan insight finansial cerdas.',
  manifest: '/manifest.json',
  themeColor: '#2ECC71',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WealthEase',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2ECC71" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WealthEase" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  )
}

