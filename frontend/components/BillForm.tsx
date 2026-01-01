'use client'

import { useState, useEffect } from 'react'

type BillCategory = 'utilities' | 'subscription' | 'rent' | 'food' | 'others'

export interface BillPayload {
  billName: string
  amount: number
  dueDate: string
  category: BillCategory
  description: string
}

interface BillFormProps {
  onSubmit: (payload: BillPayload) => Promise<void>
  initialValues?: Partial<BillPayload & { amount: string | number }>
}

const categories: BillCategory[] = [
  'utilities',
  'subscription',
  'rent',
  'food',
  'others',
]

export default function BillForm({ onSubmit, initialValues }: BillFormProps) {
  const [formData, setFormData] = useState<Omit<BillPayload, 'amount'> & { amount: string }>({
    billName: initialValues?.billName || '',
    amount: initialValues?.amount ? (typeof initialValues.amount === 'string' ? initialValues.amount : initialValues.amount.toString()) : '',
    dueDate: initialValues?.dueDate || '',
    category: initialValues?.category || 'utilities',
    description: initialValues?.description || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form data when initialValues change (for query params)
  useEffect(() => {
    if (initialValues) {
      setFormData(prev => ({
        billName: initialValues.billName || prev.billName,
        amount: initialValues.amount ? (typeof initialValues.amount === 'string' ? initialValues.amount : initialValues.amount.toString()) : prev.amount,
        dueDate: initialValues.dueDate || prev.dueDate,
        category: initialValues.category || prev.category,
        description: initialValues.description || prev.description,
      }))
    }
  }, [initialValues])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const amountNumber = Number(formData.amount)
      if (Number.isNaN(amountNumber) || amountNumber <= 0) {
        setError('Amount must be greater than 0')
        return
      }

      if (!formData.dueDate) {
        setError('Due date is required')
        return
      }

      await onSubmit({
        billName: formData.billName.trim(),
        amount: amountNumber,
        dueDate: formData.dueDate,
        category: formData.category,
        description: formData.description.trim(),
      })

      setFormData({
        billName: '',
        amount: '',
        dueDate: '',
        category: 'utilities',
        description: '',
      })
    } catch (err) {
      console.error(err)
      setError('Failed to add bill')
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
          Bill Name
        </label>
        <input
          type="text"
          name="billName"
          value={formData.billName}
          onChange={handleChange}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
          placeholder="e.g., Electricity March"
          required
        />
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
          Due Date
        </label>
        <input
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
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
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none resize-none"
          placeholder="Add details about this bill..."
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
        {loading ? 'Saving...' : 'Add Smart Bill'}
      </button>
    </form>
  )
}

