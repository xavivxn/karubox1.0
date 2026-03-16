'use server'

import { createClient } from '@/lib/supabase/server'
import { getSesionAbierta, getSesionCerradaMasReciente, calcularTotalesTurno } from '@/features/caja/services/cajaService'
import type { SesionCaja } from '@/features/caja/types/caja.types'

export type CajaActionResult<T = void> = { success: true; data: T } | { success: false; error: string }

/**
 * Obtiene la sesión de caja abierta del tenant (para UI y bloqueos).
 * Cualquier usuario autenticado del tenant puede leer.
 */
export async function getSesionAbiertaAction(tenantId: string | null): Promise<CajaActionResult<SesionCaja | null>> {
  if (!tenantId) return { success: true, data: null }

  const supabase = await createClient()
  try {
    const sesion = await getSesionAbierta(supabase, tenantId)
    return { success: true, data: sesion }
  } catch (e) {
    console.error('getSesionAbiertaAction:', e)
    return { success: false, error: 'Error al consultar estado de caja.' }
  }
}

/**
 * Obtiene la última sesión de caja cerrada (para mostrar resumen hasta que se abra de nuevo).
 */
export async function getSesionCerradaMasRecienteAction(tenantId: string | null): Promise<CajaActionResult<SesionCaja | null>> {
  if (!tenantId) return { success: true, data: null }

  const supabase = await createClient()
  try {
    const sesion = await getSesionCerradaMasReciente(supabase, tenantId)
    return { success: true, data: sesion }
  } catch (e) {
    console.error('getSesionCerradaMasRecienteAction:', e)
    return { success: false, error: 'Error al consultar último cierre.' }
  }
}

/**
 * Empezar el día: crea una nueva sesión de caja (cierre_at NULL).
 * Solo admin del tenant.
 */
export async function abrirCajaAction(tenantId: string | null): Promise<CajaActionResult<SesionCaja>> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No hay sesión activa.' }

  const { data: usuario, error: errUsuario } = await supabase
    .from('usuarios')
    .select('id, tenant_id, rol')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (errUsuario || !usuario) return { success: false, error: 'Usuario no encontrado.' }
  if (usuario.rol !== 'admin') return { success: false, error: 'Solo un administrador puede iniciar el día.' }
  if (usuario.tenant_id !== tenantId || !tenantId)
    return { success: false, error: 'Tenant inválido.' }

  try {
    const sesionExistente = await getSesionAbierta(supabase, tenantId)
    if (sesionExistente) return { success: false, error: 'Ya hay una caja abierta. Cerrala antes de abrir otra.' }

    const { data: nueva, error } = await supabase
      .from('sesiones_caja')
      .insert({
        tenant_id: tenantId,
        abierto_por_id: usuario.id,
        total_ventas: 0,
        total_costo_estimado: 0,
        monto_pagado_empleados: 0,
        ganancia_neta: 0,
        cantidad_pedidos: 0
      })
      .select()
      .single()

    if (error) {
      console.error('abrirCajaAction:', error)
      return { success: false, error: error.message || 'Error al abrir la caja.' }
    }
    return { success: true, data: nueva as SesionCaja }
  } catch (e) {
    console.error('abrirCajaAction:', e)
    const msg = e instanceof Error ? e.message : 'Error al abrir la caja. ¿Ejecutaste la migración 11_sesiones_caja.sql en Supabase?'
    return { success: false, error: msg }
  }
}

/**
 * Cerrar caja: actualiza la sesión con cierre_at, totales y monto pagado a empleados.
 * Solo admin.
 */
export async function cerrarCajaAction(
  sesionId: string,
  montoPagadoEmpleados: number
): Promise<CajaActionResult<SesionCaja>> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No hay sesión activa.' }

  const { data: usuario, error: errUsuario } = await supabase
    .from('usuarios')
    .select('id, tenant_id, rol')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (errUsuario || !usuario) return { success: false, error: 'Usuario no encontrado.' }
  if (usuario.rol !== 'admin') return { success: false, error: 'Solo un administrador puede cerrar la caja.' }

  const { data: sesion, error: errSesion } = await supabase
    .from('sesiones_caja')
    .select('id, tenant_id, apertura_at, cierre_at')
    .eq('id', sesionId)
    .single()

  if (errSesion || !sesion) return { success: false, error: 'Sesión no encontrada.' }
  if ((sesion as { tenant_id: string }).tenant_id !== usuario.tenant_id)
    return { success: false, error: 'No podés cerrar la caja de otro local.' }
  if ((sesion as { cierre_at: string | null }).cierre_at != null)
    return { success: false, error: 'Esta caja ya está cerrada.' }

  const tenantId = (sesion as { tenant_id: string }).tenant_id
  const aperturaAt = (sesion as { apertura_at: string }).apertura_at
  const totales = await calcularTotalesTurno(supabase, tenantId, aperturaAt)
  const monto = Number(montoPagadoEmpleados) || 0
  const gananciaNeta =
    totales.total_ventas - totales.total_costo_estimado - monto

  const { data: actualizada, error } = await supabase
    .from('sesiones_caja')
    .update({
      cierre_at: new Date().toISOString(),
      cerrado_por_id: usuario.id,
      total_ventas: totales.total_ventas,
      total_costo_estimado: totales.total_costo_estimado,
      monto_pagado_empleados: monto,
      ganancia_neta: gananciaNeta,
      cantidad_pedidos: totales.cantidad_pedidos
    })
    .eq('id', sesionId)
    .select()
    .single()

  if (error) {
    console.error('cerrarCajaAction:', error)
    return { success: false, error: 'Error al cerrar la caja.' }
  }
  return { success: true, data: actualizada as SesionCaja }
}

/**
 * Devuelve los totales del turno actual (para el modal de cierre).
 * Solo si hay sesión abierta.
 */
export async function getTotalesTurnoAction(
  tenantId: string | null,
  aperturaAt: string
): Promise<CajaActionResult<{ total_ventas: number; total_costo_estimado: number; cantidad_pedidos: number }>> {
  if (!tenantId) return { success: false, error: 'Tenant inválido.' }

  const supabase = await createClient()
  try {
    const totales = await calcularTotalesTurno(supabase, tenantId, aperturaAt)
    return { success: true, data: totales }
  } catch (e) {
    console.error('getTotalesTurnoAction:', e)
    return { success: false, error: 'Error al calcular totales.' }
  }
}
