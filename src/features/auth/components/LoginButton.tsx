import { cn } from '@/lib/utils'

interface LoginButtonProps {
  loading: boolean
  compact?: boolean
}

export function LoginButton({ loading, compact = false }: LoginButtonProps) {
  return (
    <div className={compact ? 'animate-login-field-3 pt-0.5' : 'animate-login-field-3 pt-1'}>
      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full min-h-11 rounded-xl border border-orange-200/55 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-700 font-semibold text-orange-950 sm:min-h-0',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(124,45,18,0.38),0_8px_28px_-6px_rgba(0,0,0,0.45),0_0_28px_-2px_rgba(249,115,22,0.52)]',
          'transition-all duration-300',
          'hover:border-orange-100/70 hover:from-orange-300 hover:via-orange-400 hover:to-orange-600 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.48),inset_0_-1px_0_rgba(124,45,18,0.3),0_12px_36px_-6px_rgba(0,0,0,0.5),0_0_36px_0_rgba(251,146,60,0.48)]',
          'hover:scale-[1.01] active:scale-[0.99]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/90 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100',
          'disabled:hover:from-orange-400 disabled:hover:via-orange-500 disabled:hover:to-orange-700 disabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(124,45,18,0.38),0_8px_28px_-6px_rgba(0,0,0,0.45),0_0_28px_-2px_rgba(249,115,22,0.52)]',
          'touch-manipulation',
          compact ? 'px-3 py-2 text-sm' : 'px-4 py-3.5'
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className={cn('animate-spin text-orange-950', compact ? 'h-4 w-4' : 'h-5 w-5')}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Iniciando sesión...
          </span>
        ) : (
          'Iniciar sesión'
        )}
      </button>
    </div>
  );
}
