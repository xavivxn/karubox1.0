/**
 * Admin Module - Main Exports
 * Punto de entrada principal del módulo admin
 */

// Components
export { AdminView } from './components/AdminView'
export { AdminHeader } from './components/AdminHeader'
export { AdminLoading } from './components/AdminLoading'
export { KpiCards } from './components/KpiCards'
export { DailySummary } from './components/DailySummary'
export { MonthlyBalance } from './components/MonthlyBalance'
export { AdditionalKpis } from './components/AdditionalKpis'
export { WeeklyTrend } from './components/WeeklyTrend'
export { InventoryAlerts } from './components/InventoryAlerts'
export { TopClients } from './components/TopClients'
export { TopProducts } from './components/TopProducts'
export { IngredientConsumption } from './components/IngredientConsumption'
export { InventoryGrid } from './components/InventoryGrid'

// Hooks
export { useAdminDashboard } from './hooks/useAdminDashboard'

// Services
export * from './services/adminService'

// Types
export type {
  PedidoRecord,
  InventoryRecord,
  ClientRanking,
  ProductRanking,
  IngredientUsage,
  WeeklyTrendItem,
  ChannelSplit,
  DashboardStats
} from './types/admin.types'

// Utils
export * from './utils/admin.utils'
export * from './utils/date.utils'
