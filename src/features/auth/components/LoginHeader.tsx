import Image from 'next/image'
import { PreprodBadge } from '@/components/PreprodBadge'
import { LOGO_SISTEMA_2026_PATH } from '@/config/branding'
import { LOGIN_STRINGS } from '@/utils/strings'

export function LoginHeader() {
  return (
    <div className="text-center relative z-10">
      <div
        className="relative mx-auto mb-3 sm:mb-4 h-[5.5rem] w-[5.5rem] sm:h-[6.5rem] sm:w-[6.5rem] animate-login-float"
        aria-hidden
      >
        <Image
          src={LOGO_SISTEMA_2026_PATH}
          alt=""
          fill
          className="object-contain drop-shadow-md"
          sizes="(max-width: 640px) 5.5rem, 6.5rem"
          priority
        />
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
