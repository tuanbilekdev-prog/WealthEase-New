'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TransactionForm, {
  TransactionPayload,
} from '@/components/TransactionForm'
import BalanceCard from '@/components/BalanceCard'
import RecentTransactions, {
  Transaction,
} from '@/components/RecentTransactions'

interface Summary {
  total_income: number
  total_expense: number
  balance: number
}

function TransactionsContent() {
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const [summary, setSummary] = useState<Summary>({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = checking, true = authenticated, false = not authenticated

  // Check authentication on mount
  useEffect(() => {
    // Add small delay to ensure token is available after login redirect
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsAuthenticated(false)
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
    }

    // Small delay to handle race condition after login
    const timer = setTimeout(checkAuth, 50)
    return () => clearTimeout(timer)
  }, [router])

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      // Get token from localStorage
      const authToken = localStorage.getItem('token')
      if (!authToken) {
        setIsAuthenticated(false)
        router.push('/login')
        return
      }

      // Prepare headers with JWT token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }

      const [summaryRes, recentRes] = await Promise.all([
        fetch(`${API_URL}/transactions/summary`, { headers }),
        fetch(`${API_URL}/transactions/recent`, { headers }),
      ])

      // Handle 401 Unauthorized - token invalid or expired
      if (summaryRes.status === 401 || recentRes.status === 401) {
        localStorage.removeItem('token')
        setIsAuthenticated(false)
        router.push('/login')
        return
      }

      if (!summaryRes.ok || !recentRes.ok) {
        const errorData = await summaryRes.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch transaction data')
      }

      const summaryData = await summaryRes.json()
      const recentData = await recentRes.json()

      setSummary(summaryData)
      setTransactions(recentData)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unable to load transactions')
    } finally {
      setLoading(false)
    }
  }, [API_URL, router])

  useEffect(() => {
    // Only fetch data if authenticated
    if (isAuthenticated === true) {
      fetchData()
    }
  }, [fetchData, isAuthenticated])

  const handleAddTransaction = async (payload: TransactionPayload) => {
    // Get token from localStorage
    const authToken = localStorage.getItem('token')
    if (!authToken) {
      router.push('/login')
      throw new Error('No authentication token. Please log in again.')
    }

    // Prepare headers with JWT token
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }

    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    // Handle 401 Unauthorized - token invalid or expired
    if (response.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
      throw new Error('Session expired. Please log in again.')
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      const errorMessage = errorBody.error || 'Failed to add transaction'
      const errorDetails = errorBody.details ? `: ${errorBody.details}` : ''
      throw new Error(`${errorMessage}${errorDetails}`)
    }

    await fetchData()
  }

  // Don't render if not authenticated (will redirect)
  // null = still checking, false = not authenticated, true = authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <p className="text-light-text dark:text-dark-text">Redirecting to login...</p>
      </div>
    )
  }

  // Still checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <p className="text-light-text dark:text-dark-text">Loading...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <p className="text-light-text dark:text-dark-text">Loading transactions...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Back to Dashboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">
              Financial Transactions
            </h1>
          </div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary ml-12">
            Track your income and expenses seamlessly
          </p>
        </header>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl px-4 py-3 text-center">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <BalanceCard
              totalIncome={summary.total_income}
              totalExpense={summary.total_expense}
              balance={summary.balance}
            />
          </div>
          <TransactionForm onSubmit={handleAddTransaction} />
        </div>

        <RecentTransactions transactions={transactions} />
      </main>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
          <p className="text-light-text dark:text-dark-text">Loading transactions...</p>
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  )
}

