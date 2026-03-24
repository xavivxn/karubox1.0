'use client'

import { FileText, Loader2, Printer } from 'lucide-react'
import type { PedidoParaHistorial } from '../types/pedidos.types'

export function ReprintOrderActions({
  pedido,
  darkMode,
  printingKey,
  onReprint,
  layout = 'row',
}: {
  pedido: PedidoParaHistorial
  darkMode: boolean
  printingKey: string | null
  onReprint: (pedidoId: string, tipo: 'cocina' | 'factura') => void
  layout?: 'row' | 'stack'
}) {
  if (pedido.estado_pedido !== 'FACT') {
    return <span className="text-xs text-gray-400">—</span>
  }

  const busyCocina = printingKey === `${pedido.id}:cocina`
  const busyFactura = printingKey === `${pedido.id}:factura`
  const baseBtn = `inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
    darkMode
      ? 'border border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700'
      : 'border border-orange-200 bg-white text-orange-800 hover:bg-orange-50'
  }`

  return (
    <div className={layout === 'stack' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-1.5'}>
      <button
        type="button"
        disabled={busyCocina || busyFactura}
        onClick={() => onReprint(pedido.id, 'cocina')}
        className={baseBtn}
      >
        {busyCocina ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : (
          <Printer className="h-3.5 w-3.5 shrink-0" />
        )}
        Cocina
      </button>
      <button
        type="button"
        disabled={!pedido.factura_imprimible || busyCocina || busyFactura}
        title={!pedido.factura_imprimible ? 'No hay factura para este pedido' : undefined}
        onClick={() => onReprint(pedido.id, 'factura')}
        className={baseBtn}
      >
        {busyFactura ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0" />
        )}
        Factura
      </button>
    </div>
  )
}
