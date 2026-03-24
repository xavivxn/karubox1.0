import type { SupabaseClient } from '@supabase/supabase-js'
import {
  agentPrintUrl,
  buildCocinaPayload,
  buildFacturaPayload,
  type AgentPrintBody,
} from './agentPrintPayloads'
import type {
  DetalleFacturaItem,
  FacturaParaImpresion,
} from '@/features/facturacion/types/facturacion.types'

interface VistaFacturaRow {
  factura_id: string
  pedido_id: string
  tenant_id: string
  numero_pedido: number
  emisor_ruc: string | null
  emisor_razon_social: string | null
  emisor_direccion: string | null
  emisor_telefono: string | null
  emisor_email: string | null
  emisor_actividad_economica: string | null
  receptor_ruc: string | null
  receptor_ci: string | null
  receptor_nombre: string | null
  receptor_direccion: string | null
  receptor_telefono: string | null
  receptor_email: string | null
  numero_factura: string
  timbrado: string
  timbrado_vigencia_inicio: string
  timbrado_vigencia_fin: string
  fecha_emision: string
  total_iva_10: number
  total_iva_5: number
  total_exento: number
  total_a_pagar: number
  total_letras: string | null
  detalle: unknown
}

function mapVistaToFactura(row: VistaFacturaRow): FacturaParaImpresion {
  const detalleRaw = row.detalle
  const detalle: DetalleFacturaItem[] = Array.isArray(detalleRaw)
    ? (detalleRaw as DetalleFacturaItem[])
    : []

  return {
    factura_id: row.factura_id,
    pedido_id: row.pedido_id,
    tenant_id: row.tenant_id,
    numero_pedido: row.numero_pedido,
    emisor: {
      ruc: row.emisor_ruc,
      razon_social: row.emisor_razon_social ?? '',
      direccion: row.emisor_direccion,
      telefono: row.emisor_telefono,
      email: row.emisor_email,
      actividad_economica: row.emisor_actividad_economica,
    },
    receptor: {
      ruc: row.receptor_ruc,
      ci: row.receptor_ci,
      nombre: row.receptor_nombre,
      direccion: row.receptor_direccion,
      telefono: row.receptor_telefono,
      email: row.receptor_email,
    },
    documento: {
      numero_factura: row.numero_factura,
      timbrado: row.timbrado,
      timbrado_vigencia_inicio: row.timbrado_vigencia_inicio,
      timbrado_vigencia_fin: row.timbrado_vigencia_fin,
      fecha_emision: row.fecha_emision,
    },
    totales: {
      total_iva_10: Number(row.total_iva_10),
      total_iva_5: Number(row.total_iva_5),
      total_exento: Number(row.total_exento),
      total_a_pagar: Number(row.total_a_pagar),
      total_letras: row.total_letras,
    },
    detalle,
  }
}

type PrepareResult =
  | { ok: true; url: string; body: AgentPrintBody }
  | { ok: false; status: number; error: string }

/**
 * Carga datos en Supabase (sesión del caller) y arma el cuerpo para POST /print del agente local.
 */
export async function prepareAgentPrint(
  supabase: SupabaseClient,
  params: {
    pedidoId: string
    tenantId: string
    tipo: 'cocina' | 'factura'
    /** Reimpresión manual: no altera BD */
    metodoPagoDefault?: string
  }
): Promise<PrepareResult> {
  const { pedidoId, tenantId, tipo } = params
  const metodoPagoDefault = params.metodoPagoDefault ?? 'Efectivo'

  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .select('id, tenant_id, numero_pedido, tipo, notas, created_at, cliente_id, estado_pedido')
    .eq('id', pedidoId)
    .single()

  if (pedidoErr || !pedido) {
    return { ok: false, status: 404, error: 'Pedido no encontrado' }
  }

  const row = pedido as {
    id: string
    tenant_id: string
    numero_pedido: number
    tipo: 'local' | 'delivery' | 'para_llevar'
    notas: string | null
    created_at: string
    cliente_id: string | null
    estado_pedido: string
  }

  if (row.tenant_id !== tenantId) {
    return { ok: false, status: 403, error: 'El pedido no pertenece a tu local' }
  }

  if (row.estado_pedido !== 'FACT') {
    return { ok: false, status: 400, error: 'Solo se puede reimprimir pedidos confirmados (FACT)' }
  }

  const { data: printerRow, error: pcErr } = await supabase
    .from('printer_config')
    .select('printer_id, agent_ip, agent_port, activo')
    .eq('lomiteria_id', tenantId)
    .eq('activo', true)
    .maybeSingle()

  if (pcErr || !printerRow) {
    return {
      ok: false,
      status: 400,
      error: 'No hay impresora configurada o activa para este local',
    }
  }

  const pc = printerRow as { printer_id: string; agent_ip: string; agent_port: number }
  const url = agentPrintUrl(pc.agent_ip, pc.agent_port ?? 3001)

  if (tipo === 'cocina') {
    const { data: itemsRows, error: itemsErr } = await supabase
      .from('vista_items_ticket_cocina')
      .select('producto_nombre, cantidad, modificaciones, notas_item, item_pedido_id')
      .eq('pedido_id', pedidoId)
      .order('item_pedido_id', { ascending: true })

    if (itemsErr) {
      return { ok: false, status: 500, error: itemsErr.message }
    }

    const { data: tenantRow, error: tErr } = await supabase
      .from('tenants')
      .select('nombre')
      .eq('id', tenantId)
      .single()

    if (tErr || !tenantRow) {
      return { ok: false, status: 500, error: 'No se pudo cargar el nombre del local' }
    }

    let cliente: { nombre: string; telefono?: string | null; direccion?: string | null } | null =
      null
    if (row.cliente_id) {
      const { data: c } = await supabase
        .from('clientes')
        .select('nombre, telefono, direccion')
        .eq('id', row.cliente_id)
        .single()
      if (c) {
        const cr = c as { nombre: string; telefono: string | null; direccion: string | null }
        if (row.tipo === 'delivery') {
          cliente = { nombre: cr.nombre, telefono: cr.telefono, direccion: cr.direccion }
        } else {
          cliente = { nombre: cr.nombre }
        }
      }
    }

    const vistaRows = (itemsRows ?? []) as Array<{
      producto_nombre: string
      cantidad: number
      modificaciones: string | null
      notas_item?: string | null
    }>

    const body = buildCocinaPayload({
      printerId: pc.printer_id,
      numeroPedido: row.numero_pedido,
      tipoPedido: row.tipo,
      lomiteriaNombre: (tenantRow as { nombre: string }).nombre,
      notasPedido: row.notas,
      createdAt: row.created_at,
      cliente,
      vistaRows,
    })

    return { ok: true, url, body }
  }

  const { data: facturaMeta, error: fMetaErr } = await supabase
    .from('facturas')
    .select('id, anulada')
    .eq('pedido_id', pedidoId)
    .maybeSingle()

  if (fMetaErr || !facturaMeta) {
    return { ok: false, status: 400, error: 'Este pedido no tiene factura emitida' }
  }

  const fm = facturaMeta as { anulada: boolean }
  if (fm.anulada) {
    return { ok: false, status: 400, error: 'La factura de este pedido está anulada' }
  }

  const { data: vistaRow, error: vErr } = await supabase
    .from('vista_factura_impresion')
    .select('*')
    .eq('pedido_id', pedidoId)
    .maybeSingle()

  if (vErr || !vistaRow) {
    return { ok: false, status: 500, error: 'No se pudieron cargar los datos de la factura' }
  }

  const factura = mapVistaToFactura(vistaRow as VistaFacturaRow)
  const body = buildFacturaPayload(pc.printer_id, factura, metodoPagoDefault)

  return { ok: true, url, body }
}

export async function postToAgentPrint(
  url: string,
  body: AgentPrintBody,
  timeoutMs = 20_000
): Promise<{ ok: true; message?: string } | { ok: false; error: string }> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const text = await res.text()
    let json: { success?: boolean; message?: string; error?: string } = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      return { ok: false, error: `Respuesta no JSON del agente (${res.status})` }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: json.error || `Error HTTP ${res.status}`,
      }
    }

    if (json.success === false) {
      return { ok: false, error: json.error || 'El agente rechazó la impresión' }
    }

    return { ok: true, message: json.message }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, error: 'Tiempo de espera agotado al contactar al agente de impresión' }
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error de red al contactar al agente',
    }
  } finally {
    clearTimeout(t)
  }
}
