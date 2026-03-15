import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Revierte puntos, inventario e ingredientes de un pedido y lo marca como anulado.
 * Solo debe ser llamado después de validar que el usuario es admin del tenant.
 */
export async function cancelOrder(
  supabase: SupabaseClient,
  params: {
    pedidoId: string
    tenantId: string
    usuarioId: string
    motivo?: string | null
  }
): Promise<{ success: boolean; error: string | null }> {
  const { pedidoId, tenantId, usuarioId, motivo } = params

  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .select('id, numero_pedido, estado_pedido, cliente_id, puntos_generados')
    .eq('id', pedidoId)
    .eq('tenant_id', tenantId)
    .single()

  if (errPedido || !pedido) {
    return { success: false, error: 'Pedido no encontrado o no pertenece a este local.' }
  }

  if (pedido.estado_pedido === 'ANUL') {
    return { success: false, error: 'El pedido ya está anulado.' }
  }

  if (pedido.estado_pedido !== 'FACT') {
    return { success: false, error: 'Solo se pueden anular pedidos confirmados (FACT).' }
  }

  const numeroPedido = pedido.numero_pedido

  // ── 1. Revertir puntos del cliente ─────────────────────────────────────
  if (pedido.cliente_id && pedido.puntos_generados > 0) {
    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('id, puntos_totales')
      .eq('id', pedido.cliente_id)
      .single()

    if (!errCliente && cliente) {
      const nuevosPuntos = Math.max(0, (cliente.puntos_totales ?? 0) - pedido.puntos_generados)
      await supabase
        .from('clientes')
        .update({ puntos_totales: nuevosPuntos })
        .eq('id', pedido.cliente_id)

      await supabase.from('transacciones_puntos').insert({
        tenant_id: tenantId,
        cliente_id: pedido.cliente_id,
        pedido_id: pedidoId,
        tipo: 'ajuste',
        puntos: -pedido.puntos_generados,
        saldo_anterior: cliente.puntos_totales ?? 0,
        saldo_nuevo: nuevosPuntos,
        descripcion: `Anulación pedido #${numeroPedido}`
      })
    }
  }

  // ── 2. Revertir movimientos de ingredientes (devolver stock) ───────────
  const { data: movIngredientes } = await supabase
    .from('movimientos_ingredientes')
    .select('id, ingrediente_id, cantidad, tenant_id')
    .eq('pedido_id', pedidoId)
    .eq('tipo', 'salida')

  if (movIngredientes?.length) {
    for (const mov of movIngredientes) {
      const { data: ing } = await supabase
        .from('ingredientes')
        .select('id, stock_actual')
        .eq('id', mov.ingrediente_id)
        .single()

      if (ing) {
        const nuevoStock = Number(ing.stock_actual ?? 0) + Number(mov.cantidad)
        await supabase
          .from('ingredientes')
          .update({ stock_actual: nuevoStock, updated_at: new Date().toISOString() })
          .eq('id', mov.ingrediente_id)

        await supabase.from('movimientos_ingredientes').insert({
          tenant_id: mov.tenant_id,
          ingrediente_id: mov.ingrediente_id,
          pedido_id: pedidoId,
          tipo: 'entrada',
          cantidad: mov.cantidad,
          stock_anterior: Number(ing.stock_actual ?? 0),
          stock_nuevo: nuevoStock,
          motivo: `Anulación pedido #${numeroPedido}`,
          usuario_id: usuarioId
        })
      }
    }
  }

  // ── 3. Revertir movimientos de inventario (productos sin receta) ───────
  const { data: movInventario } = await supabase
    .from('movimientos_inventario')
    .select('id, inventario_id, cantidad, tenant_id')
    .eq('pedido_id', pedidoId)
    .eq('tipo', 'salida')

  if (movInventario?.length) {
    for (const mov of movInventario) {
      const cantidadDevuelta = Math.abs(Number(mov.cantidad))
      const { data: inv } = await supabase
        .from('inventario')
        .select('id, stock_actual')
        .eq('id', mov.inventario_id)
        .single()

      if (inv) {
        const stockAnterior = Number(inv.stock_actual ?? 0)
        const nuevoStock = stockAnterior + cantidadDevuelta
        await supabase
          .from('inventario')
          .update({ stock_actual: nuevoStock, updated_at: new Date().toISOString() })
          .eq('id', mov.inventario_id)

        await supabase.from('movimientos_inventario').insert({
          tenant_id: mov.tenant_id,
          inventario_id: mov.inventario_id,
          pedido_id: pedidoId,
          tipo: 'entrada',
          cantidad: cantidadDevuelta,
          stock_anterior: stockAnterior,
          stock_nuevo: nuevoStock,
          motivo: `Anulación pedido #${numeroPedido}`,
          usuario_id: usuarioId
        })
      }
    }
  }

  // ── 4. Marcar factura como anulada si existe ───────────────────────────
  await supabase
    .from('facturas')
    .update({
      anulada: true,
      anulada_at: new Date().toISOString(),
      anulada_por_id: usuarioId,
      updated_at: new Date().toISOString()
    })
    .eq('pedido_id', pedidoId)

  // ── 5. Marcar pedido como anulado ──────────────────────────────────────
  const { error: errUpdate } = await supabase
    .from('pedidos')
    .update({
      estado_pedido: 'ANUL',
      estado: 'cancelado',
      cancelado_por_id: usuarioId,
      cancelado_at: new Date().toISOString(),
      motivo_cancelacion: motivo?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', pedidoId)
    .eq('tenant_id', tenantId)

  if (errUpdate) {
    return { success: false, error: errUpdate.message }
  }

  return { success: true, error: null }
}
