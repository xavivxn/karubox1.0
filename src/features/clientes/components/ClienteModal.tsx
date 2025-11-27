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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingCliente ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
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
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
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
