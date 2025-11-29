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
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
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
          className="w-full px-4 py-3 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition text-gray-900 placeholder:text-gray-400"
          placeholder="tu@email.com"
          disabled={disabled}
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
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
          className="w-full px-4 py-3 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition text-gray-900 placeholder:text-gray-400"
          placeholder="••••••••"
          disabled={disabled}
        />
      </div>
    </>
  );
}
