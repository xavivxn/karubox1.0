/**
 * Clientes Module - Table Component
 * Tabla de clientes con acciones y exportación a PDF
 */

import Link from 'next/link'
import { Edit2, FileDown } from 'lucide-react'
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
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Barra de acciones: exportar PDF */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
        <button
          type="button"
          onClick={handleDescargarPdf}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          title="Descargar reporte en PDF"
        >
          <FileDown size={18} />
          Descargar PDF
        </button>
      </div>
      <div className="overflow-x-auto">
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

      {/* Contador */}
      {clientes.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
          Total: {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
