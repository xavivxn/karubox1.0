'use client'

import { useAuth } from '../hooks/useAuth'
import { LoginBackground } from '../components/LoginBackground'
import { LoginHeader } from '../components/LoginHeader'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoginFields } from '../components/LoginFields'
import { LoginButton } from '../components/LoginButton'
import { DevCredentials } from '../components/DevCredentials'

export default function LoginForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin
  } = useAuth()

  return (
    <div className="relative min-h-0 flex-1 flex items-center justify-center px-4 py-4 sm:py-6">
      <LoginBackground />
      {/* Card contenedor: responsive y animado */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl animate-login-card">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0">
            {/* Panel izquierdo: marca — en móvil más compacto */}
            <div className="relative bg-gradient-to-br from-orange-700 via-orange-600 to-orange-800 p-6 sm:p-8 md:p-10 lg:p-12 flex items-center justify-center min-h-[180px] sm:min-h-[220px] lg:min-h-0 animate-login-panel">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_40%,rgba(255,255,255,0.14),transparent_60%)] pointer-events-none" aria-hidden />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(0,0,0,0.12),transparent_45%)] pointer-events-none" aria-hidden />
              <LoginHeader />
            </div>

            {/* Panel derecho: formulario */}
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center animate-login-form">
              <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
                <ErrorAlert message={error} />

                <LoginFields
                  email={email}
                  password={password}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  disabled={loading}
                />

                <LoginButton loading={loading} />
              </form>

              <DevCredentials />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
