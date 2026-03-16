/**
 * Panel de Clientes - Tabla enriquecida
 * Muestra última visita, días sin visitar, total pedidos y estado visual por segmento
 */

import { Eye, Edit2 } from 'lucide-react'
import type { ClienteConVisita } from '../types/clientes.types'
import { getSegmento } from '../types/clientes.types'
import { formatearFecha } from '../utils/clientes.utils'

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

function diasLabel(dias: number | null): string {
  if (dias === null) return '—'
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  return `Hace ${dias} d`
}

// ── Component ──────────────────────────────────────────────────────────────

export const ClientesTableRich = ({
  clientes,
  loading,
  searchTerm,
  onRowClick,
  onEdit,
}: ClientesTableRichProps) => {
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
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Última visita
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Pedidos
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-gray-400 dark:text-gray-500">
                  {searchTerm
                    ? `No se encontraron clientes para "${searchTerm}"`
                    : 'No hay clientes registrados. Creá el primero.'}
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => {
                const segmento = getSegmento(cliente.dias_sin_visita)
                const badge = SEGMENTO_BADGE[segmento]
                const dot = SEGMENTO_DOT[segmento]

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

      {/* Footer contador */}
      {clientes.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          {searchTerm && ' encontrados'}
        </div>
      )}
    </div>
  )
}
