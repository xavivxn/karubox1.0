/**
 * Admin Module - Top Clients Section
 * Lista de los mejores clientes
 */

import { Users2 } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import type { ClientRanking } from '../types/admin.types'

interface TopClientsProps {
  topClients: ClientRanking[]
}

export const TopClients = ({ topClients }: TopClientsProps) => {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Users2 className="w-5 h-5 text-orange-500" />
          Top clientes
        </h3>
        <span className="text-xs text-gray-500">Últimos 30 días</span>
      </div>
      <div className="space-y-4">
        {topClients.map((client) => (
          <div key={client.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{client.nombre}</p>
              <p className="text-xs text-gray-500">Pedidos: {client.total_pedidos}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{formatGuaranies(client.total_gastado)}</p>
              <p className="text-xs text-orange-500">{client.puntos_totales} pts</p>
            </div>
          </div>
        ))}
        {!topClients.length && (
          <p className="text-sm text-gray-500">Aún no hay clientes con compras registradas.</p>
        )}
      </div>
    </div>
  )
}
