'use client'

import { Coins, ShieldCheck } from 'lucide-react'
import { formatGuaranies, formatNumber } from '@/lib/utils/format'
import { KpiCard } from './KpiCard'
import { ESTIMATED_COST_RATIO } from '../utils/admin.utils'
import type { DashboardStats } from '../types/admin.types'

interface KpiCardsProps {
  stats: DashboardStats
  totalInventoryItems: number
  lowStockCount: number
  periodLabel?: string
  animationKey?: string
  darkMode?: boolean
}

export const KpiCards = ({
  stats,
  totalInventoryItems,
  lowStockCount,
  periodLabel,
  animationKey,
  darkMode
}: KpiCardsProps) => {
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500'
  const periodText = periodLabel ?? 'Período seleccionado'
  return (
    <div key={animationKey} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <KpiCard
        title="Ventas del período"
        value={formatGuaranies(stats.todayRevenue)}
        subtitle={`${periodText} • ${stats.todayOrders} pedidos`}
        accent="orange"
        darkMode={darkMode}
        index={0}
      />
      <KpiCard
        title="Ganancia estimada"
        value={formatGuaranies(stats.todayProfit)}
        subtitle={`Costo aprox. ${formatGuaranies(stats.todayCost)}`}
        accent="purple"
        darkMode={darkMode}
        index={1}
      >
        <div className={`text-xs ${mutedClass} flex items-center gap-1`}>
          <Coins className="w-4 h-4 text-purple-500" />
          Ratio aplicado: {(ESTIMATED_COST_RATIO * 100).toFixed(0)}% del precio
        </div>
      </KpiCard>
      <KpiCard
        title="Clientes activos"
        value={formatNumber(stats.activeClients)}
        subtitle="+ Fidelización en tiempo real"
        accent="green"
        darkMode={darkMode}
        index={2}
      >
        <div className={`text-xs ${mutedClass} flex items-center gap-1`}>
          <ShieldCheck className="w-4 h-4 text-green-500" /> 
          Puntos emitidos: {formatNumber(stats.loyaltyPoints)}
        </div>
      </KpiCard>
      <KpiCard
        title="Stock monitoreado"
        value={`${totalInventoryItems - lowStockCount}/${totalInventoryItems}`}
        subtitle={`${lowStockCount} insumos con alertas`}
        accent="blue"
        darkMode={darkMode}
        index={3}
      />
    </div>
  )
}
