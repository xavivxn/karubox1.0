/**
 * Admin Module - Daily Summary Section
 * Sección de resumen diario para cierre de caja
 */

import { TrendingUp } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import type { DashboardStats } from '../types/admin.types'

interface DailySummaryProps {
  stats: DashboardStats
}

export const DailySummary = ({ stats }: DailySummaryProps) => {
  return (
    <div className="rounded-3xl border border-white/40 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">Cierre de caja</p>
          <h2 className="text-2xl font-bold">Resumen diario</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Usa estos números como base antes de contar efectivo.
          </p>
        </div>
        <TrendingUp className="w-6 h-6 text-orange-500" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 uppercase">Cobrado hoy</p>
          <p className="text-xl font-bold">{formatGuaranies(stats.todayRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 uppercase">Costo estimado</p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-300">
            {formatGuaranies(stats.todayCost)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 uppercase">Ganancia estimada</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300">
            {formatGuaranies(stats.todayProfit)}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          * Costos calculados automáticamente con recetas y un ratio estándar. Podrás ajustarlos cuando
          carguemos los costos reales.
        </p>
        <button className="rounded-2xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition">
          Iniciar cierre de caja
        </button>
      </div>
    </div>
  )
}
