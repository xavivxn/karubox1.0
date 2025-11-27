/**
 * Admin Module - Weekly Trend Chart
 * Gráfico de tendencia semanal de ingresos
 */

import { TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils/format'
import type { DashboardStats } from '../types/admin.types'

interface WeeklyTrendProps {
  stats: DashboardStats
}

export const WeeklyTrend = ({ stats }: WeeklyTrendProps) => {
  return (
    <div className="xl:col-span-2 rounded-3xl border border-white/40 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-lg shadow-black/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">últimos 7 días</p>
          <h2 className="text-2xl font-bold">Tendencia de ingresos</h2>
        </div>
        <TrendingUp className="w-6 h-6 text-orange-500" />
      </div>
      <div className="grid grid-cols-7 gap-3 min-h-[160px]">
        {stats.weeklyTrend.map((day) => (
          <div key={day.label} className="flex flex-col items-center gap-2">
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl h-28 relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-orange-500 to-orange-300"
                style={{ height: `${Math.min(100, (day.value / 500000) * 100)}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-gray-500">{day.label}</p>
            <p className="text-[11px] text-gray-400">{formatNumber(day.value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        {(['local', 'delivery', 'para_llevar'] as const).map((channel) => (
          <div
            key={channel}
            className="flex-1 min-w-[120px] rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3"
          >
            <p className="text-xs text-gray-500 uppercase">{channel}</p>
            <p className="text-lg font-bold">{stats.channelSplit[channel]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
