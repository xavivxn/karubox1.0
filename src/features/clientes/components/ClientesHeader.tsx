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
    <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
          <Users size={20} className="sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
            Gestión de Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base mt-0.5 line-clamp-2 sm:line-clamp-none">
            Administra los clientes de {tenantName}
          </p>
        </div>
      </div>
      <button
        onClick={onNuevoCliente}
        className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-3 sm:px-6 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all font-semibold shadow-sm dark:shadow-black/20 hover:shadow-md dark:hover:shadow-black/30 touch-manipulation"
      >
        <UserPlus size={20} />
        Nuevo Cliente
      </button>
    </header>
  )
}
