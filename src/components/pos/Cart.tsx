'use client'

import { useCartStore } from '@/store/cartStore'
import { Trash2, Plus, Minus } from 'lucide-react'

interface Props {
  onOpenClientModal: () => void
  onConfirmOrder: () => void
  isProcessing?: boolean
}

export default function Cart({ onOpenClientModal, onConfirmOrder, isProcessing }: Props) {
  const { items, cliente, tipo, removeItem, updateQuantity, getTotal, setTipo } = useCartStore()
  
  const total = getTotal()
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0)

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">
        Pedido Actual {itemCount > 0 && `(${itemCount})`}
      </h2>

      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-96">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Selecciona productos para comenzar
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg p-3 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{item.nombre}</div>
                  <div className="text-sm text-gray-600">
                    ${item.precio.toLocaleString()} × {item.cantidad}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${item.subtotal.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                  <button
                    onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.producto_id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
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
        <div className="mb-4">
          <button
            onClick={onOpenClientModal}
            className="w-full p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            {cliente ? (
              <div>
                <div className="font-semibold text-gray-900">{cliente.nombre}</div>
                <div className="text-sm text-gray-600">{cliente.telefono}</div>
                <div className="text-sm text-blue-600">⭐ {cliente.puntos_totales} puntos</div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                + Agregar Cliente (opcional)
              </div>
            )}
          </button>
        </div>
      )}

      {/* Divider y Total */}
      {items.length > 0 && (
        <>
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span className="text-green-600">${total.toLocaleString()}</span>
            </div>
          </div>

          {/* Tipo de pedido */}
          <div className="space-y-2 mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Tipo de pedido:</div>
            <button
              onClick={() => setTipo('delivery')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                tipo === 'delivery'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border-2 border-gray-200 hover:border-blue-500'
              }`}
            >
              🏠 Delivery
            </button>
            <button
              onClick={() => setTipo('local')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                tipo === 'local'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border-2 border-gray-200 hover:border-green-500'
              }`}
            >
              🍽️ Comer en local
            </button>
            <button
              onClick={() => setTipo('takeaway')}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                tipo === 'takeaway'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border-2 border-gray-200 hover:border-orange-500'
              }`}
            >
              📦 Para llevar
            </button>
          </div>

          {/* Botón confirmar */}
          <button
            onClick={onConfirmOrder}
            disabled={!tipo || isProcessing}
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
          </button>
        </>
      )}
    </div>
  )
}

