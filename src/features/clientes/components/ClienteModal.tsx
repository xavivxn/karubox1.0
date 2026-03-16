/**
 * Clientes Module - Modal Component
 * Modal para crear/editar cliente
 */

import { X, Check, Loader2 } from 'lucide-react'
import type { ClienteFormData, ClienteLocal } from '../types/clientes.types'
import { ClienteFormFields } from './ClienteFormFields'

interface ClienteModalProps {
  showModal: boolean
  editingCliente: ClienteLocal | null
  formData: ClienteFormData
  saving: boolean
  onClose: () => void
  onSave: () => Promise<void>
  onFormChange: (data: ClienteFormData) => void
}

export const ClienteModal = ({
  showModal,
  editingCliente,
  formData,
  saving,
  onClose,
  onSave,
  onFormChange
}: ClienteModalProps) => {
  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Overlay a pantalla completa (safe-area no aquí para que tape todo) */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[90dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/30 sm:max-h-[85vh] sm:max-w-md sm:rounded-xl"
        style={{
          marginLeft: 'env(safe-area-inset-left)',
          marginRight: 'env(safe-area-inset-right)',
          marginBottom: 'env(safe-area-inset-bottom)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cliente-modal-title"
      >
        {/* Contenedor con scroll interno (Safari: overflow en el contenido, no en el card) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-4 sm:mb-6 sm:pb-0">
              <h2
                id="cliente-modal-title"
                className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl"
              >
                {editingCliente ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <ClienteFormFields formData={formData} onChange={onFormChange} />

            {/* Botones: apilados en móvil, en fila en desktop */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="min-h-[44px] flex-1 rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-700 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 sm:py-2.5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="min-h-[44px] flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 sm:py-2.5 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    {editingCliente ? 'Actualizar' : 'Crear'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
