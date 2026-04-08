'use client'

import { useAuth } from '../hooks/useAuth'
import { LoginBackground } from '../components/LoginBackground'
import { LoginValuePanel } from '../components/LoginValuePanel'
import { ErrorAlert } from '../components/ErrorAlert'
import { LoginFields } from '../components/LoginFields'
import { LoginButton } from '../components/LoginButton'
import { cn } from '@/lib/utils'
import {
  loginColumnNeonInset,
  loginNeonGridAmber,
  loginNeonGridDeepAmber,
  loginNeonGridMask,
} from '../constants/loginAccent'

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
    <div
      className={cn(
        'login-screen-safe-x login-screen-safe-pb relative flex w-full flex-col items-stretch justify-start sm:items-center',
        'pt-2 sm:pt-3 md:pt-4',
        /* Móvil/tablet: altura según contenido → el scroll lo hace <main> (AppFrame). Desktop: ocupa el panel. */
        'min-h-0 flex-initial pb-2 lg:flex-1 lg:pb-0'
      )}
    >
      <LoginBackground />
      <div
        className={cn(
          'relative z-10 mx-auto mt-1 w-full max-w-md animate-login-card sm:max-w-lg md:max-w-2xl lg:max-w-4xl',
          'max-lg:max-h-none lg:max-h-login-card-shell lg:min-h-0'
        )}
      >
        {/* Halo ámbar muy contenido: casi pegado al borde del card */}
        <div
          className={cn(
            'pointer-events-none absolute -inset-px -z-10 rounded-2xl sm:rounded-3xl',
            'bg-[radial-gradient(ellipse_62%_48%_at_50%_0%,rgba(251,191,36,0.22),rgba(180,83,9,0.1)_52%,transparent_68%)]',
            'shadow-[0_0_10px_0_rgba(251,191,36,0.4),0_0_18px_-2px_rgba(245,158,11,0.32),0_0_26px_-4px_rgba(217,119,6,0.22)]',
            'ring-1 ring-amber-600/30 ring-offset-0'
          )}
          aria-hidden
        />
        <div
          className={cn(
            'relative z-10 rounded-2xl border border-amber-500/28 bg-zinc-950/95 backdrop-blur-sm sm:rounded-3xl',
            'shadow-[inset_0_0_0_1px_rgba(251,191,36,0.12),0_28px_90px_-24px_rgba(0,0,0,0.65),0_0_0_1px_rgba(146,64,14,0.22),0_0_16px_-4px_rgba(245,158,11,0.26),0_0_24px_-8px_rgba(217,119,6,0.16)]',
            /* Solo en desktop: scroll dentro del card; en móvil el flujo es natural */
            'max-lg:overflow-visible lg:max-h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:scrollbar-none login-card-scroll-lg'
          )}
        >
          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-2">
            {/* Móvil: marca arriba · Desktop: columna izquierda (misma lectura que la landing Precio) */}
            <div
              className={cn(
                'relative min-h-0 border-b border-orange-500/22 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950',
                'p-3 sm:p-3.5 md:p-4 animate-login-panel lg:border-b-0 lg:border-r lg:border-orange-400/25',
                loginColumnNeonInset
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-15%,rgba(251,191,36,0.14),rgba(180,83,9,0.06)_45%,transparent_58%)]"
                aria-hidden
              />
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 z-[1]',
                  loginNeonGridDeepAmber,
                  loginNeonGridMask
                )}
                aria-hidden
              />
              <LoginValuePanel />
            </div>

            <div
              className={cn(
                'relative flex min-h-0 flex-col justify-center overflow-hidden px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7 lg:overflow-hidden lg:p-8 animate-login-form',
                'border-b border-orange-500/20 lg:border-b-0',
                'bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950',
                loginColumnNeonInset
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,transparent_42%)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-1/4 top-0 z-[1] h-[min(24rem,55%)] w-[min(28rem,90%)] rounded-full bg-amber-600/[0.14] blur-3xl animate-login-warm-glow"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-8 bottom-0 z-[1] h-40 w-40 rounded-full bg-white/[0.04] blur-2xl"
                aria-hidden
              />
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 z-[1]',
                  loginNeonGridAmber,
                  loginNeonGridMask
                )}
                aria-hidden
              />

              <div className="relative z-[2] flex min-h-0 flex-col justify-center">
                <form
                  onSubmit={handleLogin}
                  className="space-y-4 sm:space-y-5"
                >
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
