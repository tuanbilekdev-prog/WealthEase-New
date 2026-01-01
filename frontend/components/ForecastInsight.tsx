'use client'

interface ForecastInsightProps {
  advice: string[]
  accuracy: number
}

export default function ForecastInsight({ advice, accuracy }: ForecastInsightProps) {
  // Determine accuracy color
  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return 'text-green-600 dark:text-green-400'
    if (acc >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  // Determine accuracy label
  const getAccuracyLabel = (acc: number) => {
    if (acc >= 80) return 'Sangat Akurat'
    if (acc >= 60) return 'Cukup Akurat'
    return 'Kurang Akurat'
  }

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          💡 Insight & Saran Finansial
        </h3>
        
        {/* Accuracy Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">
            Tingkat Akurasi:
          </span>
          <span className={`text-sm font-bold ${getAccuracyColor(accuracy)}`}>
            {accuracy}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            ({getAccuracyLabel(accuracy)})
          </span>
        </div>
      </div>

      {/* Advice List */}
      <div className="space-y-3">
        {advice.map((item, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  {index + 1}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-relaxed">
              {item}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ⚠️ Prediksi ini berdasarkan data historis dan pola transaksi Anda. Hasil aktual mungkin berbeda.
        </p>
      </div>
    </div>
  )
}

