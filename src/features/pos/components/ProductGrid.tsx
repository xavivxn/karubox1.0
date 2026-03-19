'use client'

import { Plus, Star } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import type { Producto } from '../types/pos.types'

interface Props {
  products: Producto[]
  onAddProduct: (product: Producto) => void
  loading?: boolean
  /** Mientras es true, no se puede agregar al carrito (ej. verificando estado de caja) */
  verificandoCaja?: boolean
  darkMode?: boolean
  /** Si true, no muestra el título "Productos (N)" (útil en subsecciones con nombre de categoría) */
  hideTitle?: boolean
}

function isCombo(product: Producto): boolean {
  return Boolean(product.combo_items && product.combo_items.length > 0)
}

export default function ProductGrid({ products, onAddProduct, loading, verificandoCaja, darkMode, hideTitle }: Props) {
  const canAdd = !verificandoCaja
  if (loading) {
    return (
      <div className={`rounded-2xl shadow-lg p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg sm:text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Productos</h2>
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent mb-3"></div>
          <p className="text-sm">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className={`rounded-2xl shadow-lg p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg sm:text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Productos</h2>
        <div className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="text-4xl mb-3">📦</div>
          <p className="text-sm">No hay productos en esta categoría</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl shadow-lg p-3 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {!hideTitle && (
        <h2 className={`text-lg sm:text-2xl font-bold mb-3 sm:mb-6 px-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Productos <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>({products.length})</span>
          {verificandoCaja && (
            <span className={`ml-2 text-xs font-normal ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              Verificando caja…
            </span>
          )}
        </h2>
      )}

      {/* Mobile: lista compacta de filas */}
      <div className="flex flex-col gap-1.5 sm:hidden">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => canAdd && onAddProduct(product)}
            disabled={!canAdd}
            title={!canAdd ? 'Verificando estado de caja...' : undefined}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors active:scale-[0.98] ${
              !canAdd
                ? 'opacity-70 cursor-not-allowed'
                : darkMode
                  ? 'bg-gray-700/50 active:bg-gray-600'
                  : 'bg-gray-50 active:bg-orange-50'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {product.nombre}
                </span>
                {isCombo(product) && (
                  <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                    COMBO
                  </span>
                )}
                {(product.puntos_extra ?? 0) > 0 && (
                  <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300">
                    <Star size={8} className="fill-current" />
                    +{product.puntos_extra} pts
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm font-bold text-orange-600 whitespace-nowrap">
              {formatGuaranies(product.precio)}
            </div>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
            }`}>
              <Plus size={16} strokeWidth={2.5} />
            </div>
          </button>
        ))}
      </div>

      {/* Tablet / Desktop: grid de cards */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => canAdd && onAddProduct(product)}
            disabled={!canAdd}
            title={!canAdd ? 'Verificando estado de caja...' : undefined}
            className={`group relative p-4 rounded-xl border transition-all duration-200 text-left overflow-hidden ${
              !canAdd
                ? 'opacity-70 cursor-not-allowed border-gray-400/50'
                : `hover:border-orange-400 hover:shadow-lg ${
                    darkMode
                      ? 'bg-gray-700/60 border-gray-600 hover:bg-gray-700'
                      : 'bg-white border-gray-200 hover:bg-orange-50/40'
                  }`
            }`}
          >
            {isCombo(product) && (
              <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                COMBO
              </span>
            )}
            {!isCombo(product) && (product.puntos_extra ?? 0) > 0 && (
              <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300">
                <Star size={8} className="fill-current" />
                +{product.puntos_extra} pts
              </span>
            )}
            <div className={`font-semibold text-sm mb-1 group-hover:text-orange-600 transition-colors ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {product.nombre}
            </div>
            {isCombo(product) ? (
              <div className={`text-[10px] mb-2 space-y-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {product.combo_items!.map((ci) => (
                  <div key={ci.producto_id}>- {ci.producto.nombre}{ci.cantidad > 1 ? ` x${ci.cantidad}` : ''}</div>
                ))}
              </div>
            ) : product.descripcion ? (
              <div className={`text-xs mb-2 line-clamp-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {product.descripcion}
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-orange-600">
                {formatGuaranies(product.precio)}
              </span>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}>
                <Plus size={16} strokeWidth={2.5} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
