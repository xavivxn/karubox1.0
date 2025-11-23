'use client'

import { useCartStore } from '@/store/cartStore'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'

interface Props {
  onOpenClientModal: () => void
  onConfirmOrder: () => void
  isProcessing?: boolean
  darkMode?: boolean
}

export default function Cart({ onOpenClientModal, onConfirmOrder, isProcessing, darkMode }: Props) {
  const { items, cliente, tipo, removeItem, updateQuantity, getTotal, setTipo } = useCartStore()
  
  const total = getTotal()
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0)

  return (
    <div className={`rounded-2xl shadow-2xl p-6 flex flex-col h-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="text-orange-600" size={28} />
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Pedido {itemCount > 0 && `(${itemCount})`}
        </h2>
      </div>

      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-6 max-h-96">
        {items.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="text-5xl mb-4">🛒</div>
            <p>Selecciona productos</p>
            <p className="text-sm">para comenzar</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl p-4 border-2 ${
                darkMode 
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600'
                  : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.nombre}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ${item.precio.toLocaleString()} × {item.cantidad}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-orange-600">
                    ${item.subtotal.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-600 hover:bg-gray-500'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{item.cantidad}</span>
                  <button
                    onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                    className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.producto_id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cliente */}
      {items.length > 0 && (
        <div className="mb-6">
          <button
            onClick={onOpenClientModal}
            className="w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:from-blue-100 hover:to-blue-200 transition-all text-left"
          >
            {cliente ? (
              <div>
                <div className="font-bold text-gray-900 mb-1">{cliente.nombre}</div>
                <div className="text-sm text-gray-600 mb-1">{cliente.telefono}</div>
                <div className="text-sm font-semibold text-blue-600">⭐ {cliente.puntos_totales} puntos</div>
              </div>
            ) : (
              <div className="text-blue-600 text-center font-medium">
                + Agregar Cliente (opcional)
              </div>
            )}
          </button>
        </div>
      )}

      {/* Total */}
      {items.length > 0 && (
        <>
          <div className={`border-t-2 pt-6 mb-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
              <span className="text-3xl font-bold text-orange-600">${total.toLocaleString()}</span>
            </div>
          </div>

          {/* Tipo de pedido */}
          <div className="space-y-3 mb-6">
            <div className={`text-sm font-bold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tipo de pedido:</div>
            <button
              onClick={() => setTipo('delivery')}
              className={`w-full px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                tipo === 'delivery'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏠 Delivery
            </button>
            <button
              onClick={() => setTipo('local')}
              className={`w-full px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                tipo === 'local'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🍽️ Comer en local
            </button>
            <button
              onClick={() => setTipo('para_llevar')}
              className={`w-full px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                tipo === 'para_llevar'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Para llevar
            </button>
          </div>

          {/* Botón confirmar */}
          <button
            onClick={onConfirmOrder}
            disabled={!tipo || isProcessing}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold text-lg shadow-lg shadow-orange-500/30 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Procesando...
              </span>
            ) : (
              'Confirmar Pedido'
            )}
          </button>
        </>
      )}
    </div>
  )
}
