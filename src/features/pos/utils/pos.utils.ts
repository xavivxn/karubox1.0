import type { TipoPedido } from '../types/pos.types'

export const formatTipoPedido = (value: TipoPedido): string => {
  if (!value) return 'Sin definir'
  if (value === 'para_llevar') return 'Para llevar'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const calcularPuntos = (total: number): number => {
  return Math.floor(total / 100)
}
