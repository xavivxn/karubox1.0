/**
 * Admin Module - Header Component
 * Encabezado principal del dashboard con resumen diario
 */

import Link from 'next/link'
import { BarChart3, PlusCircle, Users, ArrowDownCircle, Package, List } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import { ROUTES } from '@/config/routes'
import { getTodayLabel } from '../utils/admin.utils'
import type { DashboardStats } from '../types/admin.types'

interface AdminHeaderProps {
  tenantName: string
  stats: DashboardStats
  onOpenIngredienteModal: () => void
  onOpenStockDrawer: () => void
  onOpenProductModal?: () => void
  onOpenProductosList?: () => void
}

export const AdminHeader = ({
  tenantName,
  stats,
  onOpenIngredienteModal,
  onOpenStockDrawer,
  onOpenProductModal,
  onOpenProductosList
}: AdminHeaderProps) => {
  const todayLabel = getTodayLabel()

  return (
    <section className="rounded-3xl border border-white/40 dark:border-gray-900 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6 shadow-lg shadow-black/5 space-y-6">
      {/* Bloque: Operación integral (solo título y KPIs) */}
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

      {/* Barra única de acciones: todos los botones en un solo bloque */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Acciones
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={ROUTES.PROTECTED.CLIENTES}
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 text-white px-5 py-3 font-semibold hover:bg-purple-700 transition"
          >
            <Users className="w-5 h-5" />
            Clientes
          </Link>
          <Link
            href={ROUTES.PROTECTED.POS}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-800 transition"
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            Ir al POS
          </Link>
          <button
            onClick={onOpenStockDrawer}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition"
          >
            <ArrowDownCircle className="w-4 h-4 shrink-0" />
            Cargar stock
          </button>
          {onOpenProductosList && (
            <button
              onClick={onOpenProductosList}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <List className="w-4 h-4 shrink-0" />
              Ver productos
            </button>
          )}
          {onOpenProductModal && (
            <button
              onClick={onOpenProductModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500 bg-violet-50 dark:bg-violet-950/30 px-4 py-2.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition"
            >
              <Package className="w-4 h-4 shrink-0" />
              Nuevo producto
            </button>
          )}
          <button
            onClick={onOpenIngredienteModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            Registrar materia prima
          </button>
        </div>
      </div>
    </section>
  )
}
