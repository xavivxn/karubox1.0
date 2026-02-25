import type { TipoPedido } from '../types/pos.types'
import type { CartItem } from '@/store/cartStore'

export const formatTipoPedido = (value: TipoPedido): string => {
  if (!value) return 'Sin definir'
  if (value === 'para_llevar') return 'Para llevar'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const calcularPuntos = (total: number): number => {
  return Math.floor(total / 100)
}

/**
 * Arma el texto de modificaciones del ítem para el ticket de cocina.
 * Se guarda en items_pedido.notas para que la vista / agente lo muestre.
 * Formato: "Sin X · Extra Y (+N) · Notas"
 */
export function formatItemModificacionesForTicket(item: CartItem): string | null {
  const c = item.customization
  if (!c && !item.notas?.trim()) return null

  const parts: string[] = []

  if (c?.removedIngredients?.length) {
    parts.push(...c.removedIngredients.map((r) => `Sin ${r.label}`))
  }
  if (c?.extras?.length) {
    parts.push(
      ...c.extras.map((e) =>
        e.quantityPerItem > 1
          ? `Extra ${e.label} (+${e.quantityPerItem})`
          : `Extra ${e.label}`
      )
    )
  }
  if (c?.notes?.trim()) {
    parts.push(c.notes.trim())
  }
  if (item.notas?.trim() && item.notas.trim() !== c?.notes?.trim()) {
    parts.push(item.notas.trim())
  }

  if (parts.length === 0) return null
  return parts.join(' · ')
}
