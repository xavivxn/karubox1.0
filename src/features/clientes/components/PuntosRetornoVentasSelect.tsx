'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Sparkles, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/contexts/TenantContext'
import { normalizePuntosRetornoPct, type PuntosRetornoPct } from '@/features/pos/utils/pos.utils'

const OPCIONES: PuntosRetornoPct[] = [1, 5, 10]

/**
 * Selector compacto de % de retorno en puntos + modal de confirmación al cambiar.
 * Responsive (móvil / tablet) y márgenes safe-area tipo iPhone.
 */
export function PuntosRetornoVentasSelect({ className = '' }: { className?: string }) {
  const { tenant, isAdmin, reloadTenant } = useTenant()
  const [savingPct, setSavingPct] = useState(false)
  const [pctError, setPctError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingPct, setPendingPct] = useState<PuntosRetornoPct | null>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  const currentPct = normalizePuntosRetornoPct(tenant?.puntos_retorno_pct)

  const aplicarPct = useCallback(
    async (v: PuntosRetornoPct): Promise<boolean> => {
      if (!tenant?.id || !isAdmin) return false
      if (v === normalizePuntosRetornoPct(tenant.puntos_retorno_pct)) return true
      setPctError(null)
      setSavingPct(true)
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('tenants')
          .update({ puntos_retorno_pct: v, updated_at: new Date().toISOString() })
          .eq('id', tenant.id)
        if (error) throw error
        await reloadTenant()
        return true
      } catch {
        setPctError('No se pudo guardar.')
        return false
      } finally {
        setSavingPct(false)
      }
    },
    [tenant, isAdmin, reloadTenant]
  )

  const closeConfirm = useCallback(() => {
    if (savingPct) return
    setConfirmOpen(false)
    setPendingPct(null)
  }, [savingPct])

  const openConfirm = (v: PuntosRetornoPct) => {
    if (v === currentPct || savingPct) return
    setPendingPct(v)
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    if (pendingPct == null) return
    const ok = await aplicarPct(pendingPct)
    if (ok) {
      setConfirmOpen(false)
      setPendingPct(null)
    }
  }

  useEffect(() => {
    if (!confirmOpen) return
    confirmBtnRef.current?.focus()
  }, [confirmOpen])

  useEffect(() => {
    if (!confirmOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingPct) closeConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmOpen, savingPct, closeConfirm])

  if (!isAdmin || !tenant) return null

  const modal =
    confirmOpen &&
    pendingPct != null &&
    typeof document !== 'undefined' &&
    createPortal(
      <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          className="absolute inset-0 bg-black/50 dark:bg-black/70"
          aria-hidden
          onClick={closeConfirm}
        />
        <div
          className="relative flex max-h-[90dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/30 sm:max-h-[85vh] sm:max-w-md sm:rounded-xl"
          style={{
            marginLeft: 'max(0px, env(safe-area-inset-left))',
            marginRight: 'max(0px, env(safe-area-inset-right))',
            marginBottom: 'max(0px, env(safe-area-inset-bottom))',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="puntos-retorno-confirm-title"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/50">
                    <Sparkles className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <h2
                    id="puntos-retorno-confirm-title"
                    className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl leading-tight"
                  >
                    Confirmar retorno en puntos
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={savingPct}
                  className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label="Cerrar"
                >
                  <X size={22} />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Si confirmás, las <strong className="text-gray-900 dark:text-white">próximas ventas</strong> con
                cliente acumularán{' '}
                <strong className="text-orange-600 dark:text-orange-400">{pendingPct}%</strong> del total cobrado en
                puntos automáticos, además de los puntos bonus por producto si los hubiera.
              </p>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Los saldos y transacciones de puntos ya registrados no se modifican; solo cambia la regla para ventas
                nuevas.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={savingPct}
                  className="min-h-[48px] sm:min-h-[44px] flex-1 order-2 sm:order-1 rounded-xl bg-gray-200 px-4 py-3 font-semibold text-gray-700 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 sm:py-2.5 touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  ref={confirmBtnRef}
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={savingPct}
                  className="min-h-[48px] sm:min-h-[44px] flex-1 order-1 sm:order-2 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600 sm:py-2.5 flex items-center justify-center gap-2 touch-manipulation"
                >
                  {savingPct ? (
                    <>
                      <Loader2 size={18} className="animate-spin shrink-0" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Check size={18} className="shrink-0" />
                      Confirmar {pendingPct}%
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )

  return (
    <>
      {modal}
      <div
        className={[
          'flex flex-wrap items-center gap-2 min-h-[44px] w-full min-w-0 max-w-full sm:flex-nowrap sm:w-auto',
          'rounded-xl border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-800/80 shadow-sm dark:shadow-black/20',
          'px-2 py-1.5 sm:px-3 sm:py-1',
          'max-sm:pl-[max(0.5rem,env(safe-area-inset-left,0px))] max-sm:pr-[max(0.5rem,env(safe-area-inset-right,0px))]',
          '[-webkit-tap-highlight-color:transparent]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        role="group"
        title="Porcentaje del total cobrado que se acumula en puntos cuando el pedido tiene cliente"
        aria-label="Retorno en puntos sobre ventas"
      >
        <div className="flex items-center gap-2 shrink-0 max-sm:min-w-0">
          <span className="flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100/90 dark:bg-amber-900/35 text-amber-600 dark:text-amber-300 border border-amber-200/70 dark:border-amber-700/40">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="sm:hidden text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Puntos venta
          </span>
          <span className="hidden sm:inline text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Retorno
          </span>
        </div>
        <div
          className={[
            'flex flex-1 sm:flex-none items-stretch min-w-0 basis-full sm:basis-auto',
            'min-h-[44px] sm:min-h-[36px] rounded-lg border border-gray-100 dark:border-gray-600/70',
            'bg-gray-50 dark:bg-gray-900/45 p-0.5 gap-0.5',
            'max-sm:mt-1 max-sm:basis-full',
          ].join(' ')}
        >
          {OPCIONES.map((pct) => {
            const activo = currentPct === pct
            return (
              <button
                key={pct}
                type="button"
                disabled={savingPct || confirmOpen}
                onClick={() => openConfirm(pct)}
                className={[
                  'flex-1 min-h-[44px] sm:min-h-0 sm:min-w-[2.75rem] px-2 sm:px-2.5 rounded-md text-sm font-bold transition-all touch-manipulation',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800',
                  activo
                    ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-200/90 dark:border-orange-600/50'
                    : 'text-gray-600 dark:text-gray-400 border border-transparent hover:bg-white/80 dark:hover:bg-gray-800/70 active:bg-white dark:active:bg-gray-800',
                  savingPct || confirmOpen ? 'opacity-60 cursor-wait' : 'active:scale-[0.98]',
                ].join(' ')}
                aria-pressed={activo}
              >
                {pct}%
              </button>
            )
          })}
        </div>
        {savingPct && !confirmOpen && (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-orange-500 dark:text-orange-400"
            aria-label="Guardando"
          />
        )}
        {pctError && !savingPct && !confirmOpen && (
          <span
            className="text-[11px] font-semibold text-red-600 dark:text-red-400 max-w-[5.5rem] leading-tight truncate shrink-0"
            title={pctError}
          >
            Error
          </span>
        )}
      </div>
    </>
  )
}
