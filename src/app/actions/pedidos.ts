'use server'

import { createClient } from '@/lib/supabase/server'
import { cancelOrder } from '@/features/pedidos/services/cancelOrderService'

export type CancelOrderResult = { success: true } | { success: false; error: string }

/**
 * Anula un pedido: revierte puntos, inventario e ingredientes y marca factura/pedido como anulados.
 * Solo usuarios con rol **admin** del tenant pueden ejecutar esta acción.
 */
export async function cancelOrderAction(
  pedidoId: string,
  motivo?: string | null
): Promise<CancelOrderResult> {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No hay sesión activa.' }
  }

  const { data: usuario, error: errUsuario } = await supabase
    .from('usuarios')
    .select('id, tenant_id, rol')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (errUsuario || !usuario) {
    return { success: false, error: 'Usuario no encontrado.' }
  }

  if (usuario.rol !== 'admin') {
    return { success: false, error: 'Solo un administrador puede anular pedidos.' }
  }

  const tenantId = usuario.tenant_id
  if (!tenantId) {
    return { success: false, error: 'Usuario sin local asignado.' }
  }

  const result = await cancelOrder(supabase, {
    pedidoId,
    tenantId,
    usuarioId: usuario.id,
    motivo
  })

  if (!result.success) {
    return { success: false, error: result.error ?? 'Error al anular el pedido.' }
  }

  return { success: true }
}
