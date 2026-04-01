import { createClient } from '@/lib/supabase/client'
import {
  reprintCocinaViaPedidoBump,
  reprintFacturaViaFacturaBump,
} from './reprintViaRealtime'

/**
 * Reimpresión solo vía Supabase: INSERT en `reprint_solicitud` (cocina o factura).
 * El agente escucha Realtime en esa tabla. No hay HTTP al PC del local.
 */
export async function requestAgentPrint(
  pedidoId: string,
  tipo: 'cocina' | 'factura',
  tenantId: string
): Promise<string> {
  const supabase = createClient()

  if (tipo === 'cocina') {
    const r = await reprintCocinaViaPedidoBump(supabase, pedidoId, tenantId)
    if (!r.ok) throw new Error(r.error)
    return 'Listo. Reimpresión cocina encolada (reprint_solicitud). El agente debe imprimir solo cocina.'
  }

  const r = await reprintFacturaViaFacturaBump(supabase, pedidoId, tenantId)
  if (!r.ok) throw new Error(r.error)
  return 'Listo. Reimpresión factura encolada (reprint_solicitud). El agente debe imprimir solo factura, una copia por solicitud (emisión inicial = 2 copias; ver docs/AGENTE_FACTURA_EMISION_DOS_COPIAS.md).'
}
