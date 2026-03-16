/**
 * Clientes Module - Table Component
 * Tabla de clientes (desktop) / Cards (mobile) con acciones y exportación a PDF
 */

import Link from 'next/link'
import { Edit2, FileDown, Phone, Mail, Hash } from 'lucide-react'
import type { ClienteLocal } from '../types/clientes.types'
import { formatearFecha } from '../utils/clientes.utils'
import { generarPdfClientes } from '../utils/generarPdfClientes'

interface ClientesTableProps {
  clientes: ClienteLocal[]
  loading: boolean
  searchTerm: string
  onEdit: (cliente: ClienteLocal) => void
  /** Nombre del negocio para el encabezado del PDF (opcional) */
  tenantNombre?: string
}

export const ClientesTable = ({
  clientes,
  loading,
  searchTerm,
  onEdit,
  tenantNombre,
}: ClientesTableProps) => {
  const handleDescargarPdf = () => {
    generarPdfClientes(clientes, { tenantNombre })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800/80 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Barra de acciones: exportar PDF */}
      <div className="flex items-center justify-end gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
        <button
          type="button"
          onClick={handleDescargarPdf}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-[0.98] transition-all touch-manipulation"
          title="Descargar reporte en PDF"
        >
          <FileDown size={18} />
          Descargar PDF
        </button>
      </div>

      {/* Vista móvil: cards */}
      <div className="md:hidden">
        {clientes.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados. Crea el primero.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-600 min-w-0">
            {clientes.map((cliente) => (
              <li key={cliente.id} className="px-3 sm:px-4 py-4 first:pt-4 min-w-0">
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0">
                      {cliente.nombre}
                    </p>
                    <span className="inline-flex items-center shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200">
                      ⭐ {cliente.puntos_totales}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm text-gray-600 dark:text-gray-400 min-w-0 overflow-hidden">
                    {(cliente.ci || cliente.telefono) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                        {cliente.ci && (
                          <span className="flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                            <Hash size={14} className="shrink-0 text-gray-400" />
                            <span className="truncate">{cliente.ci}</span>
                          </span>
                        )}
                        {cliente.telefono && (
                          <a
                            href={`tel:${cliente.telefono}`}
                            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 min-w-0 max-w-full overflow-hidden"
                          >
                            <Phone size={14} className="shrink-0" />
                            <span className="truncate">{cliente.telefono}</span>
                          </a>
                        )}
                      </div>
                    )}
                    {cliente.email && (
                      <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                        <Mail size={14} className="shrink-0 text-gray-400" />
                        <span className="truncate">{cliente.email}</span>
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Registrado: {formatearFecha(cliente.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 min-w-0">
                    <button
                      onClick={() => onEdit(cliente)}
                      className="flex items-center justify-center gap-1.5 flex-1 min-h-[44px] py-2.5 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-[0.98] transition-all touch-manipulation"
                    >
                      <Edit2 size={18} />
                      Editar
                    </button>
                    <Link
                      href={`/admin/clientes/${cliente.id}/puntos`}
                      className="flex items-center justify-center gap-1.5 flex-1 min-h-[44px] py-2.5 rounded-xl text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 active:scale-[0.98] transition-all touch-manipulation"
                    >
                      ⭐ Puntos
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {clientes.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
            Total: {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                CI
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Teléfono
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Puntos
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Registrado
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? 'No se encontraron clientes'
                    : 'No hay clientes registrados. Crea el primero.'}
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {cliente.nombre}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {cliente.ci || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {cliente.telefono || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {cliente.email || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200">
                      ⭐ {cliente.puntos_totales}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                    {formatearFecha(cliente.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(cliente)}
                        className="p-2 rounded-lg transition-colors text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <Link
                        href={`/admin/clientes/${cliente.id}/puntos`}
                        className="p-2 rounded-lg transition-colors text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-purple-300"
                        title="Ver puntos"
                      >
                        ⭐
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Contador (solo desktop; en móvil va dentro de la vista cards) */}
      {clientes.length > 0 && (
        <div className="hidden md:block px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
          Total: {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
