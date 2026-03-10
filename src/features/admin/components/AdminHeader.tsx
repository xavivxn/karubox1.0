/**
 * Admin Module - Header Component
 * Encabezado principal del dashboard con resumen diario
 */

import Link from 'next/link'
import { BarChart3, PlusCircle } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import { ROUTES } from '@/config/routes'
import { getTodayLabel } from '../utils/admin.utils'
import type { DashboardStats } from '../types/admin.types'

interface AdminHeaderProps {
  tenantName: string
  stats: DashboardStats
  onOpenInventoryDrawer: () => void
}

export const AdminHeader = ({
  tenantName,
  stats,
  onOpenInventoryDrawer
}: AdminHeaderProps) => {
  const todayLabel = getTodayLabel()

  return (
    <section className="rounded-3xl border border-white/40 dark:border-gray-900 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6 shadow-lg shadow-black/5 space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">
            Resumen diario • {todayLabel}
          </p>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
            Operación integral de {tenantName}
          </h1>
          <p className="text-gray-500 dark:text-gray-300">
            Ka&apos;u Manager centraliza ventas, inventario, clientes y caja en un único panel.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs text-gray-500 uppercase">Ingresos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatGuaranies(stats.todayRevenue)}
              </p>
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
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={ROUTES.PROTECTED.POS}
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 text-white px-5 py-3 font-semibold hover:bg-gray-800 transition"
          >
            <BarChart3 className="w-5 h-5" />
            Ir al POS
          </Link>
          <button
            onClick={onOpenInventoryDrawer}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-xl shadow-orange-500/40 hover:bg-orange-600 transition"
          >
            <PlusCircle className="w-5 h-5" />
            Registrar inventario
          </button>
        </div>
      </div>
    </section>
  )
}
