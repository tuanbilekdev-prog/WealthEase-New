'use client'

interface BalanceCardProps {
  totalIncome: number
  totalExpense: number
  balance: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)

export default function BalanceCard({
  totalIncome,
  totalExpense,
  balance,
}: BalanceCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-3xl shadow-inner p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
        Current Balance
      </p>
      <h3 className="text-4xl font-semibold text-gray-900 dark:text-white mt-2">
        {formatCurrency(balance)}
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Total Income</p>
          <p className="text-green-600 dark:text-green-400 font-semibold mt-1">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Total Expense</p>
          <p className="text-red-600 dark:text-red-400 font-semibold mt-1">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>
    </div>
  )
}

