'use client'

import { useEffect, useState } from 'react'
import { X, Search, User, MapPin, Package, StickyNote } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { pedidosService } from '@/features/pedidos/services/pedidosService'
import type { HistorialPedidosFilters, PedidoParaHistorial } from '@/features/pedidos/types/pedidos.types'
import { ReprintOrderActions } from '@/features/pedidos/components/ReprintOrderActions'
import { requestAgentPrint } from '@/features/impresion/agentPrintClient'
import { formatGuaranies } from '@/lib/utils/format'

const TIPO_LABEL: Record<string, string> = {
  local: 'Local',
  delivery: 'Delivery',
  para_llevar: 'Para llevar',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

function truncateText(text: string | null | undefined, max: number): string | null {
  if (text == null) return null
  const t = text.trim()
  if (!t) return null
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function defaultReprintFilters(): HistorialPedidosFilters {
  const today = new Date().toISOString().slice(0, 10)
  const d = new Date()
  d.setDate(d.getDate() - 7)
  const desde = d.toISOString().slice(0, 10)
  return {
    fechaDesde: desde,
    fechaHasta: today,
    estadoPedido: 'FACT',
    numeroPedido: '',
  }
}

interface ReprintPOSModalProps {
  open: boolean
  onClose: () => void
  darkMode: boolean
}

export function ReprintPOSModal({ open, onClose, darkMode }: ReprintPOSModalProps) {
  const { tenant } = useTenant()
  const [filters, setFilters] = useState<HistorialPedidosFilters>(defaultReprintFilters)
  const [pedidos, setPedidos] = useState<PedidoParaHistorial[]>([])
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [printingKey, setPrintingKey] = useState<string | null>(null)
  const [printFeedback, setPrintFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function runLoad(applied: HistorialPedidosFilters) {
    if (!tenant?.id) return
    setLoading(true)
    setListError(null)
    const { data, error } = await pedidosService.listForHistorial(tenant.id, applied)
    setLoading(false)
    if (error) {
      setListError(error.message)
      setPedidos([])
      return
    }
    setPedidos(data)
  }

  useEffect(() => {
    if (!open || !tenant?.id) return
    const initial = defaultReprintFilters()
    setFilters(initial)
    setPrintFeedback(null)
    setListError(null)
    let cancelled = false
    setLoading(true)
    setListError(null)
    pedidosService.listForHistorial(tenant.id, initial).then(({ data, error }) => {
      if (cancelled) return
      setLoading(false)
      if (error) {
        setListError(error.message)
        setPedidos([])
        return
      }
      setPedidos(data)
    })
    return () => {
      cancelled = true
    }
  }, [open, tenant?.id])

  const handleReprint = async (pedidoId: string, tipo: 'cocina' | 'factura') => {
    if (!tenant?.id) return
    const key = `${pedidoId}:${tipo}`
    setPrintingKey(key)
    setPrintFeedback(null)
    try {
      const msg = await requestAgentPrint(pedidoId, tipo, tenant.id)
      setPrintFeedback({ type: 'ok', text: msg })
    } catch (e) {
      setPrintFeedback({
        type: 'err',
        text: e instanceof Error ? e.message : 'No se pudo imprimir',
      })
    } finally {
      setPrintingKey(null)
    }
  }

  if (!open) return null

  const panel = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const label = darkMode ? 'text-gray-400' : 'text-gray-600'
  const input = darkMode
    ? 'border-gray-600 bg-gray-800 text-gray-100'
    : 'border-gray-300 bg-white text-gray-900'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reprint-pos-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl border shadow-xl sm:max-h-[85vh] sm:rounded-2xl ${panel}`}
      >
        <div
          className={`flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3 ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2
            id="reprint-pos-title"
            className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Reimprimir
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className={`mb-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Pedidos confirmados del rango elegido. Enviá de nuevo el ticket a cocina o la factura al agente de
            impresión (misma red que el servidor o configuración de red).
          </p>

          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="min-w-0">
              <label className={`mb-1 block text-xs font-medium ${label}`}>Desde</label>
              <input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => setFilters((f) => ({ ...f, fechaDesde: e.target.value }))}
                className={`w-full min-h-[40px] rounded-lg border px-2 py-1.5 text-sm ${input}`}
              />
            </div>
            <div className="min-w-0">
              <label className={`mb-1 block text-xs font-medium ${label}`}>Hasta</label>
              <input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => setFilters((f) => ({ ...f, fechaHasta: e.target.value }))}
                className={`w-full min-h-[40px] rounded-lg border px-2 py-1.5 text-sm ${input}`}
              />
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <label className={`mb-1 block text-xs font-medium ${label}`}>Nº pedido</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Todos"
                value={filters.numeroPedido}
                onChange={(e) => setFilters((f) => ({ ...f, numeroPedido: e.target.value }))}
                className={`w-full min-h-[40px] rounded-lg border px-2 py-1.5 text-sm ${input}`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void runLoad(filters)}
            disabled={loading}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Buscar pedidos
          </button>

          {listError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {listError}
            </div>
          )}

          {printFeedback && (
            <div
              className={`mb-3 rounded-lg border px-3 py-2 text-sm ${
                printFeedback.type === 'ok'
                  ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {printFeedback.text}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : pedidos.length === 0 ? (
            <p className={`py-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              No hay pedidos confirmados en este rango.
            </p>
          ) : (
            <ul className="space-y-2 pb-2">
              {pedidos.map((p) => {
                const estadoEt = ESTADO_LABEL[p.estado] ?? p.estado
                const notasCorta = truncateText(p.notas, 120)
                const dirCorta = truncateText(p.cliente_direccion, 100)
                return (
                  <li
                    key={p.id}
                    className={`rounded-xl border p-3 ${darkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-gray-50/80'}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          #{p.numero_pedido}
                        </span>
                        <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatFecha(p.created_at)}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                        {formatGuaranies(p.total)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          darkMode ? 'bg-orange-500/20 text-orange-200' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {TIPO_LABEL[p.tipo] ?? p.tipo}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {estadoEt}
                      </span>
                    </div>

                    <div
                      className={`mt-2 flex flex-col gap-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                        <div className="min-w-0">
                          <span className="font-medium">{p.cliente_nombre ?? 'Sin cliente'}</span>
                          {p.cliente_telefono ? (
                            <span className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {p.cliente_telefono}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {p.tipo === 'delivery' && dirCorta ? (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                          <span className="min-w-0 leading-snug">{dirCorta}</span>
                        </div>
                      ) : null}

                      <div className="flex items-start gap-2">
                        <Package className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                        <span className="min-w-0 leading-snug">{p.items_preview}</span>
                      </div>

                      {notasCorta ? (
                        <div className="flex items-start gap-2">
                          <StickyNote className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                          <span
                            className={`min-w-0 leading-snug italic ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            {notasCorta}
                          </span>
                        </div>
                      ) : null}

                      {p.usuario_nombre ? (
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Cajero: {p.usuario_nombre}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-600">
                      <ReprintOrderActions
                        pedido={p}
                        darkMode={darkMode}
                        printingKey={printingKey}
                        onReprint={handleReprint}
                        layout="row"
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
