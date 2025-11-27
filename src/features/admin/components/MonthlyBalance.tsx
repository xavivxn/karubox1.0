/**
 * Admin Module - Monthly Balance Section
 * Sección de balance mensual
 */

import { Activity } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import type { DashboardStats } from '../types/admin.types'

interface MonthlyBalanceProps {
  stats: DashboardStats
}

export const MonthlyBalance = ({ stats }: MonthlyBalanceProps) => {
  return (
    <div className="rounded-3xl border border-white/40 dark:border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 shadow-xl shadow-black/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Ka&apos;u Manager</p>
          <h2 className="text-2xl font-bold">Balance del mes</h2>
          <p className="text-sm text-white/70">Controlá margen y costos acumulados.</p>
        </div>
        <Activity className="w-6 h-6 text-white/70" />
      </div>
      <div className="grid grid-cols-1 gap-4 mt-6">
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
          <p className="text-xs uppercase text-white/60">Ingresos del mes</p>
          <p className="text-2xl font-bold">{formatGuaranies(stats.monthRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
          <p className="text-xs uppercase text-white/60">Costo estimado del mes</p>
          <p className="text-2xl font-bold">{formatGuaranies(stats.monthCost)}</p>
        </div>
        <div className="rounded-2xl bg-white text-gray-900 p-4">
          <p className="text-xs uppercase text-gray-500">Ganancia estimada</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatGuaranies(stats.monthProfit)}
          </p>
        </div>
      </div>
    </div>
  )
}
