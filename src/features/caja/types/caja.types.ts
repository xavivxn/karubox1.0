/**
 * Tipos para el módulo de cierre de caja
 */

export interface SesionCaja {
  id: string
  tenant_id: string
  apertura_at: string
  cierre_at: string | null
  abierto_por_id: string | null
  cerrado_por_id: string | null
  total_ventas: number
  total_costo_estimado: number
  monto_pagado_empleados: number
  ganancia_neta: number
  cantidad_pedidos: number
  created_at: string
  updated_at: string
}

export type SesionCajaAbierta = SesionCaja & { cierre_at: null }

export interface TotalesTurno {
  total_ventas: number
  total_costo_estimado: number
  cantidad_pedidos: number
}

export interface CerrarCajaPayload {
  sesion_id: string
  monto_pagado_empleados: number
}
