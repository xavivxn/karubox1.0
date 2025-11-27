/**
 * KDS Module - Order Card Component
 * Tarjeta individual de pedido en KDS
 */

import type { PedidoKDS } from '../types/kds.types'
import { ESTADOS_CONFIG, TIPO_PEDIDO_ICONS, TIPO_PEDIDO_LABELS } from '../constants/kds.constants'

interface OrderCardProps {
  pedido: PedidoKDS
  onMarcarListo?: (pedidoId: string) => void
}

export const OrderCard = ({ pedido, onMarcarListo }: OrderCardProps) => {
  const estadoConfig = ESTADOS_CONFIG[pedido.estado]
  const tipoIcon = TIPO_PEDIDO_ICONS[pedido.tipo]
  const tipoLabel = TIPO_PEDIDO_LABELS[pedido.tipo]

  return (
    <div
      className={`${estadoConfig.bgColor} border-4 ${estadoConfig.borderColor} rounded-lg p-4`}
    >
      {/* Header del pedido */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-2xl font-bold">#{pedido.numero}</div>
          <div className="text-sm text-gray-700">
            {tipoIcon} {tipoLabel}
          </div>
        </div>
        <div className="text-sm text-gray-700">⏰ {pedido.hora}</div>
      </div>

      {/* Items del pedido */}
      <div className="space-y-2 mb-4">
        {pedido.items.map((item, index) => (
          <div key={index} className="bg-white rounded p-2">
            <div className="font-semibold">
              {item.nombre} {item.cantidad > 1 && `x${item.cantidad}`}
            </div>
            {item.notas && (
              <div className="text-sm text-gray-600">{item.notas}</div>
            )}
          </div>
        ))}
      </div>

      {/* Botón de acción */}
      {pedido.estado !== 'listo' && (
        <button
          onClick={() => onMarcarListo?.(pedido.id)}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded transition-colors"
        >
          ✓ Marcar como Listo
        </button>
      )}

      {pedido.estado === 'listo' && (
        <div className="w-full bg-green-700 text-white font-semibold py-2 rounded text-center">
          ✅ Listo para Entregar
        </div>
      )}
    </div>
  )
}
