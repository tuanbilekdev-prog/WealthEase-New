'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type BarChartProps = {
  data: {
    category: string
    amount: number
  }[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)

export default function BarChart({ data }: BarChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Pengeluaran per kategori belum ada.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
        <XAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
        <YAxis tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'} tick={{ fill: '#9CA3AF' }} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Bar dataKey="amount" fill="#22C55E" radius={[8, 8, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}


