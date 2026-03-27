/**
 * Admin Module - Data Service
 * Servicios para obtener y procesar datos del dashboard
 */

import { createClient } from '@/lib/supabase/client'
import { getIngredientEstimationFromItems } from '@/lib/inventory/consumption'
import type {
  PedidoRecord,
  ClientRanking,
  InventoryRecord,
  ProductRanking,
  IngredientUsage,
  DashboardStats,
  ChannelSplit,
  WeeklyTrendItem,
  AdminDateRange
} from '../types/admin.types'
import {
  normalizeNumber,
  estimateCostFromAmount
} from '../utils/admin.utils'
import { buildTrendContextLabel, resolveAdminDateRange } from '../utils/date.utils'

/**
 * Aplica el rango temporal a consultas de pedidos.
 */
const applyDateRangeToPedidosQuery = <T>(query: T, dateRange: AdminDateRange): T => {
  let nextQuery = query as any
  if (dateRange.from) nextQuery = nextQuery.gte('created_at', dateRange.from)
  if (dateRange.to) nextQuery = nextQuery.lt('created_at', dateRange.to)
  return nextQuery as T
}

/**
 * Aplica el rango temporal a consultas con join a pedidos.
 */
const applyDateRangeToJoinedPedidosQuery = <T>(query: T, dateRange: AdminDateRange): T => {
  let nextQuery = query as any
  if (dateRange.from) nextQuery = nextQuery.gte('pedidos.created_at', dateRange.from)
  if (dateRange.to) nextQuery = nextQuery.lt('pedidos.created_at', dateRange.to)
  return nextQuery as T
}

/**
 * Obtiene todos los pedidos dentro del rango seleccionado.
 */
export const fetchPedidos = async (
  tenantId: string,
  dateRange: AdminDateRange
): Promise<PedidoRecord[]> => {
  const supabase = createClient()
  const query = applyDateRangeToPedidosQuery(
    supabase
      .from('pedidos')
      .select('id,total,created_at,tipo,puntos_generados,cliente_id')
      .eq('tenant_id', tenantId),
    dateRange
  )
  const { data, error } = await query

  if (error) throw error
  return (data as PedidoRecord[]) ?? []
}

/**
 * Obtiene el conteo de clientes activos
 */
export const fetchActiveClientsCount = async (tenantId: string): Promise<number> => {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  if (error) throw error
  return count ?? 0
}

/**
 * Obtiene el top 5 de clientes según gasto en el rango seleccionado.
 */
export const fetchTopClients = async (
  tenantId: string,
  dateRange: AdminDateRange
): Promise<ClientRanking[]> => {
  const supabase = createClient()
  const ordersQuery = applyDateRangeToPedidosQuery(
    supabase
      .from('pedidos')
      .select('cliente_id,total')
      .eq('tenant_id', tenantId)
      .not('cliente_id', 'is', null),
    dateRange
  )
  const { data: orders, error: ordersError } = await ordersQuery
  if (ordersError) throw ordersError

  const totalsByClient = new Map<string, { total_gastado: number; total_pedidos: number }>()
  for (const order of orders ?? []) {
    const clientId = (order as { cliente_id?: string | null }).cliente_id
    if (!clientId) continue
    const current = totalsByClient.get(clientId) ?? { total_gastado: 0, total_pedidos: 0 }
    current.total_gastado += normalizeNumber((order as { total?: number | null }).total)
    current.total_pedidos += 1
    totalsByClient.set(clientId, current)
  }

  const clientIds = Array.from(totalsByClient.keys())
  if (!clientIds.length) return []

  const { data: clients, error: clientsError } = await supabase
    .from('clientes')
    .select('id,nombre,telefono,puntos_totales')
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)
    .in('id', clientIds)
  if (clientsError) throw clientsError

  return (clients ?? [])
    .map((client) => {
      const totals = totalsByClient.get(client.id)
      if (!totals) return null
      return {
        id: client.id,
        nombre: client.nombre,
        telefono: client.telefono,
        puntos_totales: normalizeNumber(client.puntos_totales),
        total_pedidos: totals.total_pedidos,
        total_gastado: totals.total_gastado
      } as ClientRanking
    })
    .filter((client): client is ClientRanking => client !== null)
    .sort((a, b) => b.total_gastado - a.total_gastado)
    .slice(0, 5)
}

/**
 * Obtiene el inventario completo
 */
export const fetchInventory = async (tenantId: string): Promise<InventoryRecord[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventario')
    .select(
      'id,stock_actual,stock_minimo,unidad,controlar_stock,nombre,productos:producto_id(nombre,categoria:categorias(nombre))'
    )
    .eq('tenant_id', tenantId)

  if (error) throw error

  const inventoryRawData = data ?? []
  const inventoryData: InventoryRecord[] = inventoryRawData.map((item) => {
    // Supabase puede devolver producto como objeto (FK) o array; inventario tiene columna nombre propia
    const rawProductos = item.productos as { nombre?: string | null } | Array<{ nombre?: string | null }> | null
    const productoNombre =
      rawProductos == null
        ? null
        : Array.isArray(rawProductos)
          ? rawProductos[0]?.nombre ?? null
          : rawProductos.nombre ?? null
    const inventarioNombre = (item as { nombre?: string | null }).nombre ?? null
    const displayNombre = productoNombre || inventarioNombre || null

    return {
      id: String(item.id),
      stock_actual: normalizeNumber(item.stock_actual),
      stock_minimo: normalizeNumber(item.stock_minimo),
      unidad: String(item.unidad),
      controlar_stock: Boolean(item.controlar_stock),
      nombre: displayNombre,
      productos: displayNombre ? { nombre: displayNombre } : null
    }
  })

  return inventoryData
}

/**
 * Obtiene los items de pedidos dentro del rango seleccionado.
 */
export const fetchOrderItems = async (
  tenantId: string,
  dateRange: AdminDateRange
): Promise<any[]> => {
  const supabase = createClient()
  const query = applyDateRangeToJoinedPedidosQuery(
    supabase
      .from('items_pedido')
      .select(
        'cantidad,subtotal,producto_id,producto_nombre,pedidos!inner(tenant_id,created_at)'
      )
      .eq('pedidos.tenant_id', tenantId),
    dateRange
  )
  const { data, error } = await query

  if (error) throw error
  return (data as any[]) ?? []
}

/**
 * Procesa los pedidos para calcular estadísticas del período seleccionado.
 */
export const processDailyStats = (pedidos: PedidoRecord[]) => {
  const periodRevenue = pedidos.reduce(
    (acc, pedido) => acc + normalizeNumber(pedido.total),
    0
  )
  
  const avgTicket = pedidos.length > 0
    ? Math.round(periodRevenue / pedidos.length)
    : 0

  return {
    todayOrders: pedidos.length,
    todayRevenue: periodRevenue,
    avgTicket
  }
}

/**
 * Procesa los pedidos para calcular estadísticas del mes
 */
export const processMonthlyStats = (pedidos: PedidoRecord[]) => {
  const monthRevenue = pedidos.reduce(
    (acc, pedido) => acc + normalizeNumber(pedido.total),
    0
  )

  const loyaltyPoints = pedidos.reduce(
    (sum, pedido) => sum + normalizeNumber(pedido.puntos_generados),
    0
  )

  return {
    monthRevenue,
    loyaltyPoints
  }
}

/**
 * Procesa la tendencia semanal de ventas
 */
const buildTrendLabelsForRange = (dateRange: AdminDateRange): Array<{ label: string; date: string }> => {
  const labels: Array<{ label: string; date: string }> = []
  const now = new Date()
  const endDate = dateRange.to
    ? (() => {
        const toExclusive = new Date(dateRange.to)
        toExclusive.setDate(toExclusive.getDate() - 1)
        toExclusive.setHours(0, 0, 0, 0)
        return toExclusive
      })()
    : (() => {
        const current = new Date(now)
        current.setHours(0, 0, 0, 0)
        return current
      })()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(endDate)
    date.setDate(endDate.getDate() - i)
    date.setHours(0, 0, 0, 0)
    labels.push({
      label: date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
      date: date.toISOString()
    })
  }

  return labels
}

export const processWeeklyTrend = (
  pedidos: PedidoRecord[],
  dateRange: AdminDateRange
): WeeklyTrendItem[] => {
  const weeklyLabels = buildTrendLabelsForRange(dateRange)
  
  return weeklyLabels.map((slot) => {
    const value = pedidos
      .filter(
        (pedido) =>
          new Date(pedido.created_at).toLocaleDateString() ===
          new Date(slot.date).toLocaleDateString()
      )
      .reduce((sum, pedido) => sum + normalizeNumber(pedido.total), 0)
    
    return {
      label: slot.label,
      value
    }
  })
}

/**
 * Procesa la distribución por canal de venta
 */
export const processChannelSplit = (pedidos: PedidoRecord[]): ChannelSplit => {
  const channelSplit: ChannelSplit = { local: 0, delivery: 0, para_llevar: 0 }
  
  pedidos.forEach((pedido) => {
    const tipo = pedido.tipo
    channelSplit[tipo] = (channelSplit[tipo] ?? 0) + 1
  })

  return channelSplit
}

/**
 * Procesa los items para obtener el top de productos
 */
export const processTopProducts = (items: any[]): ProductRanking[] => {
  const productTotals = new Map<string, ProductRanking>()

  items.forEach((item) => {
    const key = item.producto_id || item.producto_nombre
    const existing = productTotals.get(key) ?? {
      producto_id: item.producto_id,
      producto_nombre: item.producto_nombre,
      unidades: 0,
      ingresos: 0,
      costo_estimado: 0,
      margen_estimado: 0
    }

    const lineRevenue = normalizeNumber(item.subtotal)
    const lineCost = estimateCostFromAmount(lineRevenue)

    existing.unidades += item.cantidad ?? 0
    existing.ingresos += lineRevenue
    existing.costo_estimado += lineCost
    existing.margen_estimado = existing.ingresos - existing.costo_estimado
    productTotals.set(key, existing)
  })

  return Array.from(productTotals.values())
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5)
}

/**
 * Procesa los items para calcular métricas adicionales.
 */
export const processItemsMetrics = (items: any[], pedidos: PedidoRecord[]) => {
  const totalItemsCount = items.reduce((sum, item) => sum + (item.cantidad ?? 0), 0)
  const itemsPerOrder = pedidos.length ? totalItemsCount / pedidos.length : 0

  const loyaltyOrders = pedidos.filter(
    (pedido) => normalizeNumber(pedido.puntos_generados) > 0
  ).length
  const loyaltyRate = pedidos.length ? loyaltyOrders / pedidos.length : 0

  const estimatedMonthCost = items.reduce(
    (sum, item) => sum + estimateCostFromAmount(item.subtotal),
    0
  )
  
  const estimatedPeriodCost = items.reduce(
    (sum, item) => sum + estimateCostFromAmount(item.subtotal),
    0
  )

  return {
    periodItems: items,
    itemsPerOrder,
    loyaltyRate,
    estimatedMonthCost,
    estimatedTodayCost: estimatedPeriodCost
  }
}

/**
 * Obtiene la estimación de consumo de ingredientes
 */
export const fetchIngredientUsage = async (
  tenantId: string,
  todayItems: any[]
): Promise<IngredientUsage[]> => {
  return await getIngredientEstimationFromItems(tenantId, todayItems)
}

export interface FetchDashboardOptions {
  dateRange?: AdminDateRange
}

/**
 * Función principal que obtiene y procesa todos los datos del dashboard
 */
export const fetchDashboardData = async (
  tenantId: string,
  options?: FetchDashboardOptions
): Promise<{
  stats: DashboardStats
  topClients: ClientRanking[]
  topProducts: ProductRanking[]
  inventory: InventoryRecord[]
  ingredientsUsage: IngredientUsage[]
}> => {
  const dateRange = options?.dateRange ?? resolveAdminDateRange('hoy')
  console.log('🔄 fetchDashboardData - tenantId:', tenantId, dateRange)
  
  // Fetch paralelo de todos los datos
  try {
    console.log('📊 Iniciando queries paralelas...')
    const [pedidos, activeClients, topClients, inventory, items] = await Promise.all([
      fetchPedidos(tenantId, dateRange).catch(e => { console.error('❌ Error en fetchPedidos:', e); throw e; }),
      fetchActiveClientsCount(tenantId).catch(e => { console.error('❌ Error en fetchActiveClientsCount:', e); throw e; }),
      fetchTopClients(tenantId, dateRange).catch(e => { console.error('❌ Error en fetchTopClients:', e); throw e; }),
      fetchInventory(tenantId).catch(e => { console.error('❌ Error en fetchInventory:', e); throw e; }),
      fetchOrderItems(tenantId, dateRange).catch(e => { console.error('❌ Error en fetchOrderItems:', e); throw e; })
    ])
    
    console.log('✅ Queries completadas:', {
      pedidos: pedidos.length,
      activeClients,
      topClients: topClients.length,
      inventory: inventory.length,
      items: items.length
    })

    // Procesar estadísticas sobre el rango seleccionado
    console.log('🧮 Procesando estadísticas...')
    const dailyStats = processDailyStats(pedidos)
    const monthlyStats = processMonthlyStats(pedidos)
    const weeklyTrend = processWeeklyTrend(pedidos, dateRange)
    const channelSplit = processChannelSplit(pedidos)
    const topProducts = processTopProducts(items)
    const itemsMetrics = processItemsMetrics(items, pedidos)
    const ingredientsUsage = await fetchIngredientUsage(tenantId, itemsMetrics.periodItems)

    // Calcular ganancias
    const todayProfit = dailyStats.todayRevenue - itemsMetrics.estimatedTodayCost
    const monthProfit = monthlyStats.monthRevenue - itemsMetrics.estimatedMonthCost

    const stats: DashboardStats = {
      todayOrders: dailyStats.todayOrders,
      todayRevenue: dailyStats.todayRevenue,
      todayCost: itemsMetrics.estimatedTodayCost,
      todayProfit,
      monthRevenue: monthlyStats.monthRevenue,
      monthCost: itemsMetrics.estimatedMonthCost,
      monthProfit,
      avgTicket: dailyStats.avgTicket,
      itemsPerOrder: itemsMetrics.itemsPerOrder,
      loyaltyRate: itemsMetrics.loyaltyRate,
      activeClients,
      loyaltyPoints: monthlyStats.loyaltyPoints,
      weeklyTrend,
      channelSplit,
      trendContextLabel: buildTrendContextLabel(dateRange)
    }

    console.log('✅ Dashboard procesado exitosamente')
    return {
      stats,
      topClients,
      topProducts,
      inventory,
      ingredientsUsage
    }
  } catch (error) {
    console.error('❌ Error fatal en fetchDashboardData:', error)
    throw error
  }
}
