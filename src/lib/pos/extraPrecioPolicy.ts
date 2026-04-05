import type { GuaraniesRoundMode } from '@/lib/utils/format'
import { roundGuaraniesToStep } from '@/lib/utils/format'

/** Tier de política de precio para extras en el POS (ver `ingredientes.tipo_recargo_extra`). */
export type TipoRecargoExtra = 'estandar' | 'proteina'

export function parseTipoRecargoExtra(v: unknown): TipoRecargoExtra | null {
  if (v === 'estandar' || v === 'proteina') return v
  return null
}

export interface ExtrasPrecioTenantPolicy {
  minEstandar: number
  maxEstandar: number
  minProteina: number
}

export const DEFAULT_EXTRAS_PRECIOS_POLICY: ExtrasPrecioTenantPolicy = {
  minEstandar: 2000,
  maxEstandar: 3000,
  minProteina: 6000,
}

function num(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** Construye la política desde la fila `tenants` (o defaults). */
export function extrasPolicyFromTenantRow(t: {
  extra_precio_min_estandar?: number | string | null
  extra_precio_max_estandar?: number | string | null
  extra_precio_min_proteina?: number | string | null
} | null | undefined): ExtrasPrecioTenantPolicy {
  if (!t) return { ...DEFAULT_EXTRAS_PRECIOS_POLICY }
  return {
    minEstandar: num(t.extra_precio_min_estandar, DEFAULT_EXTRAS_PRECIOS_POLICY.minEstandar),
    maxEstandar: num(t.extra_precio_max_estandar, DEFAULT_EXTRAS_PRECIOS_POLICY.maxEstandar),
    minProteina: num(t.extra_precio_min_proteina, DEFAULT_EXTRAS_PRECIOS_POLICY.minProteina),
  }
}

/**
 * Precio final por unidad de extra en el POS: `precio_publico` → redondeo opcional → clamp por tier.
 * `tipoRecargo` NULL: solo redondeo (comportamiento previo a tiers).
 */
export function resolvePrecioExtraPOS(params: {
  raw: number
  tipoRecargo: TipoRecargoExtra | null | undefined
  step: number
  mode: GuaraniesRoundMode
  policy: ExtrasPrecioTenantPolicy
}): number {
  const { raw, tipoRecargo, step, mode, policy } = params
  let n = Math.round(Number(raw))
  if (!Number.isFinite(n) || n < 0) n = 0

  const rounded =
    step > 0 && n > 0 ? roundGuaraniesToStep(n, step, mode) : n

  if (!tipoRecargo) return rounded

  if (tipoRecargo === 'proteina') {
    return Math.max(rounded, Math.round(policy.minProteina))
  }

  const min = Math.round(policy.minEstandar)
  const max = Math.round(policy.maxEstandar)
  const clampedLow = Math.max(rounded, min)
  if (max >= min) {
    return Math.min(clampedLow, max)
  }
  return clampedLow
}
