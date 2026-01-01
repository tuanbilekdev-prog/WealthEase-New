'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Filters from '@/components/analytics/Filters'
import StatsCards from '@/components/analytics/StatsCards'
import LineChart from '@/components/analytics/LineChart'
import BarChart from '@/components/analytics/BarChart'
import PieChart from '@/components/analytics/PieChart'
import DonutChart from '@/components/analytics/DonutChart'
import { supabase } from '@/lib/supabaseClient'

type ChartSummary = {
  balanceTrend: { label: string; balance: number; income: number; expense: number }[]
  expensesByCategory: { category: string; amount: number }[]
  expenseComposition: { name: string; value: number }[]
  budgetUsage: { data: { name: string; value: number }[]; limit: number; used: number; remaining: number }
}

type AnalyticsStats = {
  currentBalance: number
  totalIncome: number
  totalExpense: number
  spendingRate: number
  highestExpenseCategory: { category: string; amount: number }
  weeklyTransactionCount: number
  transactionCount: number
}

type Transaction = {
  id: string
  name: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export default function AnalyticsPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [period, setPeriod] = useState('monthly')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('latest')
  const [categories, setCategories] = useState<string[]>(['all'])

  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [charts, setCharts] = useState<ChartSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      router.push('/login')
      return
    }

    setToken(storedToken)
    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]))
      setUserId(payload?.userId || payload?.id || payload?.email || null)
    } catch (decodeError) {
      console.error('Failed to decode token', decodeError)
      router.push('/login')
    }
  }, [router])

  const fetchAnalyticsData = useCallback(async () => {
    if (!token) return

    try {
      setIsLoading(true)
      setError(null)

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const params = new URLSearchParams({
        period,
        category,
        sort,
      })

      const [summaryRes, transactionsRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/summary?${params.toString()}`, { headers }),
        fetch(`${API_URL}/api/analytics/transactions?${params.toString()}`, { headers }),
      ])

      if (!summaryRes.ok) {
        const err = await summaryRes.json().catch(() => ({ error: 'Failed to load summary' }))
        throw new Error(err.error || 'Failed to load summary')
      }

      if (!transactionsRes.ok) {
        const err = await transactionsRes.json().catch(() => ({ error: 'Failed to load transactions' }))
        throw new Error(err.error || 'Failed to load transactions')
      }

      const summaryData = await summaryRes.json()
      const transactionData = await transactionsRes.json()

      setStats(summaryData.stats)
      setCharts(summaryData.charts)
      setCategories(summaryData.meta?.categories || ['all'])
      setTransactions(transactionData.transactions || [])
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }, [token, period, category, sort])

  useEffect(() => {
    if (token) {
      fetchAnalyticsData()
    }
  }, [token, fetchAnalyticsData])

  useEffect(() => {
    if (!userId || !supabase) return

    const channel = supabase
      .channel('realtime:analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => {
          fetchAnalyticsData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'balance', filter: `user_id=eq.${userId}` },
        () => {
          fetchAnalyticsData()
        }
      )
      .subscribe()

    return () => {
      if (supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, fetchAnalyticsData])

  const statsCards = useMemo(() => {
    if (!stats) return []
    return [
      {
        title: 'Current Balance',
        value: formatCurrency(stats.currentBalance),
        subtitle: 'Saldo real-time',
        icon: '💰',
      },
      {
        title: 'Total Income',
        value: formatCurrency(stats.totalIncome),
        subtitle: `Periode ${period}`,
        icon: '📈',
      },
      {
        title: 'Total Expenses',
        value: formatCurrency(stats.totalExpense),
        subtitle: `Periode ${period}`,
        icon: '💸',
      },
      {
        title: 'Spending Rate',
        value: `${stats.spendingRate}%`,
        subtitle: 'Income vs Expense',
        icon: '⚖️',
      },
      {
        title: 'Highest Expense Category',
        value: stats.highestExpenseCategory?.category || '-',
        subtitle: formatCurrency(stats.highestExpenseCategory?.amount || 0),
        icon: '🏷️',
      },
      {
        title: 'Transactions (7 days)',
        value: stats.weeklyTransactionCount.toString(),
        subtitle: 'Minggu ini',
        icon: '🗂️',
      },
    ]
  }, [stats, period])

  const handleFilterChange = (payload: { period?: string; category?: string; sort?: string }) => {
    if (payload.period) setPeriod(payload.period)
    if (payload.category) setCategory(payload.category)
    if (payload.sort) setSort(payload.sort)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-2">
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
            <p className="text-sm uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
              Real-Time Analytics
            </p>
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-white">Finance Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Visualisasi interaktif untuk membantu Anda menganalisa pemasukan, pengeluaran, dan tren finansial secara mandiri tanpa insight otomatis.
          </p>
        </header>

        <Filters period={period} category={category} sort={sort} categories={categories} onChange={handleFilterChange} />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <StatsCards stats={statsCards} />

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white dark:bg-[#1E1E1E] rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Balance Trend</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pergerakan saldo sesuai filter periode</p>
              </div>
            </div>
            <LineChart data={charts?.balanceTrend || []} />
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Budget Usage</h3>
            <DonutChart
              data={charts?.budgetUsage?.data || [
                { name: 'Terpakai', value: charts?.budgetUsage?.used || 0 },
                { name: 'Sisa', value: charts?.budgetUsage?.remaining || 0 },
              ]}
              limit={charts?.budgetUsage?.limit || 0}
              used={charts?.budgetUsage?.used || 0}
              remaining={charts?.budgetUsage?.remaining || 0}
            />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Expenses by Category</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total kategori: {charts?.expensesByCategory.length || 0}
              </span>
            </div>
            <BarChart data={charts?.expensesByCategory || []} />
          </div>
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Expense Composition</h3>
            <PieChart data={charts?.expenseComposition || []} />
          </div>
        </section>

        <section className="bg-white dark:bg-[#1E1E1E] rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Filtered Transactions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {transactions.length} transaksi ditemukan untuk periode ini
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{transaction.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.category} • {formatDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={`font-semibold ${transaction.type === 'income' ? 'text-emerald-500' : 'text-red-400'
                    }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}

            {!transactions.length && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
                Tidak ada transaksi pada filter ini.
              </div>
            )}
          </div>
        </section>

        {isLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white text-sm">
            Memuat data analitik...
          </div>
        )}
      </div>
    </div>
  )
}


