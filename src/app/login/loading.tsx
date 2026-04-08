import type { ComponentProps } from 'react'
import { LoginBackground } from '@/features/auth/components/LoginBackground'
import { cn } from '@/lib/utils'

function Shimmer({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('animate-pulse rounded-md', className)} {...props} />
  )
}

export default function LoginLoading() {
  return (
    <div
      className={cn(
        'login-screen-safe-x login-screen-safe-pb relative flex w-full flex-col items-stretch justify-start sm:items-center',
        'pt-2 sm:pt-3 md:pt-4',
        'min-h-0 flex-initial pb-2 lg:flex-1 lg:pb-0'
      )}
    >
      <LoginBackground />
      <div
        className={cn(
          'relative z-10 mx-auto mt-1 w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl',
          'max-lg:max-h-none lg:max-h-login-card-shell lg:min-h-0'
        )}
      >
        <div
          className={cn(
            'rounded-2xl border border-orange-300/35 bg-gradient-to-br from-stone-100 via-orange-50/70 to-amber-50/60 sm:rounded-3xl',
            'shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_22px_64px_-18px_rgba(0,0,0,0.28),0_0_48px_-14px_rgba(238,95,15,0.22)]',
            'max-lg:overflow-visible lg:max-h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:scrollbar-none login-card-scroll-lg'
          )}
        >
          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-2">
            {/* Columna marca / valor (misma lectura que LoginForm + LoginValuePanel) */}
            <div
              className={cn(
                'relative min-h-0 border-b border-orange-500/20 bg-gradient-to-b from-zinc-950 via-[#1a0f08] to-zinc-950',
                'p-3 sm:p-3.5 md:p-4 lg:border-b-0 lg:border-r lg:border-orange-500/25'
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-15%,rgba(249,115,22,0.22),transparent_55%)]"
                aria-hidden
              />
              <div className="relative z-10 flex min-h-0 flex-col justify-center">
                <div
                  className={cn(
                    'relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-orange-400/15 sm:rounded-3xl',
                    'shadow-[0_0_0_1px_rgba(251,146,60,0.08),0_20px_60px_-16px_rgba(0,0,0,0.5),0_0_48px_-12px_rgba(234,88,12,0.3)]',
                    'px-5 py-6 sm:gap-5 sm:px-6 sm:py-7 md:px-8'
                  )}
                >
                  <div
                    className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-orange-950/35 via-zinc-950/92 to-zinc-950"
                    aria-hidden
                  />
                  <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
                    <div className="text-center">
                      <Shimmer className="mx-auto mb-3 h-14 w-14 rounded-full bg-orange-100/10 sm:mb-4 sm:h-[4.25rem] sm:w-[4.25rem]" />
                      <Shimmer className="mx-auto h-7 w-36 rounded-lg bg-orange-100/12 sm:h-8 sm:w-44" />
                    </div>
                    <div className="border-t border-orange-400/20 pt-4 sm:pt-5">
                      <Shimmer className="mb-3 h-3 w-40 rounded bg-amber-200/15 sm:h-3.5 sm:w-48" />
                      <Shimmer className="h-5 w-[90%] max-w-sm rounded bg-white/10 sm:h-6" />
                      <Shimmer className="mt-2 h-4 w-full max-w-[280px] rounded bg-orange-100/8 sm:h-5" />
                    </div>
                    <ul className="space-y-2.5 sm:space-y-3">
                      {[1, 2, 3].map((i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Shimmer className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-orange-500/25 sm:h-9 sm:w-9" />
                          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                            <Shimmer className="h-3.5 w-full rounded bg-orange-50/10" />
                            <Shimmer className="h-3.5 w-4/5 rounded bg-orange-50/8" />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Shimmer className="h-10 w-40 self-start rounded-xl bg-orange-500/20 sm:h-11" />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna formulario */}
            <div
              className={cn(
                'relative flex min-h-0 flex-col justify-center overflow-visible px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-7 lg:overflow-hidden lg:p-8',
                'bg-gradient-to-br from-orange-50/95 via-amber-50/45 to-orange-50/25'
              )}
            >
              <div
                className="pointer-events-none absolute -right-1/4 top-0 h-[min(24rem,55%)] w-[min(28rem,90%)] rounded-full bg-orange-500/12 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-amber-400/12 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(234,88,12,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(234,88,12,0.045)_1px,transparent_1px)] bg-[size:40px_40px] opacity-70 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_50%,black,transparent)]"
                aria-hidden
              />
              <div className="relative z-10 flex min-h-0 flex-col justify-center">
                <div className="space-y-4 sm:space-y-5">
                  <Shimmer className="h-11 w-full rounded-xl border border-orange-200/40 bg-white/50 shadow-sm" />
                  <Shimmer className="h-11 w-full rounded-xl border border-orange-200/40 bg-white/50 shadow-sm" />
                  <Shimmer className="mt-1 h-12 w-full rounded-xl bg-gradient-to-r from-orange-500/50 to-amber-500/45 shadow-[0_8px_24px_-8px_rgba(234,88,12,0.45)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
