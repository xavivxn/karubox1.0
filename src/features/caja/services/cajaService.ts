/**
 * Servicio de sesiones de caja: obtener sesión abierta y calcular totales del turno
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { SesionCaja, TotalesTurno } from '../types/caja.types'
import { estimateCostFromAmount, normalizeNumber } from '@/features/admin/utils/admin.utils'

export interface PedidoTurnoRow {
  id: string
  total: number
  created_at: string
}


/**
 * Obtiene la sesión de caja abierta para el tenant (cierre_at IS NULL)
 */
export async function getSesionAbierta(
  supabase: SupabaseClient,
  tenantId: string
): Promise<SesionCaja | null> {
  const { data, error } = await supabase
    .from('sesiones_caja')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('cierre_at', null)
    .order('apertura_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as SesionCaja | null
}

/**
 * Obtiene la última sesión de caja cerrada del tenant (para mostrar resumen hasta que se abra de nuevo)
 */
export async function getSesionCerradaMasReciente(
  supabase: SupabaseClient,
  tenantId: string
): Promise<SesionCaja | null> {
  const { data, error } = await supabase
    .from('sesiones_caja')
    .select('*')
    .eq('tenant_id', tenantId)
    .not('cierre_at', 'is', null)
    .order('cierre_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as SesionCaja | null
}

/**
 * Calcula totales del turno: ventas y costo estimado desde pedidos en [aperturaAt, ahora]
 * Solo pedidos con estado_pedido = 'FACT' (confirmados, no anulados)
 */
export async function calcularTotalesTurno(
  supabase: SupabaseClient,
  tenantId: string,
  aperturaAt: string
): Promise<TotalesTurno> {
  const ahora = new Date().toISOString()

  const { data: pedidos, error: errPedidos } = await supabase
    .from('pedidos')
    .select('id, total, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', aperturaAt)
    .lte('created_at', ahora)
    .eq('estado_pedido', 'FACT')

  if (errPedidos) throw errPedidos
  const list = (pedidos ?? []) as PedidoTurnoRow[]

  const total_ventas = list.reduce((acc, p) => acc + normalizeNumber(p.total), 0)
  const cantidad_pedidos = list.length

  if (list.length === 0) {
    return { total_ventas: 0, total_costo_estimado: 0, cantidad_pedidos: 0 }
  }

  const ids = list.map((p) => p.id)
  const { data: items, error: errItems } = await supabase
    .from('items_pedido')
    .select('subtotal')
    .in('pedido_id', ids)

  if (errItems) throw errItems
  const itemsList = (items ?? []) as { subtotal: number }[]
  const total_costo_estimado = itemsList.reduce(
    (acc, item) => acc + estimateCostFromAmount(normalizeNumber(item.subtotal)),
    0
  )

  return {
    total_ventas,
    total_costo_estimado,
    cantidad_pedidos
  }
}
