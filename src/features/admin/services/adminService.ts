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
  WeeklyTrendItem
} from '../types/admin.types'
import {
  normalizeNumber,
  estimateCostFromAmount,
  buildWeekLabels
} from '../utils/admin.utils'
import { getTodayStart, getMonthStart } from '../utils/date.utils'
import { measureEnd, measureStart } from '@/lib/perf/metrics'

/**
 * Obtiene todos los pedidos del mes actual
 */
export const fetchPedidos = async (tenantId: string): Promise<PedidoRecord[]> => {
  const supabase = createClient()
  const monthStart = getMonthStart()
  
  const { data, error } = await supabase
    .from('pedidos')
    .select('id,total,created_at,tipo,puntos_generados')
    .eq('tenant_id', tenantId)
    .gte('created_at', monthStart.toISOString())

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
 * Obtiene el top 5 de clientes ordenados por puntos
 */
export const fetchTopClients = async (tenantId: string): Promise<ClientRanking[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, telefono, puntos_totales')
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)
    .order('puntos_totales', { ascending: false })
    .limit(5)

  if (error) throw error
  
  // Transformar a formato ClientRanking con valores calculados
  return (data ?? []).map(cliente => ({
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    puntos_totales: cliente.puntos_totales,
    total_pedidos: 0, // TODO: calcular desde pedidos
    total_gastado: cliente.puntos_totales * 20 // 5% de venta en puntos => venta aproximada = puntos / 0.05
  }))
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
 * Obtiene los items de pedidos del mes
 */
export const fetchOrderItems = async (tenantId: string): Promise<any[]> => {
  const supabase = createClient()
  const monthStart = getMonthStart()
  
  const { data, error } = await supabase
    .from('items_pedido')
    .select(
      'cantidad,subtotal,producto_id,producto_nombre,pedidos!inner(tenant_id,created_at)'
    )
    .eq('pedidos.tenant_id', tenantId)
    .gte('pedidos.created_at', monthStart.toISOString())

  if (error) throw error
  return (data as any[]) ?? []
}

/**
 * Procesa los pedidos para calcular estadísticas del día (o del turno si se pasa desde).
 * @param desde - Si se pasa (ej. apertura_at de la sesión), los totales son desde esa fecha/hora.
 */
export const processDailyStats = (pedidos: PedidoRecord[], desde?: string | null) => {
  const inicio = desde ? new Date(desde) : getTodayStart()
  const todayOrders = pedidos.filter((pedido) => new Date(pedido.created_at) >= inicio)
  
  const todayRevenue = todayOrders.reduce(
    (acc, pedido) => acc + normalizeNumber(pedido.total),
    0
  )
  
  const avgTicket = todayOrders.length > 0 
    ? Math.round(todayRevenue / todayOrders.length) 
    : 0

  return {
    todayOrders: todayOrders.length,
    todayRevenue,
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
export const processWeeklyTrend = (pedidos: PedidoRecord[]): WeeklyTrendItem[] => {
  const weeklyLabels = buildWeekLabels()
  
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
 * @param desde - Si se pasa (ej. apertura_at del turno), el costo "del día" es desde esa fecha/hora.
 */
export const processItemsMetrics = (items: any[], pedidos: PedidoRecord[], desde?: string | null) => {
  const inicio = desde ? new Date(desde) : getTodayStart()
  
  const todayItems = items.filter((item) => {
    const createdAt = item.pedidos?.created_at
    if (!createdAt) return false
    return new Date(createdAt) >= inicio
  })

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
  
  const estimatedTodayCost = todayItems.reduce(
    (sum, item) => sum + estimateCostFromAmount(item.subtotal),
    0
  )

  return {
    todayItems,
    itemsPerOrder,
    loyaltyRate,
    estimatedMonthCost,
    estimatedTodayCost
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
  /** Si se pasa (ej. apertura_at del turno), Ingresos/Costo/Ganancia "del día" se calculan desde esa fecha/hora. */
  desde?: string | null
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
  const totalStart = measureStart()
  const desde = options?.desde ?? null
  console.log('🔄 fetchDashboardData - tenantId:', tenantId, desde ? `desde ${desde}` : 'día calendario')
  
  // Fetch paralelo de todos los datos
  try {
    console.log('📊 Iniciando queries paralelas...')
    const queryStart = measureStart()
    const [pedidos, activeClients, topClients, inventory, items] = await Promise.all([
      fetchPedidos(tenantId).catch(e => { console.error('❌ Error en fetchPedidos:', e); throw e; }),
      fetchActiveClientsCount(tenantId).catch(e => { console.error('❌ Error en fetchActiveClientsCount:', e); throw e; }),
      fetchTopClients(tenantId).catch(e => { console.error('❌ Error en fetchTopClients:', e); throw e; }),
      fetchInventory(tenantId).catch(e => { console.error('❌ Error en fetchInventory:', e); throw e; }),
      fetchOrderItems(tenantId).catch(e => { console.error('❌ Error en fetchOrderItems:', e); throw e; })
    ])
    measureEnd('admin.dashboard.parallel_queries', queryStart, {
      tenant_id: tenantId,
      pedidos: pedidos.length,
      items: items.length,
      inventory: inventory.length
    })
    
    console.log('✅ Queries completadas:', {
      pedidos: pedidos.length,
      activeClients,
      topClients: topClients.length,
      inventory: inventory.length,
      items: items.length
    })

    // Procesar estadísticas (desde = apertura del turno si caja abierta)
    console.log('🧮 Procesando estadísticas...')
    const processStart = measureStart()
    const dailyStats = processDailyStats(pedidos, desde)
    const monthlyStats = processMonthlyStats(pedidos)
    const weeklyTrend = processWeeklyTrend(pedidos)
    const channelSplit = processChannelSplit(pedidos)
    const topProducts = processTopProducts(items)
    const itemsMetrics = processItemsMetrics(items, pedidos, desde)
    const ingredientsUsage = await fetchIngredientUsage(tenantId, itemsMetrics.todayItems)
    measureEnd('admin.dashboard.processing', processStart, {
      tenant_id: tenantId,
      ingredients: ingredientsUsage.length
    })

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
      channelSplit
    }

    console.log('✅ Dashboard procesado exitosamente')
    measureEnd('admin.dashboard.total', totalStart, {
      tenant_id: tenantId,
      pedidos: pedidos.length,
      items: items.length
    })
    return {
      stats,
      topClients,
      topProducts,
      inventory,
      ingredientsUsage
    }
  } catch (error) {
    console.error('❌ Error fatal en fetchDashboardData:', error)
    measureEnd('admin.dashboard.total', totalStart, {
      tenant_id: tenantId,
      error: true
    })
    throw error
  }
}
