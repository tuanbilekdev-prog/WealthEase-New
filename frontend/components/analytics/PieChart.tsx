'use client'

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type PieChartProps = {
  data: {
    name: string
    value: number
  }[]
}

const COLORS = ['#10B981', '#22D3EE', '#F59E0B', '#EF4444', '#6366F1', '#A855F7', '#EC4899']

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)

export default function PieChart({ data }: PieChartProps) {
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Belum ada komposisi pengeluaran.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label={(entry) => `${entry.name} (${((entry.value / data.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%)`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}


