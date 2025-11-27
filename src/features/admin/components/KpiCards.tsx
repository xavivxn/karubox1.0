/**
 * Admin Module - KPI Cards Section
 * Tarjetas de indicadores clave de rendimiento
 */

import { Coins, ShieldCheck, Package, Percent } from 'lucide-react'
import { formatGuaranies, formatNumber } from '@/lib/utils/format'
import { KpiCard } from '@/components/admin/KpiCard'
import { ESTIMATED_COST_RATIO } from '../utils/admin.utils'
import type { DashboardStats } from '../types/admin.types'

interface KpiCardsProps {
  stats: DashboardStats
  totalInventoryItems: number
  lowStockCount: number
}

export const KpiCards = ({ stats, totalInventoryItems, lowStockCount }: KpiCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <KpiCard
        title="Ventas de hoy"
        value={formatGuaranies(stats.todayRevenue)}
        subtitle={`${stats.todayOrders} pedidos • Ticket prom. ${formatGuaranies(stats.avgTicket)}`}
        accent="orange"
      />
      <KpiCard
        title="Ganancia estimada"
        value={formatGuaranies(stats.todayProfit)}
        subtitle={`Costo aprox. ${formatGuaranies(stats.todayCost)}`}
        accent="purple"
      >
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Coins className="w-4 h-4 text-purple-500" />
          Ratio aplicado: {(ESTIMATED_COST_RATIO * 100).toFixed(0)}% del precio
        </div>
      </KpiCard>
      <KpiCard
        title="Clientes activos"
        value={formatNumber(stats.activeClients)}
        subtitle="+ Fidelización en tiempo real"
        accent="green"
      >
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-green-500" /> 
          Puntos emitidos: {formatNumber(stats.loyaltyPoints)}
        </div>
      </KpiCard>
      <KpiCard
        title="Stock monitoreado"
        value={`${totalInventoryItems - lowStockCount}/${totalInventoryItems}`}
        subtitle={`${lowStockCount} insumos con alertas`}
        accent="blue"
      />
    </div>
  )
}
