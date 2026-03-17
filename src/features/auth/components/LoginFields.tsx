'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface LoginFieldsProps {
  email: string
  password: string
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  disabled?: boolean
}

export function LoginFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  disabled = false
}: LoginFieldsProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <>
      <div className="animate-login-field-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
          className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none transition-all duration-200 text-gray-900 placeholder:text-gray-400"
          placeholder="tu@email.com"
          disabled={disabled}
        />
      </div>

      <div className="animate-login-field-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
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
            className="w-full px-4 py-3 pr-12 rounded-xl border border-orange-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none transition-all duration-200 text-gray-900 placeholder:text-gray-400"
            placeholder="••••••••"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-0 transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" aria-hidden />
            ) : (
              <Eye className="w-5 h-5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
