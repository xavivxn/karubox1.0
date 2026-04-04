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
  cliente_id?: string | null
}

export interface InventoryRecord {
  id: string
  stock_actual: number
  stock_minimo: number
  unidad: string
  controlar_stock: boolean
  /** Nombre para mostrar: inventario.nombre o producto asociado */
  nombre?: string | null
  productos?: {
    nombre?: string | null
  } | null
  /** Nombre en columna inventario (puede coincidir o no con el nombre mostrado) */
  nombre_inventario?: string | null
  /** Categoría del producto vinculado, si existe */
  producto_categoria?: string | null
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

/** Vela por bucket temporal: primer/último pedido y rango de tickets; volume = suma ingresos. */
export interface CandlestickTrendItem {
  label: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type AdminDatePreset =
  | 'turno_actual'
  | 'hoy'
  | 'ayer'
  | 'ultimos_7_dias'
  | 'este_mes'
  | 'mes_pasado'
  | 'historico'

export interface AdminDateRange {
  preset: AdminDatePreset
  label: string
  /** Inclusive lower bound */
  from: string | null
  /** Exclusive upper bound */
  to: string | null
}

export interface ChannelSplit {
  local: number
  delivery: number
  para_llevar: number
}

export type TrendGranularity = 'hour' | 'day'

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
  /** Misma rejilla que weeklyTrend; OHLC por pedidos en el bucket */
  candleTrend: CandlestickTrendItem[]
  /** Eje temporal del gráfico de ingresos (por hora vs por día) */
  trendGranularity: TrendGranularity
  channelSplit: ChannelSplit
  trendContextLabel?: string
}
