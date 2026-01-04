'use client'

interface BalanceCardProps {
  totalIncome: number
  totalExpense: number
  balance: number
  accounts?: {
    cash: number
    ewallet: number
    bank: number
  }
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
  accounts,
}: BalanceCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-3xl shadow-inner p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
        Current Balance
      </p>
      <h3 className="text-4xl font-semibold text-gray-900 dark:text-white mt-2">
        {formatCurrency(balance)}
      </h3>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
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

      {accounts && (
        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-lg">💵</span>
              <p className="text-gray-500 dark:text-gray-400">Cash</p>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(accounts.cash)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-lg">📱</span>
              <p className="text-gray-500 dark:text-gray-400">E-Wallet</p>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(accounts.ewallet)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#121212] rounded-2xl p-4 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-lg">🏦</span>
              <p className="text-gray-500 dark:text-gray-400">Bank</p>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(accounts.bank)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
