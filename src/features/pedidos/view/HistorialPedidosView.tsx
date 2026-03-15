'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Search, XCircle, FileText } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { useTenant } from '@/contexts/TenantContext'
import { useHistorialPedidos } from '../hooks/useHistorialPedidos'
import { CancelarPedidoModal } from '../components/CancelarPedidoModal'
import type { PedidoParaHistorial } from '../types/pedidos.types'
import { formatGuaranies } from '@/lib/utils/format'

const TIPO_LABEL: Record<string, string> = {
  local: 'Local',
  delivery: 'Delivery',
  para_llevar: 'Para llevar'
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function HistorialPedidosView() {
  const { tenant, darkMode, isAdmin } = useTenant()
  const {
    pedidos,
    loading,
    error,
    filters,
    setFilter,
    resetFilters,
    load
  } = useHistorialPedidos()

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [pedidoToCancel, setPedidoToCancel] = useState<PedidoParaHistorial | null>(null)

  useEffect(() => {
    if (tenant?.id) load(filters)
  }, [tenant?.id])

  const handleBuscar = () => {
    load(filters)
  }

  const openCancelModal = (p: PedidoParaHistorial) => {
    setPedidoToCancel(p)
    setCancelModalOpen(true)
  }

  const handleCancelSuccess = () => {
    load(filters)
  }

  if (!tenant) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-500">Cargando local...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial de pedidos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Consultá y, si sos admin, anulá pedidos confirmados.
          </p>
        </div>
        <Link
          href={ROUTES.PROTECTED.POS}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
            darkMode
              ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-orange-200'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Ir al POS
        </Link>
      </div>

      {/* Filtros */}
      <div
        className={`rounded-2xl border p-4 ${
          darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
        }`}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className={`mb-1 block text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Desde
            </label>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilter('fechaDesde', e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`mb-1 block text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Hasta
            </label>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilter('fechaHasta', e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`mb-1 block text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Estado
            </label>
            <select
              value={filters.estadoPedido}
              onChange={(e) => setFilter('estadoPedido', e.target.value as typeof filters.estadoPedido)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="todos">Todos</option>
              <option value="FACT">Confirmados</option>
              <option value="ANUL">Anulados</option>
            </select>
          </div>
          <div>
            <label className={`mb-1 block text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nº pedido
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ej: 42"
              value={filters.numeroPedido}
              onChange={(e) => setFilter('numeroPedido', e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                darkMode ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleBuscar}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className={`rounded-xl border px-3 py-2.5 text-sm ${
                darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div
        className={`overflow-hidden rounded-2xl border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">No hay pedidos con esos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className={darkMode ? 'bg-gray-800/80 text-gray-400' : 'bg-gray-50 text-gray-600'}>
                <tr>
                  <th className="px-4 py-3 font-medium">Nº</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  {isAdmin && <th className="px-4 py-3 font-medium">Acción</th>}
                </tr>
              </thead>
              <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                {pedidos.map((p) => (
                  <tr
                    key={p.id}
                    className={darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      #{p.numero_pedido}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {formatFecha(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {p.cliente_nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {TIPO_LABEL[p.tipo] ?? p.tipo}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {formatGuaranies(p.total)}
                    </td>
                    <td className="px-4 py-3">
                      {p.estado_pedido === 'ANUL' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          Anulado
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-400">
                          Confirmado
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {p.estado_pedido === 'FACT' && (
                          <button
                            type="button"
                            onClick={() => openCancelModal(p)}
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            Anular
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CancelarPedidoModal
        pedido={pedidoToCancel}
        open={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false)
          setPedidoToCancel(null)
        }}
        onSuccess={handleCancelSuccess}
        darkMode={darkMode ?? false}
      />
    </div>
  )
}
