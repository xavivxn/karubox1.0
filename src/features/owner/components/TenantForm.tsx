import type { CreateTenantForm } from '../hooks/useCreateTenant'

interface TenantFormProps {
  form: CreateTenantForm
  onChange: <K extends keyof CreateTenantForm>(field: K, value: CreateTenantForm[K]) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  error: string
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 focus:outline-none transition bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50'

export function TenantForm({ form, onChange, onSubmit, loading, error }: TenantFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="nombreNegocio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre de la lomitería / restaurante
        </label>
        <input
          id="nombreNegocio"
          type="text"
          value={form.nombreNegocio}
          onChange={(e) => onChange('nombreNegocio', e.target.value)}
          required
          className={inputClass}
          placeholder="Ej: AtlasBurger"
          disabled={loading}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Se generará automáticamente un identificador único (slug) a partir del nombre.
        </p>
      </div>

      <div>
        <label htmlFor="ruc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          RUC <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
        </label>
        <input
          id="ruc"
          type="text"
          value={form.ruc}
          onChange={(e) => onChange('ruc', e.target.value)}
          className={inputClass}
          placeholder="80012345-6"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creando lomitería...' : 'Siguiente →'}
      </button>
    </form>
  )
}
