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
  activo:     'bg-green-500',
  en_riesgo:  'bg-amber-400',
  inactivo:   'bg-red-500',
  sin_visita: 'bg-gray-300',
}

const SEGMENTO_BADGE: Record<string, { label: string; cls: string }> = {
  activo:     { label: 'Activo',     cls: 'bg-green-100 text-green-700' },
  en_riesgo:  { label: 'En riesgo',  cls: 'bg-amber-100 text-amber-700' },
  inactivo:   { label: 'Inactivo',   cls: 'bg-red-100 text-red-700' },
  sin_visita: { label: 'Sin visitas',cls: 'bg-gray-100 text-gray-500' },
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        <p className="mt-3 text-gray-500 text-sm">Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Cliente
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Teléfono
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Puntos
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Última visita
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Pedidos
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-gray-400">
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
                    className="hover:bg-orange-50/40 transition-colors cursor-pointer"
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
                          <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Teléfono */}
                    <td className="px-5 py-3.5 text-gray-600">
                      {cliente.telefono || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">
                      {cliente.email || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Puntos */}
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                        ⭐ {cliente.puntos_totales.toLocaleString()}
                      </span>
                    </td>

                    {/* Última visita */}
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-gray-700 text-xs">
                          {cliente.ultima_visita
                            ? formatearFecha(cliente.ultima_visita)
                            : <span className="text-gray-400">Sin visitas</span>}
                        </p>
                        <p className={`text-xs font-semibold mt-0.5 ${
                          segmento === 'activo' ? 'text-green-600' :
                          segmento === 'en_riesgo' ? 'text-amber-600' :
                          segmento === 'inactivo' ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {diasLabel(cliente.dias_sin_visita)}
                        </p>
                      </div>
                    </td>

                    {/* Total pedidos */}
                    <td className="px-5 py-3.5 text-center text-gray-600 font-medium">
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
                          className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          onClick={() => onEdit(cliente)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
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
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          {searchTerm && ' encontrados'}
        </div>
      )}
    </div>
  )
}
