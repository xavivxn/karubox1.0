/**
 * Admin Module - Additional KPIs Section
 * KPIs adicionales: ingresos del mes, items por pedido, fidelización
 */

import { Coins, Package, Percent } from 'lucide-react'
import { formatGuaranies, formatNumber } from '@/lib/utils/format'
import { KpiCard } from './KpiCard'
import type { DashboardStats } from '../types/admin.types'

interface AdditionalKpisProps {
  stats: DashboardStats
}

export const AdditionalKpis = ({ stats }: AdditionalKpisProps) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KpiCard
        title="Ingresos del mes"
        value={formatGuaranies(stats.monthRevenue)}
        subtitle="Incluye delivery + salón + take-away"
        accent="green"
      >
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Coins className="w-4 h-4 text-green-500" />
          Costo: {formatGuaranies(stats.monthCost)} • Ganancia: {formatGuaranies(stats.monthProfit)}
        </div>
      </KpiCard>
      <KpiCard
        title="Items por pedido"
        value={stats.itemsPerOrder.toFixed(1)}
        subtitle="Promedio de productos por ticket"
        accent="purple"
      >
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-500" />
          Tickets más grandes = mayor margen
        </div>
      </KpiCard>
      <KpiCard
        title="Clientes fidelizados"
        value={`${Math.round(stats.loyaltyRate * 100)}%`}
        subtitle="Pedidos con puntos acumulados"
        accent="blue"
      >
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-500" />
          Puntos emitidos: {formatNumber(stats.loyaltyPoints)}
        </div>
      </KpiCard>
    </section>
  )
}
