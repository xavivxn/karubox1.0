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
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none transition-all duration-200 text-gray-900 placeholder:text-gray-400"
          placeholder="••••••••"
          disabled={disabled}
        />
      </div>
    </>
  );
}
