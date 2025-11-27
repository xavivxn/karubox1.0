/**
 * KDS Module - Main View Component
 * Componente principal de la pantalla de cocina
 */

'use client'

import { useState } from 'react'
import type { PedidoKDS } from '../types/kds.types'
import { KDSHeader } from './KDSHeader'
import { OrdersGrid } from './OrdersGrid'
import { StatusLegend } from './StatusLegend'

/**
 * Datos de ejemplo para demostración
 * TODO: Reemplazar con datos reales de Supabase + suscripción en tiempo real
 */
const PEDIDOS_EJEMPLO: PedidoKDS[] = [
  {
    id: '1',
    numero: 1001,
    tipo: 'delivery',
    hora: '14:20',
    estado: 'pendiente',
    items: [
      {
        nombre: 'Lomito Completo',
        cantidad: 2,
        notas: '+ Cebolla, + Queso'
      },
      {
        nombre: 'Coca Cola 500ml',
        cantidad: 2
      }
    ]
  }
]

export const KDSView = () => {
  const [pedidos, setPedidos] = useState<PedidoKDS[]>(PEDIDOS_EJEMPLO)

  /**
   * Marca un pedido como listo
   * TODO: Actualizar estado en Supabase
   */
  const handleMarcarListo = (pedidoId: string) => {
    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === pedidoId
          ? { ...pedido, estado: 'listo' as const }
          : pedido
      )
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
          {/* Header con reloj */}
          <KDSHeader />

          {/* Grid de pedidos */}
          <OrdersGrid pedidos={pedidos} onMarcarListo={handleMarcarListo} />

          {/* Leyenda de estados */}
          <StatusLegend />
        </div>
      </div>
    </div>
  )
}
