import { POS_FACTURA_MODAL_ENABLED } from '@/utils/constants'

/**
 * Feature flags (frontend).
 *
 * Fuente de verdad: `src/utils/constants.ts`
 */
export const FEATURES = {
  /** Habilita el modal “¿Desea factura?” en POS. */
  POS_FACTURA_MODAL: POS_FACTURA_MODAL_ENABLED,
} as const

