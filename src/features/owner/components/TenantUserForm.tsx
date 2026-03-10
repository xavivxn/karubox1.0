import type { CreateTenantForm } from '../hooks/useCreateTenant'

interface TenantUserFormProps {
  form: CreateTenantForm
  onChange: <K extends keyof CreateTenantForm>(field: K, value: CreateTenantForm[K]) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  loading: boolean
  error: string
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 focus:outline-none transition bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50'

export function TenantUserForm({
  form,
  onChange,
  onSubmit,
  onBack,
  loading,
  error,
}: TenantUserFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="nombreAdmin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre del administrador
        </label>
        <input
          id="nombreAdmin"
          type="text"
          value={form.nombreAdmin}
          onChange={(e) => onChange('nombreAdmin', e.target.value)}
          required
          className={inputClass}
          placeholder="Juan Pérez"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="emailAdmin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Correo electrónico
        </label>
        <input
          id="emailAdmin"
          type="email"
          value={form.emailAdmin}
          onChange={(e) => onChange('emailAdmin', e.target.value)}
          required
          autoComplete="off"
          className={inputClass}
          placeholder="admin@negocio.com"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="passwordAdmin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contraseña temporal
        </label>
        <input
          id="passwordAdmin"
          type="password"
          value={form.passwordAdmin}
          onChange={(e) => onChange('passwordAdmin', e.target.value)}
          required
          autoComplete="new-password"
          className={inputClass}
          placeholder="Mínimo 6 caracteres"
          disabled={loading}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          El administrador podrá cambiarla desde su perfil una vez que ingrese.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Volver
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando lomitería...' : 'Crear lomitería y administrador'}
        </button>
      </div>
    </form>
  )
}
