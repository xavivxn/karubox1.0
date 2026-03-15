/**
 * Clientes Module - Header Component
 * Encabezado con título y botón de nuevo cliente
 */

import { UserPlus, Users } from 'lucide-react'

interface ClientesHeaderProps {
  tenantName: string
  onNuevoCliente: () => void
}

export const ClientesHeader = ({ tenantName, onNuevoCliente }: ClientesHeaderProps) => {
  return (
    <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Gestión de Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-0.5">
            Administra los clientes de {tenantName}
          </p>
        </div>
      </div>
      <button
        onClick={onNuevoCliente}
        className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold shadow-sm dark:shadow-black/20 hover:shadow-md dark:hover:shadow-black/30"
      >
        <UserPlus size={20} />
        Nuevo Cliente
      </button>
    </header>
  )
}
