import type { CreateTenantForm } from '../hooks/useCreateTenant'

interface TenantUserFormProps {
  form: CreateTenantForm
  tenantNombre: string
  onChange: <K extends keyof CreateTenantForm>(field: K, value: CreateTenantForm[K]) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  error: string
}

const inputClass =
  'w-full px-4 py-3 border border-orange-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition text-gray-900 placeholder:text-gray-400 disabled:opacity-50'

export function TenantUserForm({
  form,
  tenantNombre,
  onChange,
  onSubmit,
  loading,
  error,
}: TenantUserFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
        <p className="font-medium">Lomitería creada correctamente</p>
        <p>Ahora creá el usuario administrador para <span className="font-semibold">{tenantNombre}</span>.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="nombreAdmin" className="block text-sm font-medium text-gray-700 mb-1">
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
        <label htmlFor="emailAdmin" className="block text-sm font-medium text-gray-700 mb-1">
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
        <label htmlFor="passwordAdmin" className="block text-sm font-medium text-gray-700 mb-1">
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
        <p className="text-xs text-gray-400 mt-1">
          El administrador podrá cambiarla desde su perfil una vez que ingrese.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creando usuario...' : 'Crear administrador →'}
      </button>
    </form>
  )
}
