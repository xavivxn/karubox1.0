/**
 * KDS Module - Constants
 * Constantes para estados, colores y configuración
 */

import type { EstadoConfig, TipoPedidoKDS } from '../types/kds.types'

/**
 * Configuración de estados de pedido
 */
export const ESTADOS_CONFIG: Record<string, EstadoConfig> = {
  urgente: {
    color: 'text-red-900',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    label: 'Urgente (>15min)',
    icon: '🔥'
  },
  pendiente: {
    color: 'text-yellow-900',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
    label: 'Pendiente',
    icon: '⏰'
  },
  preparando: {
    color: 'text-blue-900',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    label: 'Preparando',
    icon: '👨‍🍳'
  },
  listo: {
    color: 'text-green-900',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
    label: 'Listo',
    icon: '✅'
  }
}

/**
 * Iconos para tipos de pedido
 */
export const TIPO_PEDIDO_ICONS: Record<TipoPedidoKDS, string> = {
  local: '🏠',
  delivery: '🛵',
  para_llevar: '📦'
}

/**
 * Labels para tipos de pedido
 */
export const TIPO_PEDIDO_LABELS: Record<TipoPedidoKDS, string> = {
  local: 'LOCAL',
  delivery: 'DELIVERY',
  para_llevar: 'PARA LLEVAR'
}

/**
 * Tiempo en minutos para considerar un pedido urgente
 */
export const TIEMPO_URGENTE_MINUTOS = 15
