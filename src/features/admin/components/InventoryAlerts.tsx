/**
 * Admin Module - Inventory Alerts Section
 * Sección de alertas de inventario crítico
 */

import { Warehouse, AlertTriangle, ShieldCheck, FileText, ArrowDown } from 'lucide-react'
import { calculateStockProgress } from '../utils/admin.utils'
import { generarPdfInventario } from '../utils/generarPdfInventario'
import type { InventoryRecord } from '../types/admin.types'

interface InventoryAlertsProps {
  lowStockItems: InventoryRecord[]
  /** Inventario completo (PDF ordenado por criticidad). */
  inventory: InventoryRecord[]
  tenantNombre: string
  onOpenStockDrawer: () => void
}

export const InventoryAlerts = ({
  lowStockItems,
  inventory,
  tenantNombre,
  onOpenStockDrawer,
}: InventoryAlertsProps) => {
  const handlePdf = () => {
    if (inventory.length === 0) return
    generarPdfInventario(inventory, { tenantNombre })
  }

  return (
    <div className="flex h-fit min-h-0 flex-col rounded-3xl border border-white/40 dark:border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-xl shadow-black/30 xl:max-w-md xl:self-start">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-green-300">Inventario crítico</p>
          <h2 className="text-2xl font-bold">Alertas inmediatas</h2>
          <p className="mt-1 text-xs text-white/55">
            Insumos por debajo o igual al mínimo configurado (no es el listado completo).
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
          <button
            type="button"
            onClick={handlePdf}
            disabled={inventory.length === 0}
            title="Descargar inventario en PDF"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            <span className="hidden sm:inline">PDF</span>
            <ArrowDown className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          </button>
          <Warehouse className="h-7 w-7 text-green-300" aria-hidden />
        </div>
      </div>

      <div
        className="-mr-1 max-h-[min(22rem,45vh)] space-y-4 overflow-x-hidden overflow-y-auto overscroll-y-contain pr-1 [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:hover:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent"
        role="region"
        aria-label="Lista de insumos en alerta"
      >
        {lowStockItems.slice(0, 4).map((item) => {
          const progress = calculateStockProgress(item.stock_actual, item.stock_minimo)
          const nombre = item.nombre ?? item.productos?.nombre ?? 'Insumo sin nombre'
          const isCritical = item.stock_actual < item.stock_minimo
          const isAtLimit = item.stock_actual === item.stock_minimo

          const cardClass = isCritical
            ? 'border-red-500/45 bg-red-500/10'
            : 'border-amber-400/45 bg-amber-500/10'

          const iconClass = isCritical ? 'text-red-400' : 'text-amber-300'
          const barClass = isCritical
            ? 'bg-gradient-to-r from-red-600 to-red-400'
            : 'bg-gradient-to-r from-amber-500 to-yellow-400'

          return (
            <div key={item.id} className={`rounded-2xl border p-4 ${cardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{nombre}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-white/50">Stock actual</p>
                  <p className="text-xl font-bold tabular-nums leading-tight">
                    {item.stock_actual}{' '}
                    <span className="text-sm font-semibold text-white/80">{item.unidad}</span>
                  </p>
                  <p className="mt-2 text-xs text-white/65">
                    Mínimo requerido:{' '}
                    <span className="font-medium text-white/90">
                      {item.stock_minimo} {item.unidad}
                    </span>
                  </p>
                  {isCritical && (
                    <p className="mt-1 text-xs font-medium text-red-300">Por debajo del mínimo</p>
                  )}
                  {isAtLimit && !isCritical && (
                    <p className="mt-1 text-xs font-medium text-amber-200">En el límite</p>
                  )}
                </div>
                <AlertTriangle className={`h-5 w-5 shrink-0 ${iconClass}`} aria-hidden />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
                <div className={`h-full ${barClass}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )
        })}
        {lowStockItems.length === 0 && (
          <div className="space-y-2 text-sm text-white/65">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-green-400" aria-hidden />
              Todo el inventario está por encima del mínimo.
            </p>
            {inventory.length > 0 && (
              <p className="pl-6 text-xs text-white/50">
                Podés descargar el listado completo en PDF con el botón de arriba (ordenado por criticidad).
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onOpenStockDrawer}
          className="w-full rounded-2xl bg-white py-3 font-semibold text-gray-900 transition hover:bg-orange-50"
        >
          Cargar stock
        </button>
      </div>
    </div>
  )
}
