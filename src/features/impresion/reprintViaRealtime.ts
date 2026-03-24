import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cola explícita para reimpresión (Realtime): el agente escucha INSERT en
 * `reprint_solicitud` e imprime solo lo indicado en `tipo` ('cocina' | 'factura').
 * Requiere `database/14_reprint_solicitud.sql` (y `15_bump_factura_reprint_solicitud.sql` si usás RPC factura).
 */
async function enqueueReprintSolicitud(
  supabase: SupabaseClient,
  pedidoId: string,
  tenantId: string,
  tipo: 'cocina' | 'factura'
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { data, error } = await supabase
    .from('reprint_solicitud')
    .insert({ tenant_id: tenantId, pedido_id: pedidoId, tipo })
    .select('id')
    .maybeSingle()

  if (error) {
    return { ok: false, status: 500, error: error.message }
  }
  if (!data) {
    return {
      ok: false,
      status: 404,
      error:
        'No se pudo encolar la reimpresión. ¿Ejecutaste database/14_reprint_solicitud.sql en Supabase?',
    }
  }
  return { ok: true }
}

/**
 * Reimpresión solo cocina (no actualiza `pedidos.updated_at`).
 */
export async function reprintCocinaViaPedidoBump(
  supabase: SupabaseClient,
  pedidoId: string,
  tenantId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  return enqueueReprintSolicitud(supabase, pedidoId, tenantId, 'cocina')
}

/**
 * Reimpresión solo factura (no depende de UPDATE en `facturas`; mismo canal que cocina).
 */
export async function reprintFacturaViaFacturaBump(
  supabase: SupabaseClient,
  pedidoId: string,
  tenantId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  return enqueueReprintSolicitud(supabase, pedidoId, tenantId, 'factura')
}
