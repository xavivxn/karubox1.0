import { LOGIN_STRINGS } from '@/utils/strings';

export function LoginHeader() {
  return (
    <div className="text-center mb-8">
      <div className="text-6xl mb-4">🍔</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {LOGIN_STRINGS.LOGIN_TITLE}
      </h1>
      <p className="text-white/70">
        {LOGIN_STRINGS.LOGIN_SUBTITLE}
      </p>
    </div>
  )
}
