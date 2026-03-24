import type { FacturaParaImpresion } from '@/features/facturacion/types/facturacion.types'

/** Body POST /print del agente — ticket cocina (ver docs/INSTRUCCIONES_AGENTE_IMPRESION.md) */
export interface AgentCocinaPrintBody {
  printerId: string
  tipo: 'cocina'
  data: {
    numeroPedido: number
    tipoPedido: string
    lomiteriaNombre: string
    items: Array<{
      nombre: string
      cantidad: number
      personalizaciones: string | null
      notasItem: string | null
    }>
    cliente: {
      nombre: string
      telefono?: string | null
      direccion?: string | null
    } | null
    fecha: string
    notas: string | null
  }
}

/**
 * Body POST /print tipo factura — nombres en camelCase típicos de generateInvoice;
 * si el agente espera alias distintos, ajustar solo aquí.
 */
export interface AgentFacturaPrintBody {
  printerId: string
  tipo: 'factura'
  data: {
    numeroFactura: string
    timbrado: string
    timbradoVigenciaInicio: string
    timbradoVigenciaFin: string
    fecha: string
    metodoPago: string
    lomiteriaName: string
    lomiteriaAddress: string | null
    lomiteriaTaxId: string | null
    cliente: {
      nombre: string | null
      direccion: string | null
      ci: string | null
      ruc: string | null
      telefono: string | null
    }
    items: Array<{
      nombre: string
      cantidad: number
      precioUnitario: number
      subtotal: number
      ivaPorcentaje: number
      montoIva: number
    }>
    subtotalNeto: number
    totalIva10: number
    totalIva5: number
    totalExento: number
    total: number
    totalLetras: string | null
  }
}

export type AgentPrintBody = AgentCocinaPrintBody | AgentFacturaPrintBody

function emptyToNull(s: string | null | undefined): string | null {
  if (s == null || s.trim() === '') return null
  return s
}

export function buildCocinaPayload(params: {
  printerId: string
  numeroPedido: number
  tipoPedido: 'local' | 'delivery' | 'para_llevar'
  lomiteriaNombre: string
  notasPedido: string | null
  createdAt: string
  cliente: { nombre: string; telefono?: string | null; direccion?: string | null } | null
  vistaRows: Array<{
    producto_nombre: string
    cantidad: number
    modificaciones: string | null
    notas_item?: string | null
  }>
}): AgentCocinaPrintBody {
  const items = params.vistaRows.map((row) => ({
    nombre: row.producto_nombre,
    cantidad: row.cantidad,
    personalizaciones: emptyToNull(row.modificaciones ?? ''),
    notasItem: emptyToNull(row.notas_item ?? null),
  }))

  return {
    printerId: params.printerId,
    tipo: 'cocina',
    data: {
      numeroPedido: params.numeroPedido,
      tipoPedido: params.tipoPedido,
      lomiteriaNombre: params.lomiteriaNombre,
      items,
      cliente: params.cliente
        ? {
            nombre: params.cliente.nombre,
            telefono: params.cliente.telefono ?? null,
            direccion: params.cliente.direccion ?? null,
          }
        : null,
      fecha: params.createdAt,
      notas: emptyToNull(params.notasPedido),
    },
  }
}

export function buildFacturaPayload(
  printerId: string,
  f: FacturaParaImpresion,
  metodoPago: string
): AgentFacturaPrintBody {
  const items = f.detalle.map((line) => ({
    nombre: line.producto_nombre,
    cantidad: line.cantidad,
    precioUnitario: line.precio_unitario,
    subtotal: line.subtotal,
    ivaPorcentaje: line.iva_porcentaje,
    montoIva: line.monto_iva,
  }))

  const subtotalNeto = f.detalle.reduce((acc, line) => acc + (line.subtotal - line.monto_iva), 0)

  return {
    printerId,
    tipo: 'factura',
    data: {
      numeroFactura: f.documento.numero_factura,
      timbrado: f.documento.timbrado,
      timbradoVigenciaInicio: f.documento.timbrado_vigencia_inicio,
      timbradoVigenciaFin: f.documento.timbrado_vigencia_fin,
      fecha: f.documento.fecha_emision,
      metodoPago,
      lomiteriaName: f.emisor.razon_social || '—',
      lomiteriaAddress: f.emisor.direccion,
      lomiteriaTaxId: f.emisor.ruc,
      cliente: {
        nombre: f.receptor.nombre,
        direccion: f.receptor.direccion,
        ci: f.receptor.ci,
        ruc: f.receptor.ruc,
        telefono: f.receptor.telefono,
      },
      items,
      subtotalNeto,
      totalIva10: f.totales.total_iva_10,
      totalIva5: f.totales.total_iva_5,
      totalExento: f.totales.total_exento,
      total: f.totales.total_a_pagar,
      totalLetras: f.totales.total_letras,
    },
  }
}

export function agentPrintUrl(agentIp: string, agentPort: number): string {
  const port = Number.isFinite(agentPort) && agentPort > 0 ? agentPort : 3001
  if (agentIp.startsWith('http://') || agentIp.startsWith('https://')) {
    try {
      const u = new URL(agentIp)
      u.port = String(port)
      u.pathname = '/print'
      u.search = ''
      u.hash = ''
      return u.toString()
    } catch {
      return `${agentIp.replace(/\/$/, '')}:${port}/print`
    }
  }
  return `http://${agentIp}:${port}/print`
}
