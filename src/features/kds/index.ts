/**
 * KDS Module - Main Exports
 * Punto de entrada principal del módulo KDS (Kitchen Display System)
 */

// Components
export { KDSView } from './components/KDSView'
export { KDSHeader } from './components/KDSHeader'
export { OrderCard } from './components/OrderCard'
export { EmptyOrderCard } from './components/EmptyOrderCard'
export { OrdersGrid } from './components/OrdersGrid'
export { StatusLegend } from './components/StatusLegend'

// Types
export type {
  EstadoPedidoKDS,
  TipoPedidoKDS,
  ItemPedidoKDS,
  PedidoKDS,
  EstadoConfig
} from './types/kds.types'

// Constants
export {
  ESTADOS_CONFIG,
  TIPO_PEDIDO_ICONS,
  TIPO_PEDIDO_LABELS,
  TIEMPO_URGENTE_MINUTOS
} from './constants/kds.constants'

// Utils
export {
  formatearHoraActual,
  formatearHora,
  calcularMinutosTranscurridos,
  esUrgente,
  calcularEstadoAutomatico
} from './utils/kds.utils'
