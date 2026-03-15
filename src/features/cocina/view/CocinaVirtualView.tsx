'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import { useAchievements } from '../hooks/useAchievements'
import { STAGE_COLORS, STAGE_EMOJIS, STAGE_LABELS, type KitchenStage } from '../utils/cocina.utils'
import KitchenCanvas from '../components/KitchenCanvas'
import AchievementToastStack from '../components/AchievementToast'
import AchievementsPanel from '../components/AchievementsPanel'

const STAGES: KitchenStage[] = ['nuevo', 'cocinando', 'empacando', 'entregado']

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
        bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3
        flex items-center gap-3 transition-all duration-300
        ${pulse ? 'animate-pulse-red' : ''}
        ${pop ? 'animate-celebrate' : ''}
        hover:shadow-md
      `}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 truncate tabular-nums">
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
  const { tenant } = useTenant()
  const { orders, stats, newDeliveryIds, clearDelivery } = useRealtimeOrders({
    tenantId: tenant?.id,
  })

  const [streak, setStreak] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)

  const handleStreakChange = useCallback((s: number) => {
    setStreak(s)
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
    stats,
    orders,
    streak,
  })

  const stageCounts = STAGES.map((s) => ({
    stage: s,
    count: orders.filter((o) => o.stage === s).length,
  }))

  const gsHora = useMemo(() => {
    const now = new Date()
    const hoursElapsed = now.getHours() + now.getMinutes() / 60
    if (hoursElapsed < 0.5) return stats.todayRevenue
    return Math.round(stats.todayRevenue / hoursElapsed)
  }, [stats.todayRevenue])

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-160px)]">
      {/* Stats bar */}
      <div className="flex items-start gap-3">
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
          className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl px-4 py-3 flex flex-col items-center gap-1 hover:shadow-lg hover:border-amber-300 transition-all group"
        >
          <span className="text-2xl group-hover:animate-celebrate">🏆</span>
          <span className="text-xs font-bold text-amber-700">
            {totalUnlocked}/{totalAchievements}
          </span>
          {dailyProgress > 0 && (
            <div className="w-12 h-1 bg-amber-100 rounded-full overflow-hidden">
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

      {/* Stage badges */}
      <div className="flex gap-2 flex-wrap">
        {stageCounts.map(({ stage, count }) => (
          <div
            key={stage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: STAGE_COLORS[stage] }}
          >
            <span>{STAGE_EMOJIS[stage]}</span>
            <span>{STAGE_LABELS[stage]}</span>
            <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
          </div>
        ))}
      </div>

      {/* Kitchen panel */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white relative">
        <KitchenCanvas
          orders={orders}
          stats={stats}
          newDeliveryIds={newDeliveryIds}
          onDeliveryAnimated={clearDelivery}
          onStreakChange={handleStreakChange}
        />

        {orders.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-2">
              <div className="text-5xl">🍳</div>
              <p className="text-sm font-medium text-gray-400">
                Sin pedidos activos. La cocina espera...
              </p>
            </div>
          </div>
        )}
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
      />
    </div>
  )
}
