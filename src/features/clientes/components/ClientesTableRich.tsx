/**
 * Panel de Clientes - Tabla enriquecida
 * Muestra última visita, días sin visitar, total pedidos y estado visual por segmento
 */

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, Edit2 } from 'lucide-react'
import type { ClienteConVisita } from '../types/clientes.types'
import { getSegmento } from '../types/clientes.types'
import { formatearFecha, getNivel } from '../utils/clientes.utils'
import { formatGuaranies } from '@/lib/utils/format'

interface ClientesTableRichProps {
  clientes: ClienteConVisita[]
  loading: boolean
  searchTerm: string
  onRowClick: (cliente: ClienteConVisita) => void
  onEdit: (cliente: ClienteConVisita) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SEGMENTO_DOT: Record<string, string> = {
  activo:     'bg-green-500 dark:bg-green-400',
  en_riesgo:  'bg-amber-400 dark:bg-amber-400',
  inactivo:   'bg-red-500 dark:bg-red-400',
  sin_visita: 'bg-gray-300 dark:bg-gray-500',
}

const SEGMENTO_BADGE: Record<string, { label: string; cls: string }> = {
  activo:     { label: 'Activo',     cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  en_riesgo:  { label: 'En riesgo',  cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  inactivo:   { label: 'Inactivo',   cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
  sin_visita: { label: 'Sin visitas',cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
}

const NIVEL_BADGE: Record<string, string> = {
  oro: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  plata: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  bronce: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
}

function diasLabel(dias: number | null): string {
  if (dias === null) return '—'
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  return `Hace ${dias} d`
}

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

// ── Component ──────────────────────────────────────────────────────────────

export const ClientesTableRich = ({
  clientes,
  loading,
  searchTerm,
  onRowClick,
  onEdit,
}: ClientesTableRichProps) => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)

  const total = clientes.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const currentPage = Math.min(page, totalPages)
  const { pageClientes, rangeFrom, rangeTo } = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const slice = clientes.slice(start, start + pageSize)
    const from = total === 0 ? 0 : start + 1
    const to = start + slice.length
    return { pageClientes: slice, rangeFrom: from, rangeTo: to }
  }, [clientes, currentPage, pageSize, total])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 dark:border-orange-400" />
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Cliente
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Teléfono
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Email
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Puntos
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Nivel
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Última visita
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Pedidos
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total en ventas
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
            {total === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-14 text-center text-gray-400 dark:text-gray-500">
                  {searchTerm
                    ? `No se encontraron clientes para "${searchTerm}"`
                    : 'No hay clientes registrados. Creá el primero.'}
                </td>
              </tr>
            ) : (
              pageClientes.map((cliente) => {
                const segmento = getSegmento(cliente.dias_sin_visita)
                const badge = SEGMENTO_BADGE[segmento]
                const dot = SEGMENTO_DOT[segmento]
                const nivelInfo = getNivel(cliente.total_gastado ?? 0)
                const nivelBadgeCls = NIVEL_BADGE[nivelInfo.nivel] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'

                return (
                  <tr
                    key={cliente.id}
                    className="hover:bg-orange-50/40 dark:hover:bg-orange-900/20 transition-colors cursor-pointer"
                    onClick={() => onRowClick(cliente)}
                  >
                    {/* Nombre + dot de segmento */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${dot}`}
                          title={badge.label}
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{cliente.nombre}</p>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                      {cliente.telefono || <span className="text-gray-300 dark:text-gray-500">—</span>}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 max-w-[180px] truncate">
                      {cliente.email || <span className="text-gray-300 dark:text-gray-500">—</span>}
                    </td>

                    {/* Puntos */}
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200">
                        ⭐ {cliente.puntos_totales.toLocaleString()}
                      </span>
                    </td>

                    {/* Nivel VIP */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${nivelBadgeCls}`}>
                        {nivelInfo.nombre}
                      </span>
                    </td>

                    {/* Última visita */}
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-gray-700 dark:text-gray-300 text-xs">
                          {cliente.ultima_visita
                            ? formatearFecha(cliente.ultima_visita)
                            : <span className="text-gray-400 dark:text-gray-500">Sin visitas</span>}
                        </p>
                        <p className={`text-xs font-semibold mt-0.5 ${
                          segmento === 'activo' ? 'text-green-600 dark:text-green-400' :
                          segmento === 'en_riesgo' ? 'text-amber-600 dark:text-amber-400' :
                          segmento === 'inactivo' ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {diasLabel(cliente.dias_sin_visita)}
                        </p>
                      </div>
                    </td>

                    {/* Total pedidos */}
                    <td className="px-5 py-3.5 text-center text-gray-600 dark:text-gray-400 font-medium">
                      {cliente.total_pedidos}
                    </td>

                    {/* Total en ventas */}
                    <td className="px-5 py-3.5 text-right text-gray-700 dark:text-gray-300 font-medium tabular-nums">
                      {formatGuaranies(cliente.total_gastado ?? 0)}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-3.5">
                      <div
                        className="flex items-center justify-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onRowClick(cliente)}
                          className="p-2 rounded-lg transition-colors text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-700 dark:hover:text-orange-300"
                          title="Ver detalle"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          onClick={() => onEdit(cliente)}
                          className="p-2 rounded-lg transition-colors text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300"
                          title="Editar"
                        >
                          <Edit2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación + contador */}
      {total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 order-2 sm:order-1">
            Mostrando{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {rangeFrom}–{rangeTo}
            </span>{' '}
            de{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">{total}</span>
            {total !== 1 ? ' clientes' : ' cliente'}
            {searchTerm ? ' encontrados' : ''}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 order-1 sm:order-2 justify-between sm:justify-end w-full sm:w-auto">
            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="whitespace-nowrap">Por página</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
                  setPage(1)
                }}
                className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium py-1.5 pl-2 pr-7 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[5.5rem] text-center text-xs font-medium text-gray-600 dark:text-gray-300 tabular-nums px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
