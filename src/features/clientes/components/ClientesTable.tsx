/**
 * Clientes Module - Table Component
 * Tabla de clientes con acciones
 */

import Link from 'next/link'
import { Edit2 } from 'lucide-react'
import type { ClienteLocal } from '../types/clientes.types'
import { formatearFecha } from '../utils/clientes.utils'

interface ClientesTableProps {
  clientes: ClienteLocal[]
  loading: boolean
  searchTerm: string
  onEdit: (cliente: ClienteLocal) => void
}

export const ClientesTable = ({
  clientes,
  loading,
  searchTerm,
  onEdit
}: ClientesTableProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                CI
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Teléfono
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Puntos
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Registrado
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm
                    ? 'No se encontraron clientes'
                    : 'No hay clientes registrados. Crea el primero.'}
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {cliente.nombre}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {cliente.ci || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {cliente.telefono || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {cliente.email || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                      ⭐ {cliente.puntos_totales}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {formatearFecha(cliente.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(cliente)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <Link
                        href={`/admin/clientes/${cliente.id}/puntos`}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          Total: {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
