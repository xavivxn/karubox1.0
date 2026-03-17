'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
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

const STAGES: KitchenStage[] = ['nuevo', 'cocinando', 'empacando', 'entregado']

/* ═══ Skeleton while loading caja + initial orders fetch ═══ */
function CocinaSkeleton() {
  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-160px)] text-gray-900 dark:text-gray-100 px-4 animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <div className="w-[72px] h-[72px] rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
        ))}
      </div>
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 animate-pulse min-h-[280px]" />
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

  const isLoading = loadingCaja || initialLoad

  if (isLoading) {
    return <CocinaSkeleton />
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-160px)] text-gray-900 dark:text-gray-100 px-4 animate-in fade-in duration-500 fill-mode-forwards">
      {/* Stats bar — aparece primero */}
      <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-forwards" style={{ animationDelay: '0ms' }}>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon="📋"
            label="Pedidos hoy"
            value={stats.todayTotal}
            accent="#FF6B35"
          />
          <StatCard
            icon="💰"
            label="Facturado"
            value={stats.todayRevenue}
            accent="#4CAF50"
            isGs
          />
          <StatCard
            icon="🔥"
            label="En cocina"
            value={stats.activeCount}
            accent="#FF3E3E"
            pulse={stats.activeCount > 0}
          />
          <StatCard
            icon="✅"
            label="Entregados"
            value={stats.deliveredCount}
            accent="#FFD700"
            celebrate
          />
          <StatCard
            icon="⚡"
            label="Gs/hora"
            value={gsHora}
            accent="#9B59B6"
            isGs
          />
        </div>

        {/* Trophy button */}
        <button
          onClick={() => setPanelOpen(true)}
          className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/60 dark:to-yellow-950/40 border-2 border-amber-200 dark:border-amber-700/60 rounded-2xl px-4 py-3 flex flex-col items-center gap-1 hover:shadow-lg dark:hover:shadow-amber-500/10 hover:border-amber-300 dark:hover:border-amber-600 transition-all group"
        >
          <span className="text-2xl group-hover:animate-celebrate">🏆</span>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
            {totalUnlocked}/{totalAchievements}
          </span>
          {dailyProgress > 0 && (
            <div className="w-12 h-1 bg-amber-100 dark:bg-amber-900/50 rounded-full overflow-hidden">
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
      </div>

      {/* Stage badges — aparición escalonada */}
      <div className="flex gap-2 flex-wrap animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-forwards" style={{ animationDelay: '80ms' }}>
        {stageCounts.map(({ stage, count }) => (
          <div
            key={stage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm dark:shadow-black/30"
            style={{ backgroundColor: STAGE_COLORS[stage] }}
          >
            <span>{STAGE_EMOJIS[stage]}</span>
            <span>{STAGE_LABELS[stage]}</span>
            <span className="bg-white/25 dark:bg-black/20 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
          </div>
        ))}
      </div>

      {/* Kitchen panel — aparición escalonada */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-lg dark:shadow-black/30 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/80 relative animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards" style={{ animationDelay: '160ms' }}>
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
