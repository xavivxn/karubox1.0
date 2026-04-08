'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoginFieldsProps {
  email: string
  password: string
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  disabled?: boolean
  compact?: boolean
}

const labelClass = 'block font-medium text-zinc-400'
const inputClass = cn(
  'w-full rounded-xl border border-white/[0.1] bg-zinc-950/50 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all duration-200',
  'placeholder:text-zinc-500',
  'focus:border-orange-400/40 focus:bg-zinc-900/40 focus:ring-2 focus:ring-orange-500/20 focus:shadow-[0_0_0_1px_hsl(var(--primary)_/_0.18)]'
)

export function LoginFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  disabled = false,
  compact = false,
}: LoginFieldsProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <>
      <div className="animate-login-field-1">
        <label
          htmlFor="email"
          className={cn(labelClass, compact ? 'mb-1 text-xs' : 'mb-1.5 text-sm')}
        >
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          autoComplete="email"
          className={cn(
            inputClass,
            compact
              ? 'min-h-10 px-3 py-2 text-base sm:min-h-0 sm:text-sm'
              : 'min-h-11 px-4 py-3 text-base sm:min-h-0'
          )}
          placeholder="tu@email.com"
          disabled={disabled}
        />
      </div>

      <div className="animate-login-field-2">
        <label
          htmlFor="password"
          className={cn(labelClass, compact ? 'mb-1 text-xs' : 'mb-1.5 text-sm')}
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            autoComplete="current-password"
            className={cn(
              inputClass,
              'pr-12',
              compact
                ? 'min-h-10 px-3 py-2 pr-11 text-base sm:min-h-0 sm:text-sm'
                : 'min-h-11 px-4 py-3 pr-12 text-base sm:min-h-0'
            )}
            placeholder="••••••••"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            className={cn(
              'absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-orange-500/10 hover:text-orange-100/90 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:ring-offset-0',
              compact
                ? 'right-1.5 h-10 w-10 p-0 sm:right-2 sm:h-auto sm:w-auto sm:p-1'
                : 'right-2 h-11 w-11 p-0 sm:right-3 sm:h-auto sm:w-auto sm:p-1.5'
            )}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden />
            ) : (
              <Eye className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
