import Image from 'next/image'
import { PreprodBadge } from '@/components/PreprodBadge'
import { LOGO_SISTEMA_2026_PATH } from '@/config/branding'
import { LOGIN_STRINGS } from '@/utils/strings'
import { cn } from '@/lib/utils'

type LoginHeaderProps = {
  /** Caja de login baja: logo y tipografía más chicos */
  compact?: boolean
  /** Equilibrio entre legibilidad y altura (recomendado en login de dos columnas) */
  comfortable?: boolean
}

export function LoginHeader({
  compact = false,
  comfortable = false,
}: LoginHeaderProps) {
  const size = compact ? 'sm' : comfortable ? 'md' : 'lg'

  return (
    <div className="relative z-10 text-center">
      <div
        className={cn(
          'relative mx-auto animate-login-float',
          size === 'sm' && 'mb-1.5 h-10 w-10 sm:mb-2 sm:h-11 sm:w-11',
          size === 'md' &&
            'mb-2 h-14 w-14 sm:mb-3 sm:h-[4.25rem] sm:w-[4.25rem]',
          size === 'lg' &&
            'mb-3 h-[5.5rem] w-[5.5rem] sm:mb-4 sm:h-[6.5rem] sm:w-[6.5rem]'
        )}
        aria-hidden
      >
        <Image
          src={LOGO_SISTEMA_2026_PATH}
          alt=""
          fill
          className="object-contain drop-shadow-md"
          sizes={
            size === 'sm'
              ? '(max-width: 640px) 2.5rem, 2.75rem'
              : size === 'md'
                ? '(max-width: 640px) 3.5rem, 4.25rem'
                : '(max-width: 640px) 5.5rem, 6.5rem'
          }
          priority
        />
      </div>
      <h1
        className={cn(
          'flex flex-wrap items-center justify-center font-bold tracking-tight text-white drop-shadow-sm',
          size === 'sm' && 'gap-1.5 text-base sm:gap-2 sm:text-lg',
          size === 'md' && 'gap-2 text-xl sm:text-2xl',
          size === 'lg' && 'gap-1.5 text-2xl sm:gap-2 sm:text-3xl'
        )}
      >
        {LOGIN_STRINGS.LOGIN_TITLE}
        <PreprodBadge variant="onDark" />
      </h1>
    </div>
  )
}
