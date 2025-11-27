/**
 * KDS Module - Orders Grid Component
 * Grid de pedidos para cocina
 */

import type { PedidoKDS } from '../types/kds.types'
import { OrderCard } from './OrderCard'
import { EmptyOrderCard } from './EmptyOrderCard'

interface OrdersGridProps {
  pedidos: PedidoKDS[]
  onMarcarListo?: (pedidoId: string) => void
}

export const OrdersGrid = ({ pedidos, onMarcarListo }: OrdersGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pedidos.map((pedido) => (
        <OrderCard
          key={pedido.id}
          pedido={pedido}
          onMarcarListo={onMarcarListo}
        />
      ))}
      
      {pedidos.length === 0 && <EmptyOrderCard />}
    </div>
  )
}
