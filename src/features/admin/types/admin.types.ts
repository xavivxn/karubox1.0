/**
 * Admin Module - Type Definitions
 * Interfaces y tipos para el módulo de administración
 */

export interface PedidoRecord {
  id: string
  total: number
  created_at: string
  tipo: 'local' | 'delivery' | 'para_llevar'
  puntos_generados: number | null
}

export interface InventoryRecord {
  id: string
  stock_actual: number
  stock_minimo: number
  unidad: string
  controlar_stock: boolean
  productos?: {
    nombre?: string | null
  } | null
}

export interface ClientRanking {
  id: string
  nombre: string
  telefono: string | null
  puntos_totales: number
  total_pedidos: number
  total_gastado: number
}

export interface ProductRanking {
  producto_id: string | null
  producto_nombre: string
  unidades: number
  ingresos: number
  costo_estimado: number
  margen_estimado: number
}

export interface IngredientUsage {
  slug: string
  label: string
  unit: string
  total: number
}

export interface WeeklyTrendItem {
  label: string
  value: number
}

export interface ChannelSplit {
  local: number
  delivery: number
  para_llevar: number
}

export interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  todayCost: number
  todayProfit: number
  monthRevenue: number
  monthCost: number
  monthProfit: number
  avgTicket: number
  itemsPerOrder: number
  loyaltyRate: number
  activeClients: number
  loyaltyPoints: number
  weeklyTrend: WeeklyTrendItem[]
  channelSplit: ChannelSplit
}
