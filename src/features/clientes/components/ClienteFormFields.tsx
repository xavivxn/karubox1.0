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

  const inputClass =
    'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors'
  const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'

  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div>
        <label className={labelClass}>
          Nombre completo <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Juan Pérez"
          className={inputClass}
          required
        />
      </div>

      {/* CI */}
      <div>
        <label className={labelClass}>Cédula de Identidad (CI)</label>
        <input
          type="text"
          value={formData.ci}
          onChange={(e) => handleChange('ci', e.target.value)}
          placeholder="1234567"
          className={inputClass}
        />
      </div>

      {/* RUC */}
      <div>
        <label className={labelClass}>RUC (opcional)</label>
        <input
          type="text"
          value={formData.ruc}
          onChange={(e) => handleChange('ruc', e.target.value)}
          placeholder="80012345-6"
          className={inputClass}
        />
      </div>

      {/* Pasaporte (extranjeros) */}
      <div>
        <label className={labelClass}>Pasaporte (extranjeros, opcional)</label>
        <input
          type="text"
          value={formData.pasaporte}
          onChange={(e) => handleChange('pasaporte', e.target.value)}
          placeholder="AB123456"
          className={inputClass}
        />
      </div>

      {/* Teléfono */}
      <div>
        <label className={labelClass}>
          Teléfono <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          type="tel"
          value={formData.telefono}
          onChange={(e) => handleChange('telefono', e.target.value)}
          placeholder="(0981) 123-456"
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label className={labelClass}>Email (opcional)</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="cliente@email.com"
          className={inputClass}
        />
      </div>

      {/* Dirección */}
      <div>
        <label className={labelClass}>Dirección (opcional)</label>
        <textarea
          value={formData.direccion}
          onChange={(e) => handleChange('direccion', e.target.value)}
          placeholder="Av. Principal 123"
          rows={2}
          className={inputClass}
        />
      </div>
    </div>
  )
}
