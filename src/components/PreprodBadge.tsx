'use client'

import { isPreprod } from '@/lib/env/supabase'

const base =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide'

const styles = {
  default:
    'border border-amber-400/50 bg-amber-400/15 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300',
  /** Sobre fondos oscuros (p. ej. login). */
  onDark: 'border border-white/35 bg-white/10 text-amber-100',
} as const

/** Indicador visible solo cuando `NEXT_PUBLIC_SUPABASE_TARGET=preprod`. */
export function PreprodBadge({
  variant = 'default',
  className = '',
}: {
  variant?: keyof typeof styles
  className?: string
}) {
  if (!isPreprod()) return null
  return (
    <span
      className={`${base} ${styles[variant]} ${className}`}
      title="Conectado al proyecto Supabase de preproducción"
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]" aria-hidden />
      PREPROD
    </span>
  )
}
