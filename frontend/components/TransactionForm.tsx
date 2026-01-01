'use client'

import { useState } from 'react'

type TransactionType = 'income' | 'expense'

export interface TransactionPayload {
  type: TransactionType
  amount: number
  name: string
  category: string
  description: string
  date: string
}

interface TransactionFormProps {
  onSubmit: (payload: TransactionPayload) => Promise<void>
}

type FormState = {
  type: TransactionType
  amount: string
  name: string
  category: string
  description: string
  date: string
}

export default function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [formData, setFormData] = useState<FormState>({
    type: 'income',
    amount: '',
    name: '',
    category: '',
    description: '',
    date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'type') {
        next.category = ''
      }
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!formData.name.trim()) {
        setError('Transaction name is required')
        return
      }

      if (!formData.category.trim()) {
        setError('Category is required')
        return
      }

      if (!formData.description.trim()) {
        setError('Description is required')
        return
      }

      if (!formData.date) {
        setError('Date is required')
        return
      }

      const parsedAmount = Number(formData.amount)
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Amount must be greater than 0')
        return
      }

      await onSubmit({
        ...formData,
        amount: parsedAmount,
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        date: formData.date,
      })

      setFormData({
        type: 'income',
        amount: '',
        name: '',
        category: '',
        description: '',
        date: '',
      })
    } catch (err) {
      console.error(err)
      // Display the actual error message from the backend if available
      const errorMessage = err instanceof Error ? err.message : 'Failed to add transaction'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-light-surface dark:bg-dark-surface rounded-3xl shadow-lg p-6 space-y-4 border border-light-border dark:border-dark-border"
    >
      <div>
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          Type
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          Transaction Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
          placeholder="e.g., Monthly salary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
          required
        >
          {formData.type === 'income' ? (
            <>
              <option value="">Select income category</option>
              <option value="Salary">Salary</option>
              <option value="Bonus">Bonus</option>
              <option value="Business">Business</option>
              <option value="Investment">Investment</option>
              <option value="Gift">Gift</option>
              <option value="Other Income">Other Income</option>
            </>
          ) : (
            <>
              <option value="">Select expense category</option>
              <option value="Food & Drinks">Food & Drinks</option>
              <option value="Transportation">Transportation</option>
              <option value="Housing">Housing</option>
              <option value="Utilities">Utilities</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Shopping">Shopping</option>
              <option value="Groceries">Groceries</option>
              <option value="Health">Health</option>
              <option value="Education">Education</option>
              <option value="Subscription">Subscription</option>
              <option value="Insurance">Insurance</option>
              <option value="Debt Payment">Debt Payment</option>
              <option value="Savings">Savings</option>
              <option value="Other Expense">Other Expense</option>
            </>
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          Amount (Rp)
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          min={0}
          onChange={handleChange}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
          placeholder="0"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          Date
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          Description
        </label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
          placeholder="e.g., Salary payment"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-light-primary dark:bg-dark-primary hover:opacity-90 text-white font-semibold py-3 transition disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Add Transaction'}
      </button>
    </form>
  )
}

