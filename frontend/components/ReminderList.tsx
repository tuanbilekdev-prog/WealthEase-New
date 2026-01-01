'use client'

export interface Bill {
  id: string
  billName: string
  amount: number
  dueDate: string
  category: string
  description: string
  completed: boolean
  created_at: string
}

interface ReminderListProps {
  activeBills: Bill[]
  completedBills: Bill[]
  onComplete: (bill: Bill) => Promise<void>
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export default function ReminderList({
  activeBills,
  completedBills,
  onComplete,
}: ReminderListProps) {
  return (
    <div className="space-y-8">
      <section>
        <header className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <h3 className="text-2xl font-semibold text-light-text dark:text-dark-text">
              Active Reminders
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Track bills that are still due and mark them when completed.
            </p>
          </div>
        </header>

        {activeBills.length === 0 ? (
          <div className="bg-light-surface dark:bg-dark-surface rounded-3xl border border-light-border dark:border-dark-border py-10 text-center text-light-text-secondary dark:text-dark-text-secondary">
            No active reminders. Add a bill to get started!
          </div>
        ) : (
          <ul className="space-y-4">
            {activeBills.map((bill) => (
              <li
                key={bill.id}
                className="bg-light-surface dark:bg-dark-surface rounded-3xl border border-light-border dark:border-dark-border p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-lg font-semibold text-light-text dark:text-dark-text">
                      {bill.billName}
                    </p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      Due {formatDate(bill.dueDate)} · {bill.category}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-light-text dark:text-dark-text">
                    {formatCurrency(bill.amount)}
                  </p>
                </div>

                <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{bill.description}</p>

                <button
                  onClick={() => onComplete(bill)}
                  className="self-start inline-flex items-center px-4 py-2 rounded-xl bg-light-primary dark:bg-dark-primary text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  Mark as Completed
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <header className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <h3 className="text-2xl font-semibold text-light-text dark:text-dark-text">
              Completed Reminders
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              A history of bills you've already taken care of.
            </p>
          </div>
        </header>

        {completedBills.length === 0 ? (
          <div className="bg-light-surface dark:bg-dark-surface rounded-3xl border border-light-border dark:border-dark-border py-10 text-center text-light-text-secondary dark:text-dark-text-secondary">
            No completed bills yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {completedBills.map((bill) => (
              <li
                key={bill.id}
                className="bg-light-surface dark:bg-dark-surface rounded-3xl border border-light-border dark:border-dark-border p-4 text-light-text-secondary dark:text-dark-text-secondary line-through flex flex-col gap-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-semibold text-light-text dark:text-dark-text line-through">
                    {bill.billName}
                  </p>
                  <span>{formatCurrency(bill.amount)}</span>
                </div>
                <p className="text-sm">
                  {formatDate(bill.dueDate)} · {bill.category}
                </p>
                <p className="text-sm">{bill.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

