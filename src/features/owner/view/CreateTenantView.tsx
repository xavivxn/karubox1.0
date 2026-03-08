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
    handleNextStep,
    handleBack,
    handleSubmitAll,
    reset,
  } = useCreateTenant()

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="max-w-xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-300 ${
                  i < stepIndex
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : i === stepIndex
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-100 dark:ring-blue-900/50'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  i < stepIndex
                    ? 'text-green-600 dark:text-green-400'
                    : i === stepIndex
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-3 rounded-full transition-colors duration-300 ${
                  i < stepIndex ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card principal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {step === 'tenant' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Datos de la lomitería
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Ingresá el nombre y RUC del nuevo negocio.
            </p>
            <TenantForm
              form={form}
              onChange={setField}
              onSubmit={handleNextStep}
              loading={false}
              error={error}
            />
          </>
        )}

        {step === 'user' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              Administrador del local
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Creá la cuenta del administrador que gestionará este negocio.
            </p>
            <TenantUserForm
              form={form}
              onChange={setField}
              onSubmit={handleSubmitAll}
              onBack={handleBack}
              loading={loading}
              error={error}
            />
          </>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ¡{createdTenantNombre} está lista!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              La lomitería fue creada y el administrador puede iniciar sesión con:
            </p>

            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm text-left space-y-1 font-mono">
              <p>
                <span className="text-gray-400 dark:text-gray-500">Email:</span>{' '}
                <span className="text-gray-900 dark:text-gray-100 font-semibold">{adminEmail}</span>
              </p>
              <p>
                <span className="text-gray-400 dark:text-gray-500">Contraseña:</span>{' '}
                <span className="text-gray-500 dark:text-gray-400 italic">la que ingresaste</span>
              </p>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
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
                className="flex-1 text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 rounded-lg transition text-sm"
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
