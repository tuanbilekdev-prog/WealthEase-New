'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type LineChartProps = {
  data: {
    label: string
    balance: number
    income: number
    expense: number
  }[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)

export default function LineChart({ data }: LineChartProps) {
  if (!data?.length) {
    return (
      <div className="h-80 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Tidak ada data untuk periode ini.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
        <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
        <YAxis tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'} tick={{ fill: '#9CA3AF' }} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend />
        <Line type="monotone" dataKey="balance" stroke="#059669" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="expense" stroke="#F87171" strokeWidth={2} strokeDasharray="4 2" />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}


