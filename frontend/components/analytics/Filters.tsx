'use client'

type FiltersProps = {
  period: string
  category: string
  sort: string
  categories: string[]
  onChange: (payload: { period?: string; category?: string; sort?: string }) => void
}

const periodOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const sortOptions = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'amount_highest', label: 'Amount Highest' },
  { value: 'amount_lowest', label: 'Amount Lowest' },
]

const toLabel = (value: string) =>
  value === 'all'
    ? 'All Categories'
    : value
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

export default function Filters({ period, category, sort, categories, onChange }: FiltersProps) {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-3xl p-4 flex flex-wrap gap-4">
      <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-900 dark:text-white mb-1">Period</span>
        <select
          value={period}
          onChange={(e) => onChange({ period: e.target.value })}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2 text-gray-900 dark:text-gray-100"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-900 dark:text-white mb-1">Category</span>
        <select
          value={category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2 text-gray-900 dark:text-gray-100"
        >
          {categories.map((option) => (
            <option key={option} value={option} className="text-gray-900">
              {toLabel(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-900 dark:text-white mb-1">Sorting</span>
        <select
          value={sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2 text-gray-900 dark:text-gray-100"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}


