/**
 * Admin Module - Inventory Alerts Section
 * Sección de alertas de inventario crítico
 */

import { Warehouse, AlertTriangle, ShieldCheck } from 'lucide-react'
import { calculateStockProgress } from '../utils/admin.utils'
import type { InventoryRecord } from '../types/admin.types'

interface InventoryAlertsProps {
  lowStockItems: InventoryRecord[]
  onOpenStockDrawer: () => void
}

export const InventoryAlerts = ({
  lowStockItems,
  onOpenStockDrawer
}: InventoryAlertsProps) => {
  return (
    <div className="rounded-3xl border border-white/40 dark:border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 shadow-xl shadow-black/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-green-300">Inventario crítico</p>
          <h2 className="text-2xl font-bold">Alertas inmediatas</h2>
        </div>
        <Warehouse className="w-7 h-7 text-green-300" />
      </div>
      <div className="space-y-4">
        {lowStockItems.slice(0, 4).map((item) => {
          const progress = calculateStockProgress(item.stock_actual, item.stock_minimo)
          
          return (
            <div key={item.id} className="p-4 rounded-2xl bg-white/10 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {item.nombre ?? item.productos?.nombre ?? 'Insumo sin nombre'}
                  </p>
                  <p className="text-xs text-white/60">
                    {item.unidad} • mínimo {item.stock_minimo}
                  </p>
                </div>
                <AlertTriangle className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })}
        {lowStockItems.length === 0 && (
          <p className="text-sm text-white/60 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Todo el inventario está por encima del mínimo.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenStockDrawer}
        className="mt-6 w-full rounded-2xl bg-white text-gray-900 font-semibold py-3 hover:bg-orange-50 transition"
      >
        Cargar stock
      </button>
    </div>
  )
}
