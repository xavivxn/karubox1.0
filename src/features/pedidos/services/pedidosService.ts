import { createClient } from '@/lib/supabase/client'
import type { HistorialPedidosFilters, PedidoParaHistorial } from '../types/pedidos.types'

export const pedidosService = {
  async listForHistorial(
    tenantId: string,
    filters: HistorialPedidosFilters
  ): Promise<{ data: PedidoParaHistorial[]; error: Error | null }> {
    const supabase = createClient()

    let query = supabase
      .from('pedidos')
      .select(
        `
        id,
        numero_pedido,
        tenant_id,
        cliente_id,
        usuario_id,
        tipo,
        estado,
        estado_pedido,
        total,
        puntos_generados,
        created_at,
        cancelado_por_id,
        cancelado_at,
        motivo_cancelacion,
        clientes:cliente_id(nombre),
        usuarios:usuario_id(nombre)
      `
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (filters.fechaDesde) {
      query = query.gte('created_at', `${filters.fechaDesde}T00:00:00.000Z`)
    }
    if (filters.fechaHasta) {
      query = query.lte('created_at', `${filters.fechaHasta}T23:59:59.999Z`)
    }
    if (filters.estadoPedido !== 'todos') {
      query = query.eq('estado_pedido', filters.estadoPedido)
    }
    if (filters.numeroPedido.trim()) {
      const num = parseInt(filters.numeroPedido, 10)
      if (!Number.isNaN(num)) {
        query = query.eq('numero_pedido', num)
      }
    }

    const { data, error } = await query.limit(200)

    if (error) {
      return { data: [], error: new Error(error.message) }
    }

    const rows: PedidoParaHistorial[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      numero_pedido: row.numero_pedido as number,
      tenant_id: row.tenant_id as string,
      cliente_id: row.cliente_id as string | null,
      usuario_id: row.usuario_id as string | null,
      tipo: row.tipo as 'local' | 'delivery' | 'para_llevar',
      estado: row.estado as string,
      estado_pedido: row.estado_pedido as string,
      total: Number(row.total),
      puntos_generados: Number(row.puntos_generados ?? 0),
      created_at: row.created_at as string,
      cancelado_por_id: row.cancelado_por_id as string | null,
      cancelado_at: row.cancelado_at as string | null,
      motivo_cancelacion: row.motivo_cancelacion as string | null,
      cliente_nombre: (row.clientes as { nombre: string | null } | null)?.nombre ?? null,
      usuario_nombre: (row.usuarios as { nombre: string | null } | null)?.nombre ?? null
    }))

    return { data: rows, error: null }
  }
}
