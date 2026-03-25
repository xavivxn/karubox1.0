/**
 * Admin Module - Custom Hook
 * Hook para gestionar el estado y carga de datos del dashboard
 */

import { useMemo } from 'react'
import type {
  DashboardStats,
  ClientRanking,
  ProductRanking,
  InventoryRecord,
  IngredientUsage
} from '../types/admin.types'
import { fetchDashboardData } from '../services/adminService'
import { buildWeekLabels } from '../utils/admin.utils'
import { useQuery } from '@tanstack/react-query'
import { measureEnd, measureStart } from '@/lib/perf/metrics'

interface UseAdminDashboardReturn {
  loading: boolean
  stats: DashboardStats
  topClients: ClientRanking[]
  topProducts: ProductRanking[]
  inventory: InventoryRecord[]
  ingredientsUsage: IngredientUsage[]
  lowStockItems: InventoryRecord[]
  totalInventoryItems: number
  refetch: () => Promise<void>
}

const EMPTY_STATS: DashboardStats = {
  todayOrders: 0,
  todayRevenue: 0,
  todayCost: 0,
  todayProfit: 0,
  monthRevenue: 0,
  monthCost: 0,
  monthProfit: 0,
  avgTicket: 0,
  itemsPerOrder: 0,
  loyaltyRate: 0,
  activeClients: 0,
  loyaltyPoints: 0,
  weeklyTrend: buildWeekLabels().map((item) => ({ label: item.label, value: 0 })),
  channelSplit: {
    local: 0,
    delivery: 0,
    para_llevar: 0
  }
}

export interface UseAdminDashboardOptions {
  /** Si se pasa (ej. apertura_at del turno), Ingresos/Costo/Ganancia se calculan desde esa fecha/hora. */
  desde?: string | null
}

/**
 * Hook principal para gestionar los datos del dashboard de administración
 */
export const useAdminDashboard = (
  tenantId: string | null,
  options?: UseAdminDashboardOptions
): UseAdminDashboardReturn => {
  const desde = options?.desde ?? null
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard', tenantId, desde],
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    queryFn: async () => {
      const startedAt = measureStart()
      const data = await fetchDashboardData(tenantId as string, { desde })
      measureEnd('admin.dashboard.load', startedAt, {
        tenant_id: tenantId,
        pedidos: data.stats.todayOrders,
        inventory: data.inventory.length,
        products: data.topProducts.length
      })
      return data
    }
  })

  const stats = useMemo(() => dashboardQuery.data?.stats ?? EMPTY_STATS, [dashboardQuery.data])
  const topClients = useMemo(
    () => dashboardQuery.data?.topClients ?? ([] as ClientRanking[]),
    [dashboardQuery.data]
  )
  const topProducts = useMemo(
    () => dashboardQuery.data?.topProducts ?? ([] as ProductRanking[]),
    [dashboardQuery.data]
  )
  const inventory = useMemo(
    () => dashboardQuery.data?.inventory ?? ([] as InventoryRecord[]),
    [dashboardQuery.data]
  )
  const ingredientsUsage = useMemo(
    () => dashboardQuery.data?.ingredientsUsage ?? ([] as IngredientUsage[]),
    [dashboardQuery.data]
  )

  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.stock_actual <= item.stock_minimo),
    [inventory]
  )

  const totalInventoryItems = inventory.length

  return {
    loading: dashboardQuery.isLoading || dashboardQuery.isFetching,
    stats,
    topClients,
    topProducts,
    inventory,
    ingredientsUsage,
    lowStockItems,
    totalInventoryItems,
    refetch: async () => {
      await dashboardQuery.refetch()
    }
  }
}
