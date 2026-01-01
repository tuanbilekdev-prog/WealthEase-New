'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BalanceCard from '@/components/BalanceCard'
import RecentTransactions, {
  Transaction,
} from '@/components/RecentTransactions'

type Bill = {
  id: string
  billName: string
  amount: number
  dueDate: string
  category: string
  description: string
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [summary, setSummary] = useState<{
    total_income: number
    total_expense: number
    balance: number
  } | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [financialLoading, setFinancialLoading] = useState(true)
  const [financialError, setFinancialError] = useState<string | null>(null)
  const [activeBills, setActiveBills] = useState<Bill[]>([])
  const [processingBillId, setProcessingBillId] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    // Function to set token and decode user info
    const setTokenAndUser = (tokenValue: string) => {
      setToken(tokenValue)
      try {
        const payload = JSON.parse(atob(tokenValue.split('.')[1]))
        setUser({
          email: payload.email,
          name: payload.name || payload.email,
        })
      } catch (err) {
        console.error('Error decoding token:', err)
      }
    }

    // Get token from URL params (Google OAuth) or localStorage
    const urlToken = searchParams.get('token')

    if (urlToken) {
      // Token from URL (Google OAuth)
      localStorage.setItem('token', urlToken)
      setTokenAndUser(urlToken)
    } else {
      // Check localStorage with multiple attempts to handle race condition
      let attempts = 0
      const maxAttempts = 5
      const checkInterval = 100 // Check every 100ms

      const checkToken = () => {
        attempts++
        const localToken = localStorage.getItem('token')

        if (localToken) {
          // Token found, set it
          setTokenAndUser(localToken)
        } else if (attempts >= maxAttempts) {
          // After max attempts, redirect to login
          console.log('No token found after multiple attempts, redirecting to login')
          router.push('/login')
        } else {
          // Try again after delay
          setTimeout(checkToken, checkInterval)
        }
      }

      // Start checking
      checkToken()
    }
  }, [router, searchParams])

  const fetchFinancialSnapshot = useCallback(async () => {
    try {
      setFinancialError(null)
      setFinancialLoading(true)

      // Get token from localStorage
      const authToken = localStorage.getItem('token')
      if (!authToken) {
        console.error('No token found in localStorage')
        setFinancialError('Please log in to view your financial data')
        setFinancialLoading(false)
        return
      }

      // Prepare headers with JWT token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }

      const [summaryRes, recentRes, billsRes] = await Promise.all([
        fetch(`${API_URL}/transactions/summary`, { headers }),
        fetch(`${API_URL}/transactions/recent`, { headers }),
        fetch(`${API_URL}/bills/active`, { headers }),
      ])

      // Handle 401 Unauthorized - token invalid or expired
      if (summaryRes.status === 401 || recentRes.status === 401 || billsRes.status === 401) {
        console.error('Authentication failed - 401 Unauthorized')
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      if (!summaryRes.ok || !recentRes.ok || !billsRes.ok) {
        // Try to get error message from response
        const errorMessages = await Promise.all([
          summaryRes.json().catch(() => ({ error: 'Failed to load summary' })),
          recentRes.json().catch(() => ({ error: 'Failed to load transactions' })),
          billsRes.json().catch(() => ({ error: 'Failed to load bills' })),
        ])

        const errorMsg = errorMessages.find(msg => msg.error)?.error || 'Failed to load financial data'
        console.error('Failed to load financial data:', errorMsg)
        throw new Error(errorMsg)
      }

      const summaryData = await summaryRes.json()
      const recentData = await recentRes.json()
      const billsData = await billsRes.json()

      setSummary(summaryData)
      setRecentTransactions(recentData)
      setActiveBills(billsData)
    } catch (error) {
      console.error('Error fetching financial snapshot:', error)
      setFinancialError(error instanceof Error ? error.message : 'Unable to load financial snapshot')
    } finally {
      setFinancialLoading(false)
    }
  }, [API_URL, router])

  useEffect(() => {
    // Only fetch if token is available
    if (token) {
      // Small delay to ensure token is fully available
      const timer = setTimeout(() => {
        fetchFinancialSnapshot()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [token, fetchFinancialSnapshot])

  // Listen for transaction created event from AI chat
  useEffect(() => {
    const handleTransactionCreated = () => {
      // Refresh financial data when transaction is created via AI chat
      if (token) {
        fetchFinancialSnapshot()
      }
    }

    window.addEventListener('transactionCreated', handleTransactionCreated)
    return () => {
      window.removeEventListener('transactionCreated', handleTransactionCreated)
    }
  }, [token, fetchFinancialSnapshot])

  // Listen for bill created event from AI chat bill
  useEffect(() => {
    const handleBillCreated = () => {
      // Refresh financial data and bills when bill is created via AI chat
      if (token) {
        fetchFinancialSnapshot()
      }
    }

    window.addEventListener('billCreated', handleBillCreated)
    return () => {
      window.removeEventListener('billCreated', handleBillCreated)
    }
  }, [token, fetchFinancialSnapshot])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleCompleteBill = useCallback(
    async (bill: Bill) => {
      try {
        setProcessingBillId(bill.id)

        // Get token from localStorage
        const authToken = localStorage.getItem('token')
        if (!authToken) {
          throw new Error('No authentication token')
        }

        // Prepare headers with JWT token
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }

        const response = await fetch(`${API_URL}/bills/${bill.id}/complete`, {
          method: 'PATCH',
          headers,
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to complete bill')
        }

        const { amount } = await response.json()

        const decreaseRes = await fetch(`${API_URL}/balance/decrease`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount,
            description: `Bill: ${bill.billName}`,
            category: 'Bills',
            name: bill.billName,
            date: new Date().toISOString(), // Use current timestamp instead of due date
          }),
        })

        if (!decreaseRes.ok) {
          const body = await decreaseRes.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to update balance')
        }

        await decreaseRes.json()
        setActiveBills((prev) => prev.filter((item) => item.id !== bill.id))
        fetchFinancialSnapshot()
      } catch (error) {
        console.error(error)
        setFinancialError('Unable to complete bill. Please try again.')
      } finally {
        setProcessingBillId(null)
      }
    },
    [API_URL, fetchFinancialSnapshot]
  )

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="text-center">
          <p className="text-gray-900 dark:text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <nav className="bg-white dark:bg-[#1E1E1E] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WealthEase</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/settings"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition"
                title="Settings"
              >
                ⚙️
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-green-600 dark:bg-green-500 hover:opacity-90 text-white rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <section
          className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-green-600 via-green-500 to-blue-600 dark:from-green-700 dark:via-green-600 dark:to-blue-700 text-white shadow-2xl p-10"
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.25), transparent 35%)',
            }}
          />
          <div className="relative z-10 space-y-4 text-center md:text-left">
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">
              Dashboard
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold">
              Welcome, {user?.name?.toUpperCase() || user?.email || 'User'}
            </h2>
            <p className="text-white/90 text-base md:text-lg max-w-2xl">
              Your WealthEase workspace is ready. Monitor cash flow, check upcoming bills,
              and take action without leaving this view.
            </p>
          </div>
        </section>

        {financialError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl px-4 py-3 text-center">
            {financialError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white dark:bg-[#1E1E1E] backdrop-blur rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Financial Snapshot
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Track your balance and latest activity at a glance
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <BalanceCard
                totalIncome={summary?.total_income ?? 0}
                totalExpense={summary?.total_expense ?? 0}
                balance={summary?.balance ?? 0}
              />

              <div className="bg-white dark:bg-[#121212] rounded-3xl p-4 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                <RecentTransactions
                  transactions={recentTransactions}
                  limit={5}
                  title="Recent Activity"
                  subtitle={
                    financialLoading
                      ? 'Loading...'
                      : 'Most recent 5 transactions'
                  }
                  emptyMessage="No transactions yet. Head to the transactions page to add your first record."
                  actionSlot={
                    <Link
                      href="/dashboard/transactions"
                      className="text-sm font-medium text-green-600 dark:text-green-400 hover:opacity-80"
                    >
                      View all
                    </Link>
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Need to log a new income or expense? Jump straight to the
                transaction center.
              </p>
              <Link
                href="/dashboard/transactions"
                className="block text-center rounded-2xl bg-green-600 dark:bg-green-500 text-white font-semibold py-2.5 hover:opacity-90 transition"
              >
                New Transaction
              </Link>
              <p className="pt-2">
                Stay ahead on your bills and automate reminders with the Smart Bill Center.
              </p>
              <Link
                href="/dashboard/bills"
                className="block text-center rounded-2xl border border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 font-semibold py-2.5 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
              >
                Add Smart Bill
              </Link>
              <Link
                href="/dashboard/ai-forecast"
                className="block text-center rounded-2xl border border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
              >
                🔮 AI Forecast
              </Link>
              <Link
                href="/analytics"
                className="block text-center rounded-2xl border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                📊 Finance Analytics Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <header className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Smart Bill Center
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Upcoming bills synced with your reminder center
              </p>
            </div>
            <Link
              href="/dashboard/bills"
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-green-600 dark:bg-green-500 text-white text-sm font-semibold hover:opacity-90 transition shadow-md hover:shadow-lg"
            >
              Manage Bills
            </Link>
          </header>

          {activeBills.length === 0 ? (
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl border border-gray-200 dark:border-gray-700 py-8 text-center text-gray-500 dark:text-gray-400">
              No bills due yet. Add reminders in the bill center.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {activeBills.slice(0, 3).map((bill) => (
                <div
                  key={bill.id}
                  className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-5 border border-gray-200 dark:border-gray-700 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {bill.billName}
                    </p>
                    <span className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                      {new Date(bill.dueDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {bill.category} · {bill.description}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(bill.amount)}
                  </p>
                  <button
                    onClick={() => handleCompleteBill(bill)}
                    disabled={processingBillId === bill.id}
                    className="mt-2 inline-flex items-center justify-center rounded-xl bg-green-600 dark:bg-green-500 px-4 py-2 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
                  >
                    {processingBillId === bill.id ? 'Processing...' : 'Mark as Done'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="text-center">
          <p className="text-gray-900 dark:text-white">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

