/**
 * KDS Module - Type Definitions
 * Tipos para el sistema de pantalla de cocina (Kitchen Display System)
 */

/**
 * Estados posibles de un pedido en cocina
 */
export type EstadoPedidoKDS = 'pendiente' | 'preparando' | 'listo' | 'urgente'

/**
 * Tipo de pedido
 */
export type TipoPedidoKDS = 'local' | 'delivery' | 'para_llevar'

/**
 * Item individual de un pedido
 */
export interface ItemPedidoKDS {
  nombre: string
  cantidad: number
  notas?: string
}

/**
 * Pedido completo para mostrar en KDS
 */
export interface PedidoKDS {
  id: string
  numero: number
  tipo: TipoPedidoKDS
  hora: string
  items: ItemPedidoKDS[]
  estado: EstadoPedidoKDS
  minutosDesdeCreacion?: number
}

/**
 * Configuración de estado con color y etiqueta
 */
export interface EstadoConfig {
  color: string
  bgColor: string
  borderColor: string
  label: string
  icon?: string
}
