'use client'

import { TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { RevenueAreaChart } from './RevenueAreaChart'
import type { DashboardStats } from '../types/admin.types'

interface WeeklyTrendProps {
  stats: DashboardStats
  animationKey?: string
}

export const WeeklyTrend = ({ stats, animationKey }: WeeklyTrendProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="xl:col-span-2 rounded-3xl border border-white/40 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-lg shadow-black/5 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">
            {stats.trendContextLabel ?? 'período seleccionado'}
          </p>
          <h2 className="text-2xl font-bold">Tendencia de ingresos</h2>
        </div>
        <TrendingUp className="w-6 h-6 text-orange-500" />
      </div>
      <RevenueAreaChart
        data={stats.weeklyTrend}
        animationKey={animationKey}
      />
    </motion.div>
  )
}
