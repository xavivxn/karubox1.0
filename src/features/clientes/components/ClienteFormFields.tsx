/**
 * Clientes Module - Form Fields Component
 * Campos del formulario de cliente
 */

import type { ClienteFormData } from '../types/clientes.types'

interface ClienteFormFieldsProps {
  formData: ClienteFormData
  onChange: (data: ClienteFormData) => void
}

export const ClienteFormFields = ({ formData, onChange }: ClienteFormFieldsProps) => {
  const handleChange = (field: keyof ClienteFormData, value: string) => {
    onChange({ ...formData, [field]: value })
  }

  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nombre completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Juan Pérez"
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          required
        />
      </div>

      {/* CI */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Cédula de Identidad (CI)
        </label>
        <input
          type="text"
          value={formData.ci}
          onChange={(e) => handleChange('ci', e.target.value)}
          placeholder="1234567"
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* RUC */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          RUC (opcional)
        </label>
        <input
          type="text"
          value={formData.ruc}
          onChange={(e) => handleChange('ruc', e.target.value)}
          placeholder="80012345-6"
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Pasaporte (extranjeros) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pasaporte (extranjeros, opcional)
        </label>
        <input
          type="text"
          value={formData.pasaporte}
          onChange={(e) => handleChange('pasaporte', e.target.value)}
          placeholder="AB123456"
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Teléfono <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.telefono}
          onChange={(e) => handleChange('telefono', e.target.value)}
          placeholder="(0981) 123-456"
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email (opcional)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="cliente@email.com"
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Dirección (opcional)
        </label>
        <textarea
          value={formData.direccion}
          onChange={(e) => handleChange('direccion', e.target.value)}
          placeholder="Av. Principal 123"
          rows={2}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  )
}
