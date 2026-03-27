/**
 * Admin Module - Custom Hook
 * Hook para gestionar el estado y carga de datos del dashboard
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import type {
  DashboardStats,
  ClientRanking,
  ProductRanking,
  InventoryRecord,
  IngredientUsage,
  AdminDateRange
} from '../types/admin.types'
import { fetchDashboardData } from '../services/adminService'
import { buildWeekLabels } from '../utils/admin.utils'
import { resolveAdminDateRange } from '../utils/date.utils'

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

export interface UseAdminDashboardOptions {
  dateRange?: AdminDateRange
}

/**
 * Hook principal para gestionar los datos del dashboard de administración
 */
export const useAdminDashboard = (
  tenantId: string | null,
  options?: UseAdminDashboardOptions
): UseAdminDashboardReturn => {
  const dateRange = useMemo(
    () => options?.dateRange ?? resolveAdminDateRange('hoy'),
    [options?.dateRange]
  )
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
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
    },
    trendContextLabel: 'Últimos 7 días'
  })
  const [topClients, setTopClients] = useState<ClientRanking[]>([])
  const [topProducts, setTopProducts] = useState<ProductRanking[]>([])
  const [inventory, setInventory] = useState<InventoryRecord[]>([])
  const [ingredientsUsage, setIngredientsUsage] = useState<IngredientUsage[]>([])

  const fetchDashboard = useCallback(async () => {
    if (!tenantId) {
      console.warn('⚠️ fetchDashboard: tenantId es null')
      setLoading(false)
      return
    }
    
    console.log('🔍 Iniciando carga de dashboard para tenant:', tenantId, dateRange)
    setLoading(true)

    try {
      console.log('📡 Llamando fetchDashboardData...')
      const data = await fetchDashboardData(tenantId, { dateRange })
      
      console.log('✅ Datos recibidos:', {
        stats: data.stats ? '✓' : '✗',
        topClients: data.topClients?.length ?? 0,
        topProducts: data.topProducts?.length ?? 0,
        inventory: data.inventory?.length ?? 0,
        ingredientsUsage: data.ingredientsUsage?.length ?? 0
      })
      
      setStats(data.stats)
      setTopClients(data.topClients)
      setTopProducts(data.topProducts)
      setInventory(data.inventory)
      setIngredientsUsage(data.ingredientsUsage)
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error)
      console.error('📋 Detalles del error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : JSON.stringify(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        tenantId
      })
    } finally {
      setLoading(false)
    }
  }, [tenantId, dateRange])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.stock_actual <= item.stock_minimo),
    [inventory]
  )

  const totalInventoryItems = inventory.length

  return {
    loading,
    stats,
    topClients,
    topProducts,
    inventory,
    ingredientsUsage,
    lowStockItems,
    totalInventoryItems,
    refetch: fetchDashboard
  }
}
