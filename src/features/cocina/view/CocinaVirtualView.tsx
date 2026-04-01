'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTenant } from '@/contexts/TenantContext'
import { useEstadoCaja } from '@/features/caja/hooks/useEstadoCaja'
import { getSesionesPasadasAction } from '@/app/actions/caja'
import type { SesionCaja } from '@/features/caja/types/caja.types'
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import { useAchievements } from '../hooks/useAchievements'
import { STAGE_COLORS, STAGE_EMOJIS, STAGE_LABELS, type KitchenOrder, type KitchenStage } from '../utils/cocina.utils'
import KitchenCanvas from '../components/KitchenCanvas'
import AchievementToastStack from '../components/AchievementToast'
import AchievementsPanel from '../components/AchievementsPanel'
import DiamondTrophyShowcase from '../components/DiamondTrophyShowcase'
import OrderDetailModal from '../components/OrderDetailModal'
import { isCocinaCompactShellWidth, isCocinaMobileWidth } from '../utils/cocina-layout'

const STAGES: KitchenStage[] = ['nuevo', 'cocinando', 'empacando', 'entregado']

/* ═══ Skeleton while loading caja + initial orders fetch ═══ */
function CocinaSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 text-gray-900 dark:text-gray-100 px-3 sm:px-4 animate-in fade-in duration-300"
      style={{
        minHeight: 'calc(var(--cocina-vh, 1vh) * 100)',
        paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Skeleton stats responsive */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 md:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/80 px-2.5 py-2 animate-pulse">
              <div className="h-2.5 w-14 bg-gray-200 dark:bg-gray-600 rounded mb-2" />
              <div className="h-5 w-10 bg-gray-200 dark:bg-gray-600 rounded" />
            </div>
          ))}
        </div>

        <div className="hidden md:grid lg:hidden grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 animate-pulse">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded mb-2" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-start gap-3">
          <div className="flex-1 grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-600 px-4 py-3 flex items-center gap-3 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
          <div className="w-[110px] h-[92px] rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0 border border-gray-200 dark:border-gray-600" />
        </div>
      </div>

      {/* Skeleton resumen etapas / chips */}
      <div className="hidden md:flex lg:hidden gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-28 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
        ))}
      </div>

      {/* Skeleton panel principal */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 min-h-[320px] p-3">
        <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
        <div className="h-9 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-3 md:hidden" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 h-[calc(100%-72px)]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/70 p-2.5 animate-pulse">
              <div className="h-8 rounded-lg bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="space-y-2">
                <div className="h-14 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-14 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-14 rounded-lg bg-gray-200 dark:bg-gray-700 hidden md:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══ Animated number that counts up smoothly ═══ */
function AnimatedNumber({ value, prefix }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (value === prevRef.current) return
    const from = prevRef.current
    const to = value
    prevRef.current = to
    setAnimate(true)

    const duration = 600
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * ease))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setAnimate(false)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  const formatted = prefix
    ? `${prefix} ${display.toLocaleString('es-PY')}`
    : String(display)

  return (
    <span className={animate ? 'animate-count-up' : ''}>
      {formatted}
    </span>
  )
}

function formatCompactGs(value: number): string {
  const compact = new Intl.NumberFormat('es-PY', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
  return `Gs. ${compact}`
}

/* ═══ Stat Card with animations ═══ */
function StatCard({
  icon,
  label,
  value,
  accent,
  isGs,
  pulse,
  celebrate,
}: {
  icon: string
  label: string
  value: number
  accent: string
  isGs?: boolean
  pulse?: boolean
  celebrate?: boolean
}) {
  const prevValue = useRef(value)
  const [pop, setPop] = useState(false)

  useEffect(() => {
    if (celebrate && value > prevValue.current) {
      setPop(true)
      const t = setTimeout(() => setPop(false), 400)
      prevValue.current = value
      return () => clearTimeout(t)
    }
    prevValue.current = value
  }, [value, celebrate])

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm dark:shadow-black/30 px-4 py-3
        flex items-center gap-3 transition-all duration-300
        ${pulse ? 'animate-pulse-red' : ''}
        ${pop ? 'animate-celebrate' : ''}
        hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/40
      `}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-300 font-medium truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white truncate tabular-nums">
          {isGs ? (
            <AnimatedNumber value={value} prefix="Gs." />
          ) : (
            <AnimatedNumber value={value} />
          )}
        </p>
      </div>
    </div>
  )
}

/* ═══ Main View ═══ */
export default function CocinaVirtualView() {
  const { tenant, isAdmin } = useTenant()
  const { sesionAbierta, ultimaSesionCerrada, loading: loadingCaja } = useEstadoCaja(tenant?.id ?? null)
  const { orders, stats, newDeliveryIds, clearDelivery, initialLoad } = useRealtimeOrders({
    tenantId: tenant?.id,
    // Mientras se carga el estado de caja, no mostramos pedidos para evitar parpadeos.
    // Una vez resuelto, filtramos estrictamente por el turno correspondiente.
    desde: loadingCaja
      ? null
      : sesionAbierta?.apertura_at ?? ultimaSesionCerrada?.apertura_at ?? null,
    hasta: loadingCaja
      ? undefined
      : sesionAbierta ? null : ultimaSesionCerrada?.cierre_at ?? undefined,
  })

  const [streak, setStreak] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showcaseAchievement, setShowcaseAchievement] = useState<import('../utils/achievements').Achievement | null>(null)
  const [sesiones, setSesiones] = useState<SesionCaja[]>([])
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
  const [stageOverrides, setStageOverrides] = useState<Record<string, KitchenStage>>({})
  const [isCompactViewport, setIsCompactViewport] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showTabletStageSummary, setShowTabletStageSummary] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const updateViewportType = () => {
      const width = window.innerWidth
      setIsCompactViewport(isCocinaCompactShellWidth(width))
      setIsMobileViewport(isCocinaMobileWidth(width))
    }
    updateViewportType()
    window.addEventListener('resize', updateViewportType)
    window.visualViewport?.addEventListener('resize', updateViewportType)
    return () => {
      window.removeEventListener('resize', updateViewportType)
      window.visualViewport?.removeEventListener('resize', updateViewportType)
    }
  }, [])

  useEffect(() => {
    const setViewportVars = () => {
      const vv = window.visualViewport
      const viewportHeight = vv?.height ?? window.innerHeight
      const viewportWidth = vv?.width ?? window.innerWidth
      document.documentElement.style.setProperty('--cocina-vh', `${viewportHeight * 0.01}px`)
      document.documentElement.style.setProperty('--cocina-vw', `${viewportWidth * 0.01}px`)
    }

    setViewportVars()

    window.addEventListener('resize', setViewportVars)
    window.visualViewport?.addEventListener('resize', setViewportVars)
    window.visualViewport?.addEventListener('scroll', setViewportVars)

    return () => {
      window.removeEventListener('resize', setViewportVars)
      window.visualViewport?.removeEventListener('resize', setViewportVars)
      window.visualViewport?.removeEventListener('scroll', setViewportVars)
      document.documentElement.style.removeProperty('--cocina-vh')
      document.documentElement.style.removeProperty('--cocina-vw')
    }
  }, [])

  useEffect(() => {
    if (!tenant?.id) return
    getSesionesPasadasAction(tenant.id, 60).then(res => {
      if (res.success) setSesiones(res.data)
    })
  }, [tenant?.id])

  const handleDiamondClick = useCallback((achievement: import('../utils/achievements').Achievement) => {
    setShowcaseAchievement(achievement)
    setPanelOpen(false)
  }, [])

  const handleStreakChange = useCallback((s: number) => {
    setStreak(s)
  }, [])

  const handleOrderClick = useCallback((order: KitchenOrder) => {
    // Apply any existing override so modal shows effective stage
    const effectiveStage = stageOverrides[order.id] ?? order.stage
    setSelectedOrder({ ...order, stage: effectiveStage })
  }, [stageOverrides])

  const handleStageChange = useCallback((orderId: string, stage: KitchenStage) => {
    setStageOverrides((prev) => ({ ...prev, [orderId]: stage }))
    setSelectedOrder((prev) => prev?.id === orderId ? { ...prev, stage } : prev)
  }, [])

  const {
    newlyUnlocked,
    dismissAchievement,
    isUnlocked,
    getUnlockTime,
    store,
    dailyProgress,
    dailyTotal,
    totalUnlocked,
    totalAchievements,
  } = useAchievements({
    tenantId: tenant?.id,
    sessionId: sesionAbierta?.id,
    stats,
    orders,
    streak,
  })

  const stageCounts = STAGES.map((s) => ({
    stage: s,
    count: orders.filter((o) => (stageOverrides[o.id] ?? o.stage) === s).length,
  }))

  const gsHora = useMemo(() => {
    const now = new Date()
    const hoursElapsed = now.getHours() + now.getMinutes() / 60
    if (hoursElapsed < 0.5) return stats.todayRevenue
    return Math.round(stats.todayRevenue / hoursElapsed)
  }, [stats.todayRevenue])
  const ticketPromedio = useMemo(() => {
    if (stats.todayTotal <= 0) return 0
    return Math.round(stats.todayRevenue / stats.todayTotal)
  }, [stats.todayRevenue, stats.todayTotal])

  const isLoading = loadingCaja || initialLoad
  const isDesktopViewport = !isCompactViewport

  if (isLoading) {
    return <CocinaSkeleton />
  }

  const fabReserveBottom =
    isMounted && isCompactViewport
      ? 'calc(0.75rem + env(safe-area-inset-bottom, 0px) + 4.5rem)'
      : 'calc(0.75rem + env(safe-area-inset-bottom, 0px))'

  return (
    <div
      className="flex flex-col gap-3 text-gray-900 dark:text-gray-100 px-2.5 sm:px-3 lg:px-2.5 animate-in fade-in duration-500 fill-mode-forwards h-full min-h-0 overflow-hidden"
      style={{
        height: '100%',
        paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
        paddingBottom: fabReserveBottom,
        paddingLeft: 'calc(0.75rem + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(0.75rem + env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Stats bar (solo mobile/tablet compact) */}
      {(isMobileViewport || isCompactViewport) && (
        <div className="flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-forwards" style={{ animationDelay: '0ms' }}>
          {isMobileViewport ? (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/80 p-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 px-2.5 py-2">
                <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-300">Pedidos</p>
                <p className="text-lg font-black text-orange-700 dark:text-orange-200 tabular-nums">{stats.todayTotal}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 px-2.5 py-2">
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">Facturado</p>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-200 tabular-nums truncate">{formatCompactGs(stats.todayRevenue)}</p>
              </div>
              <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/40 px-2.5 py-2">
                <p className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-300">Entregados</p>
                <p className="text-lg font-black text-yellow-700 dark:text-yellow-200 tabular-nums">{stats.deliveredCount}</p>
              </div>
            </div>
          </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard
                icon="📋"
                label="Pedidos del día"
                value={stats.todayTotal}
                accent="#FF6B35"
              />
              <StatCard
                icon="💰"
                label="Facturado hoy"
                value={stats.todayRevenue}
                accent="#4CAF50"
                isGs
              />
              <StatCard
                icon="✅"
                label="Entregados"
                value={stats.deliveredCount}
                accent="#FFD700"
                celebrate
              />
              <StatCard
                icon="🧾"
                label="Ticket promedio"
                value={ticketPromedio}
                accent="#9B59B6"
                isGs
              />
            </div>
          )}
        </div>
      )}

      {/* Stage badges / resumen por etapa (solo tablet compact) */}
      {!isMobileViewport && isCompactViewport && (
        <div
          className="flex-shrink-0 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/80 px-3 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-forwards"
          style={{ animationDelay: '80ms' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-200">Pedidos por etapa</span>
            <button
              onClick={() => setShowTabletStageSummary((prev) => !prev)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/70 text-gray-600 dark:text-gray-200"
            >
              {showTabletStageSummary ? 'Ver menos' : 'Ver todas'}
            </button>
          </div>

          {!showTabletStageSummary && (
            <div className="mt-2 flex items-center gap-2 overflow-x-auto custom-scrollbar">
              {stageCounts.slice(0, 3).map(({ stage, count }) => (
                <div
                  key={stage}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-600"
                >
                  <span style={{ color: STAGE_COLORS[stage] }}>{STAGE_EMOJIS[stage]}</span>
                  <span>{STAGE_LABELS[stage]}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 dark:bg-gray-700">{count}</span>
                </div>
              ))}
            </div>
          )}

          {showTabletStageSummary && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {stageCounts.map(({ stage, count }) => (
                <div
                  key={stage}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                >
                  <span style={{ color: STAGE_COLORS[stage] }}>{STAGE_EMOJIS[stage]}</span>
                  <span>{STAGE_LABELS[stage]}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-200 dark:bg-gray-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kitchen panel — aparición escalonada */}
      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-lg dark:shadow-black/30 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/80 relative animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards" style={{ animationDelay: '160ms' }}>
        {!isCompactViewport && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute top-3 right-3 z-20 w-[96px] bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/60 dark:to-yellow-950/40 border border-amber-200 dark:border-amber-700/60 rounded-xl px-2.5 py-2.5 flex flex-col items-center gap-1.5 hover:shadow-lg dark:hover:shadow-amber-500/10 hover:border-amber-300 dark:hover:border-amber-600 transition-all group backdrop-blur-sm"
            title="Ver logros"
            aria-label="Ver logros"
          >
            <span className="text-xl leading-none group-hover:animate-celebrate">🏆</span>
            <span className="text-[10px] font-semibold text-amber-700/90 dark:text-amber-300/90 leading-none">
              Logros
            </span>
            <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 tabular-nums leading-none">
              {totalUnlocked}/{totalAchievements}
            </span>
            {dailyProgress > 0 && (
              <div className="w-full h-1 bg-amber-100 dark:bg-amber-900/50 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(dailyProgress / dailyTotal) * 100}%`,
                    background: 'linear-gradient(90deg, #F59E0B, #FFD700)',
                  }}
                />
              </div>
            )}
          </button>
        )}
        <KitchenCanvas
          orders={orders}
          stats={stats}
          newDeliveryIds={newDeliveryIds}
          onDeliveryAnimated={clearDelivery}
          onStreakChange={handleStreakChange}
          sessionId={sesionAbierta?.id}
          onOrderClick={handleOrderClick}
          stageOverrides={stageOverrides}
        />
      </div>

      {/* Achievement Toasts */}
      <AchievementToastStack
        achievements={newlyUnlocked}
        onDismiss={dismissAchievement}
      />

      {/* Achievements Panel */}
      <AchievementsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        isUnlocked={isUnlocked}
        getUnlockTime={getUnlockTime}
        store={store}
        dailyProgress={dailyProgress}
        dailyTotal={dailyTotal}
        totalUnlocked={totalUnlocked}
        totalAchievements={totalAchievements}
        sesiones={sesiones}
        onDiamondClick={(a) => {
          setShowcaseAchievement(a)
          setPanelOpen(false)
        }}
      />

      {isMounted && isCompactViewport && createPortal(
        <button
          onClick={() => setPanelOpen(true)}
          className="fixed z-[90] rounded-full shadow-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-400 to-yellow-500 text-white w-14 h-14 flex items-center justify-center"
          style={{
            right: 'calc(0.875rem + env(safe-area-inset-right, 0px))',
            bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          }}
          aria-label="Abrir logros"
          title="Abrir logros"
        >
          <span className="text-2xl">🏆</span>
        </button>,
        document.body
      )}

      {/* Diamond Trophy Showcase (full-screen trophy view) */}
      {showcaseAchievement && (
        <DiamondTrophyShowcase
          achievement={showcaseAchievement}
          onClose={() => setShowcaseAchievement(null)}
          tenantNombre={tenant?.nombre ?? 'Karúbox'}
        />
      )}

      {/* Order detail modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        isAdmin={isAdmin}
        onStageChange={handleStageChange}
      />
    </div>
  )
}
