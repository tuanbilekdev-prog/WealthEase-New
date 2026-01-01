'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ForecastChart from '@/components/ForecastChart'
import ForecastInsight from '@/components/ForecastInsight'

interface ForecastData {
  forecastBalance: number[]
  advice: string[]
  accuracy: number
}

interface ForecastMetadata {
  period: 'weekly' | 'monthly'
  currentBalance: number
  avgMonthlyIncome: number
  avgMonthlyExpense: number
  upcomingBillsTotal: number
  forecastDays: number
}

export default function AIForecastPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly')
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [metadata, setMetadata] = useState<ForecastMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleGenerateForecast = async () => {
    if (!token) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    setError(null)
    setForecastData(null)
    setMetadata(null)

    try {
      const response = await fetch(`${API_URL}/api/ai-forecast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ period })
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        return
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

      if (data.success && data.forecast) {
        setForecastData(data.forecast)
        setMetadata(data.metadata)
      } else {
        throw new Error('Invalid response format from server')
      }
    } catch (err: any) {
      console.error('Error generating forecast:', err)
      setError(err.message || 'Gagal menghasilkan prediksi finansial')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-green mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">Memuat...</p>
        </div>
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
                🔮 AI Finance Forecast & Insight
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selection & Generate Button */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilih Periode Prediksi:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="weekly"
                    checked={period === 'weekly'}
                    onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly')}
                    className="mr-2 text-emerald-green focus:ring-emerald-green"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mingguan (7 hari)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="monthly"
                    checked={period === 'monthly'}
                    onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly')}
                    className="mr-2 text-emerald-green focus:ring-emerald-green"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Bulanan (30 hari)</span>
                </label>
              </div>
            </div>
            <button
              onClick={handleGenerateForecast}
              disabled={isLoading}
              className="bg-emerald-green hover:bg-dark-green disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center min-w-[180px]"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                '🔮 Generate Forecast'
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-6 rounded">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-green mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
              AI sedang menganalisis data finansial Anda...
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              Ini mungkin memakan waktu beberapa detik
            </p>
          </div>
        )}

        {/* Forecast Results */}
        {forecastData && metadata && !isLoading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Pemasukan/Bulan</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400 mt-1">
                  Rp {metadata.avgMonthlyIncome.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Pengeluaran/Bulan</p>
                <p className="text-xl font-semibold text-red-600 dark:text-red-400 mt-1">
                  Rp {metadata.avgMonthlyExpense.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tagihan Mendatang</p>
                <p className="text-xl font-semibold text-orange-600 dark:text-orange-400 mt-1">
                  Rp {metadata.upcomingBillsTotal.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Chart */}
            <ForecastChart
              forecastBalance={forecastData.forecastBalance}
              period={metadata.period}
              currentBalance={metadata.currentBalance}
            />

            {/* Insights */}
            <ForecastInsight
              advice={forecastData.advice}
              accuracy={forecastData.accuracy}
            />
          </div>
        )}

        {/* Empty State */}
        {!forecastData && !isLoading && !error && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">🔮</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              AI Finance Forecast
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Dapatkan prediksi saldo ke depan dan saran finansial berdasarkan pola transaksi dan tagihan Anda.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Pilih periode prediksi di atas dan klik "Generate Forecast" untuk memulai
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

