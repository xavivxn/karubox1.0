/**
 * Admin Module - Inventory Grid Section
 * Grid completo de inventario detallado
 */

import { calculateStockProgress } from '../utils/admin.utils'
import type { InventoryRecord } from '../types/admin.types'

interface InventoryGridProps {
  inventory: InventoryRecord[]
  onOpenInventoryDrawer: () => void
  onOpenProductModal?: () => void
}

export const InventoryGrid = ({ inventory, onOpenInventoryDrawer, onOpenProductModal }: InventoryGridProps) => {
  return (
    <section className="rounded-3xl border border-white/60 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">
            Inventario detallado
          </p>
          <h3 className="text-2xl font-bold">Insumos controlados</h3>
        </div>
        <div className="flex gap-3">
          {onOpenProductModal && (
            <button
              type="button"
              onClick={onOpenProductModal}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:border-orange-400 transition"
            >
              Gestionar productos
            </button>
          )}
          <button
            onClick={onOpenInventoryDrawer}
            className="rounded-2xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition"
          >
            Nuevo movimiento
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const progress = calculateStockProgress(item.stock_actual, item.stock_minimo)
          
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-900/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {item.productos?.nombre ?? 'Insumo sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Min {item.stock_minimo} {item.unidad}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.controlar_stock
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.controlar_stock ? 'Auto' : 'Manual'}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-bold">
                    {item.stock_actual.toLocaleString()} {item.unidad}
                  </span>
                  <span className="text-gray-500">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      progress < 30
                        ? 'bg-gradient-to-r from-red-500 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
        {!inventory.length && (
          <div className="col-span-full text-sm text-gray-500">
            Aún no tienes insumos cargados en inventario. Usá el botón &quot;Nuevo movimiento&quot; para
            registrar el primero.
          </div>
        )}
      </div>
    </section>
  )
}
