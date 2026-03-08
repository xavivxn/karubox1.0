'use client'

import Link from 'next/link'
import { useCreateTenant } from '../hooks/useCreateTenant'
import { TenantForm } from '../components/TenantForm'
import { TenantUserForm } from '../components/TenantUserForm'

const STEPS = [
  { label: 'Datos del negocio', key: 'tenant' },
  { label: 'Administrador', key: 'user' },
  { label: 'Listo', key: 'done' },
] as const

export function CreateTenantView() {
  const {
    form,
    setField,
    loading,
    error,
    step,
    createdTenantNombre,
    adminEmail,
    handleCreateTenant,
    handleCreateUser,
    reset,
  } = useCreateTenant()

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="max-w-xl mx-auto">
      {/* Breadcrumb de pasos */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition ${
                i < stepIndex
                  ? 'bg-green-500 text-white'
                  : i === stepIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {i < stepIndex ? '✓' : i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                i === stepIndex ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${i < stepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {step === 'tenant' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Datos de la lomitería</h2>
            <p className="text-sm text-gray-500 mb-6">
              Ingresá el nombre y RUC del nuevo negocio.
            </p>
            <TenantForm
              form={form}
              onChange={setField}
              onSubmit={handleCreateTenant}
              loading={loading}
              error={error}
            />
          </>
        )}

        {step === 'user' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Administrador del local</h2>
            <p className="text-sm text-gray-500 mb-6">
              Creá la cuenta del administrador que gestionará este negocio.
            </p>
            <TenantUserForm
              form={form}
              tenantNombre={createdTenantNombre}
              onChange={setField}
              onSubmit={handleCreateUser}
              loading={loading}
              error={error}
            />
          </>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-900">
              ¡{createdTenantNombre} está lista!
            </h2>
            <p className="text-gray-600 text-sm">
              La lomitería fue creada y el administrador puede iniciar sesión con:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-left space-y-1 font-mono">
              <p>
                <span className="text-gray-400">Email:</span>{' '}
                <span className="text-gray-900 font-semibold">{adminEmail}</span>
              </p>
              <p>
                <span className="text-gray-400">Contraseña:</span>{' '}
                <span className="text-gray-500 italic">la que ingresaste</span>
              </p>
            </div>

            <p className="text-xs text-gray-400">
              Anotá las credenciales antes de salir. No se vuelven a mostrar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={reset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                + Crear otra lomitería
              </button>
              <Link
                href="/owner"
                className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition text-sm"
              >
                Volver al panel
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
