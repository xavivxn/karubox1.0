import { PreprodBadge } from '@/components/PreprodBadge'
import { LOGIN_STRINGS } from '@/utils/strings'

export function LoginHeader() {
  return (
    <div className="text-center relative z-10">
      <div className="text-5xl sm:text-6xl md:text-6xl mb-3 sm:mb-4 animate-login-float select-none" aria-hidden>
        🍔
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm tracking-tight flex flex-wrap items-center justify-center gap-2">
        {LOGIN_STRINGS.LOGIN_TITLE}
        <PreprodBadge variant="onDark" />
      </h1>
      <p className="text-white/90 text-sm sm:text-base mt-1 sm:mt-2 max-w-[220px] mx-auto">
        {LOGIN_STRINGS.LOGIN_SUBTITLE}
      </p>
    </div>
  );
}
