/**
 * Clientes Module - Header Component
 * Encabezado con título y botón de nuevo cliente
 */

import Link from 'next/link'
import { UserPlus } from 'lucide-react'

interface ClientesHeaderProps {
  tenantName: string
  onNuevoCliente: () => void
}

export const ClientesHeader = ({ tenantName, onNuevoCliente }: ClientesHeaderProps) => {
  return (
    <div className="mb-6">
      <Link 
        href="/home/admin"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Volver al Panel de Administración
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👥 Gestión de Clientes
          </h1>
          <p className="text-gray-600">
            Administra los clientes de {tenantName}
          </p>
        </div>
        <button
          onClick={onNuevoCliente}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <UserPlus size={20} />
          Nuevo Cliente
        </button>
      </div>
    </div>
  )
}
