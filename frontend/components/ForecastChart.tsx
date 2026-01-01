'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ForecastChartProps {
  forecastBalance: number[]
  period: 'weekly' | 'monthly'
  currentBalance: number
}

export default function ForecastChart({ forecastBalance, period, currentBalance }: ForecastChartProps) {
  // Generate labels for x-axis
  const generateLabels = () => {
    const labels: string[] = []
    const today = new Date()
    const days = period === 'weekly' ? 7 : 30
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      if (period === 'weekly') {
        // For weekly: show day name
        labels.push(date.toLocaleDateString('id-ID', { weekday: 'short' }))
      } else {
        // For monthly: show date
        labels.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))
      }
    }
    
    return labels
  }

  // Format data for chart
  const chartData = forecastBalance.map((balance, index) => ({
    day: generateLabels()[index],
    balance: Math.round(balance),
    index
  }))

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Prediksi Saldo {period === 'weekly' ? 'Minggu Depan' : 'Bulan Depan'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Saldo saat ini: <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {formatCurrency(currentBalance)}
          </span>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="day" 
            stroke="#6b7280"
            className="dark:text-gray-400"
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            stroke="#6b7280"
            className="dark:text-gray-400"
            tick={{ fill: '#6b7280' }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
              return value.toString()
            }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={() => 'Prediksi Saldo'}
          />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Saldo"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>💡 Prediksi berdasarkan pola transaksi dan tagihan yang akan datang</p>
      </div>
    </div>
  )
}

