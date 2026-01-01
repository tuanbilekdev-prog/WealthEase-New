'use client'

type StatCard = {
  title: string
  value: string
  subtitle: string
  icon: string
  badge?: string
}

type StatsCardsProps = {
  stats: StatCard[]
}

export default function StatsCards({ stats }: StatsCardsProps) {
  if (!stats?.length) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-green/10 dark:bg-emerald-green/20 flex items-center justify-center text-2xl">
            {stat.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtitle}</p>
          </div>
          {stat.badge && (
            <span className="text-xs font-medium text-emerald-green bg-emerald-green/10 px-2 py-1 rounded-full">
              {stat.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}


