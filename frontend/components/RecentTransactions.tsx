'use client'

import { ReactNode } from 'react'

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  name: string
  category: string
  description: string
  date: string
  created_at: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  title?: string
  subtitle?: string
  limit?: number
  emptyMessage?: string
  actionSlot?: ReactNode
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)

const formatDate = (date: string) =>
  new Date(date).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export default function RecentTransactions({
  transactions,
  title = 'Recent Transactions',
  subtitle = 'Showing latest 10 records',
  limit,
  emptyMessage = 'No transactions yet. Start by adding your first record!',
  actionSlot,
}: RecentTransactionsProps) {
  const data = limit ? transactions.slice(0, limit) : transactions

  if (!data.length) {
    return (
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actionSlot}
      </div>

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.map((transaction) => (
          <li key={transaction.id} className="py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span
                className={`text-xs font-semibold uppercase tracking-[0.3em] px-3 py-1 rounded-full ${
                  transaction.type === 'income'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {transaction.type}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(transaction.date)}
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {transaction.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {transaction.category} · {transaction.description}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    transaction.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

