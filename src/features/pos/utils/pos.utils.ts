import type { TipoPedido } from '../types/pos.types'
import type { CartItem } from '@/store/cartStore'
import type { Cliente } from '@/types/supabase'

/** Comprobante genérico multitenant (impresión tipo “Nombre: Cliente”, “RUC: 0”). */
export const RECEPTOR_FACTURA_GENERICO_NOMBRE = 'Cliente'
export const RECEPTOR_FACTURA_GENERICO_RUC = '0'
/** Fallback en rutas nombre+CI cuando falta CI en el cliente. */
export const RECEPTOR_FACTURA_GENERICO_CI = '0'

export function clienteTieneRucParaFactura(cliente: Pick<Cliente, 'ruc'> | null): boolean {
  return Boolean(cliente?.ruc?.trim())
}

export const formatTipoPedido = (value: TipoPedido): string => {
  if (!value) return 'Sin definir'
  if (value === 'para_llevar') return 'Para llevar'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Acumulación: 5% del monto de compra en puntos */
export const PUNTOS_PORCENTAJE = 0.05

/** Valor de canje: 1 punto equivale a 1 Gs de crédito */
export const VALOR_PUNTO_GS = 1

/** Puntos automáticos que genera una compra según el monto total */
export const calcularPuntos = (total: number): number => {
  return Math.floor(total * PUNTOS_PORCENTAJE)
}

/**
 * Arma el texto de modificaciones del ítem para el ticket de cocina.
 * Se guarda en items_pedido.notas para que la vista / agente lo muestre.
 *
 * Producto individual: "Sin X · Extra Y (+N) · Notas"
 * Combo: "Pancholo's Burger (Sin cheddar · Extra bacon) | Coca Cola Lata 354ml | Papas Fritas Medianas"
 */
export function formatItemModificacionesForTicket(item: CartItem): string | null {
  // ── Combo: listar sub-productos con sus modificaciones ──
  if (item.tipo === 'combo' && item.comboItems?.length) {
    const parts = item.comboItems.map((ci) => {
      const mods: string[] = []
      if (ci.customization?.removedIngredients?.length) {
        mods.push(...ci.customization.removedIngredients.map((r) => `Sin ${r.label}`))
      }
      if (ci.customization?.extras?.length) {
        mods.push(
          ...ci.customization.extras.map((e) =>
            e.quantityPerItem > 1 ? `Extra ${e.label} (+${e.quantityPerItem})` : `Extra ${e.label}`
          )
        )
      }
      const qty = ci.cantidad > 1 ? ` x${ci.cantidad}` : ''
      return mods.length > 0
        ? `${ci.nombre}${qty} (${mods.join(' · ')})`
        : `${ci.nombre}${qty}`
    })
    return parts.join(' | ')
  }

  // ── Producto individual ──
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
