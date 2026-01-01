'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type DonutChartProps = {
  data: {
    name: string
    value: number
  }[]
  limit: number
  used: number
  remaining: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value || 0)

export default function DonutChart({ data, limit, used, remaining }: DonutChartProps) {
  // Validate data
  if (!data?.length || limit <= 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <p>Budget belum diatur.</p>
        <p className="text-xs mt-1">Atur budget limit untuk melihat penggunaan</p>
      </div>
    )
  }

  // Calculate percentage - ensure it doesn't exceed 100%
  // Use Math.floor to show accurate percentage even for very small values
  const calculatedPercentage = limit > 0 ? (used / limit) * 100 : 0
  const percentage = Math.min(Math.floor(calculatedPercentage), 100)
  
  // Prepare chart data - only show used and remaining (not limit)
  const chartData = [
    { name: 'Terpakai', value: Math.max(0, used) },
    { name: 'Sisa', value: Math.max(0, remaining) },
  ]

  // Colors for the chart - pastel green for used, light grey for remaining
  const USED_COLOR = '#63BE86' // Pastel green for used
  const REMAINING_COLOR = '#E5E7EB' // Light grey for remaining

  return (
    <div className="flex flex-col gap-6">
      {/* Semi-circular Gauge */}
      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              innerRadius={75}
              outerRadius={115}
              paddingAngle={0}
              stroke="none"
              cy="95%"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.name}-${index}`} 
                  fill={index === 0 ? USED_COLOR : REMAINING_COLOR}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Percentage Display in center of semi-circle */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 translate-y-[calc(50%+20px)] pointer-events-none">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Stats Display */}
      <div className="flex justify-between items-start gap-3 pt-2">
        <div className="flex-1 text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            TERPAKAI
          </p>
          <p className="text-lg font-semibold text-[#F28C28] dark:text-[#F97316]">
            {formatCurrency(used)}
          </p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            LIMIT
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(limit)}
          </p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            SISA
          </p>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-500">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </div>
  )
}
