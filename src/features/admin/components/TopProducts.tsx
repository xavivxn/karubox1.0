/**
 * Admin Module - Top Products Section
 * Lista de productos más vendidos
 */

import { Package2, BarChart3 } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import type { ProductRanking } from '../types/admin.types'

interface TopProductsProps {
  topProducts: ProductRanking[]
}

export const TopProducts = ({ topProducts }: TopProductsProps) => {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Package2 className="w-5 h-5 text-orange-500" />
          Productos estrella
        </h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {topProducts.map((product) => (
          <div
            key={product.producto_id ?? product.producto_nombre}
            className="flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{product.producto_nombre}</p>
              <p className="text-xs text-gray-500">
                {product.unidades} unidades · Costo {formatGuaranies(product.costo_estimado)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{formatGuaranies(product.ingresos)}</p>
              <p className="text-xs text-emerald-500">
                Margen {formatGuaranies(product.margen_estimado)}
              </p>
            </div>
          </div>
        ))}
        {!topProducts.length && (
          <p className="text-sm text-gray-500">Aún no hay ventas registradas.</p>
        )}
      </div>
    </div>
  )
}
