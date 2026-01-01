'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BillForm, { BillPayload } from '@/components/BillForm'
import ReminderList, { Bill } from '@/components/ReminderList'
import BalanceCard from '@/components/BalanceCard'
import SmartBillChatDrawer from '@/components/SmartBillChatDrawer'
import SmartBillChatTrigger from '@/components/SmartBillChatTrigger'

interface Summary {
  total_income: number
  total_expense: number
  balance: number
}

function BillsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  // Read query params for pre-filling form
  const [formInitialValues, setFormInitialValues] = useState<Partial<BillPayload & { amount: string | number }> | undefined>(undefined)

  const [activeBills, setActiveBills] = useState<Bill[]>([])
  const [completedBills, setCompletedBills] = useState<Bill[]>([])
  const [summary, setSummary] = useState<Summary>({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setError(null)

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

      const [activeRes, completedRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/bills/active`, { headers }),
        fetch(`${API_URL}/bills/completed`, { headers }),
        fetch(`${API_URL}/transactions/summary`, { headers }),
      ])

      if (!activeRes.ok || !completedRes.ok || !summaryRes.ok) {
        throw new Error('Failed to load bills data')
      }

      setActiveBills(await activeRes.json())
      setCompletedBills(await completedRes.json())
      setSummary(await summaryRes.json())
    } catch (err) {
      console.error(err)
      setError('Unable to load bills data')
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Read query params for pre-filling form (from AI chat redirect)
  useEffect(() => {
    const billName = searchParams.get('billName')
    const amount = searchParams.get('amount')
    const due = searchParams.get('due')
    const category = searchParams.get('category')
    const desc = searchParams.get('desc')

    if (billName || amount || due || category || desc) {
      // Pre-fill form with query params
      setFormInitialValues({
        billName: billName || '',
        amount: amount ? parseInt(amount) : undefined,
        dueDate: due || '',
        category: (category as BillPayload['category']) || 'utilities',
        description: desc || ''
      })

      // Show notification
      console.log('📋 Form pre-filled from AI chat:', { billName, amount, due, category, desc })
    }
  }, [searchParams])

  // Listen for bill created event from AI chat
  useEffect(() => {
    const handleBillCreated = () => {
      // Refresh bills data when bill is created via AI chat
      fetchData()
    }

    window.addEventListener('billCreated', handleBillCreated)
    return () => {
      window.removeEventListener('billCreated', handleBillCreated)
    }
  }, [fetchData])

  const handleAddBill = async (payload: BillPayload) => {
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

    const response = await fetch(`${API_URL}/bills`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to create bill')
    }

    await fetchData()
    
    // Clear query params after bill is created
    if (searchParams.toString()) {
      router.replace('/dashboard/bills')
      setFormInitialValues(undefined)
    }
  }

  const handleCompleteBill = async (bill: Bill) => {
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

    const result = await response.json()

    const decreaseRes = await fetch(`${API_URL}/balance/decrease`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: result.amount, description: `Bill: ${bill.billName}` }),
    })

    if (!decreaseRes.ok) {
      const body = await decreaseRes.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to update balance')
    }

    await decreaseRes.json()
    await fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <p className="text-light-text dark:text-dark-text">Loading bills...</p>
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
              Smart Bill & Reminder Center
            </h1>
          </div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary ml-12">
            Stay on top of every bill and keep your balance in check automatically.
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
          <BillForm onSubmit={handleAddBill} initialValues={formInitialValues} />
        </div>

        <ReminderList
          activeBills={activeBills}
          completedBills={completedBills}
          onComplete={handleCompleteBill}
        />
      </main>

      {/* SmartBill Chat Trigger Button */}
      <SmartBillChatTrigger onClick={() => setIsChatDrawerOpen(true)} />

      {/* SmartBill Chat Drawer */}
      <SmartBillChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        onExtractedBill={(billData) => {
          console.log('📋 [BillsPage] Received extracted bill data, pre-filling form:', billData)
          // Pre-fill form with extracted data
          setFormInitialValues({
            billName: billData.billName,
            amount: billData.amount,
            dueDate: billData.dueDate,
            category: billData.category as BillPayload['category'],
            description: billData.description
          })
        }}
      />
    </div>
  )
}

export default function BillsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
          <p className="text-light-text dark:text-dark-text">Loading bills...</p>
        </div>
      }
    >
      <BillsContent />
    </Suspense>
  )
}

