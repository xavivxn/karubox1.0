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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-black/30 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingCliente ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={saving}
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <ClienteFormFields formData={formData} onChange={onFormChange} />

          {/* Botones */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
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
  )
}
