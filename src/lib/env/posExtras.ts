/**
 * Configuración de redondeo de precios de extras en el POS (cliente).
 * Ver .env.example: NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_*.
 */

import type { GuaraniesRoundMode } from '@/lib/utils/format'

function parsePositiveInt(raw: string | undefined): number {
  if (raw === undefined || raw === '') return 0
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Paso en guaraníes (ej. 1000). 0 = sin redondeo en el POS. */
export function getExtrasPrecioRedondePaso(): number {
  if (typeof process === 'undefined') return 0
  return parsePositiveInt(process.env.NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_PASO)
}

/** nearest = al múltiplo más cercano; ceil = siempre hacia arriba (más conservador en cobro). */
export function getExtrasPrecioRedondeModo(): GuaraniesRoundMode {
  if (typeof process === 'undefined') return 'nearest'
  const m = process.env.NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_MODO?.trim().toLowerCase()
  return m === 'ceil' ? 'ceil' : 'nearest'
}
