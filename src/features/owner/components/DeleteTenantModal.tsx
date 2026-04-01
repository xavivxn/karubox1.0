'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { deleteTenantOwner } from '@/app/actions/owner'

interface DeleteTenantModalProps {
  open: boolean
  tenant: { id: string; nombre: string }
  onClose: () => void
  onSuccess: () => void
}

export function DeleteTenantModal({ open, tenant, onClose, onSuccess }: DeleteTenantModalProps) {
  const [tenantNameConfirmation, setTenantNameConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleClose = () => {
    if (deleting) return
    setTenantNameConfirmation('')
    setError(null)
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const result = await deleteTenantOwner(tenant.id)
    setDeleting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setTenantNameConfirmation('')
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Eliminar lomitería permanentemente</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-2">
            Se eliminarán TODOS los datos de &quot;{tenant.nombre}&quot;:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
            <li>Todos los productos y categorías</li>
            <li>Todo el inventario y materias primas</li>
            <li>Todos los pedidos y clientes</li>
            <li>Todos los usuarios (cajeros y administradores)</li>
            <li>Todas las transacciones y puntos de lealtad</li>
            <li>Todas las promociones y configuraciones</li>
            <li>Las cuentas de autenticación de todos los usuarios</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Para confirmar, escribe: <span className="font-bold text-red-600 dark:text-red-400">{tenant.nombre}</span>
          </label>
          <input
            type="text"
            value={tenantNameConfirmation}
            onChange={(e) => setTenantNameConfirmation(e.target.value)}
            placeholder="Nombre del local"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
            disabled={deleting}
            autoComplete="off"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || tenantNameConfirmation !== tenant.nombre}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar permanentemente'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
