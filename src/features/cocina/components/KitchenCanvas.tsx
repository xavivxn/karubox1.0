'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import {
  KITCHEN_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_EMOJIS,
  STAGE_MS_ENTREGADO,
  getOrderColor,
  playCoinSound,
  playNewOrderSound,
  playComboSound,
  type KitchenOrder,
  type KitchenStage,
} from '../utils/cocina.utils'

/* ═══════════════ CONSTANTS ═══════════════ */

const ORDER_TYPE_LABELS: Record<string, string> = {
  delivery: 'Delivery',
  local: 'Local',
  para_llevar: 'Para llevar',
}

const WORKER_EMOJIS: Record<KitchenStage, string[]> = {
  nuevo: ['🧑‍💼'],
  cocinando: ['👨‍🍳', '👩‍🍳'],
  empacando: ['🧑‍🏭'],
  entregado: ['🤝'],
}

const STAGE_BG: Record<KitchenStage, string> = {
  nuevo: 'from-orange-50 to-orange-100/50 dark:from-gray-800 dark:to-gray-800/90',
  cocinando: 'from-red-50 to-red-100/50 dark:from-gray-800 dark:to-gray-800/90',
  empacando: 'from-green-50 to-green-100/50 dark:from-gray-800 dark:to-gray-800/90',
  entregado: 'from-yellow-50 to-amber-100/50 dark:from-gray-800 dark:to-gray-800/90',
}

// Ventana (ms) desde que el pedido pasó a "entregado" para considerar la entrega reciente (sonido + ticker).
const RECENT_DELIVERY_WINDOW_MS = 60_000

const EMPTY_MESSAGES: Record<KitchenStage, string> = {
  nuevo: 'Esperando el próximo pedido... 🎯',
  cocinando: 'La parrilla espera el próximo pedido... 🔥',
  empacando: 'Listo para empacar... 📦',
  entregado: '¡A despachar se ha dicho! 🚀',
}

const CONFETTI_COLORS = ['#FFD700', '#FF6B35', '#4CAF50', '#4A90D9', '#FF3E3E', '#9B59B6', '#FF69B4']

const COMBO_THRESHOLDS = [
  { min: 3, label: 'COMBO x3!', emoji: '⚡' },
  { min: 5, label: 'RACHA x5!', emoji: '🔥' },
  { min: 8, label: 'IMPARABLE x8!', emoji: '💥' },
  { min: 10, label: '¡LEYENDA x10!', emoji: '👑' },
]

function formatElapsed(ms: number): string {
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function formatGs(n: number): string {
  return 'Gs. ' + n.toLocaleString('es-PY')
}

/* ═══════════════ ROLLING DIGIT COUNTER ═══════════════ */

function RollingDigit({ digit, delay }: { digit: string; delay: number }) {
  const [current, setCurrent] = useState(digit)
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    if (digit !== current) {
      setRolling(true)
      const t = setTimeout(() => {
        setCurrent(digit)
        setRolling(false)
      }, 350)
      return () => clearTimeout(t)
    }
  }, [digit, current])

  return (
    <span
      className="inline-block overflow-hidden relative"
      style={{
        width: /\d/.test(digit) ? '0.62em' : 'auto',
        height: '1.15em',
        verticalAlign: 'bottom',
      }}
    >
      <span
        className={rolling ? 'animate-digit-roll' : ''}
        style={{
          display: 'inline-block',
          animationDelay: `${delay * 30}ms`,
        }}
      >
        {rolling ? digit : current}
      </span>
    </span>
  )
}

function MoneyCounter({ value, label, icon }: { value: number; label: string; icon: string }) {
  const formatted = formatGs(value)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 dark:text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-lg font-black text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
          {formatted.split('').map((ch, i) => (
            <RollingDigit key={`${i}-${ch}`} digit={ch} delay={i} />
          ))}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════ COMBO / STREAK BADGE ═══════════════ */

function ComboBadge({ streak, lastOrderTime }: { streak: number; lastOrderTime: number }) {
  const threshold = [...COMBO_THRESHOLDS].reverse().find((t) => streak >= t.min)
  if (!threshold) return null

  const elapsed = Date.now() - lastOrderTime
  const COMBO_WINDOW = 5 * 60_000
  const remaining = Math.max(0, 1 - elapsed / COMBO_WINDOW)
  const isGold = streak >= 5

  return (
    <div className="flex items-center gap-2 animate-combo-pop">
      <div
        className={`
          px-3 py-1.5 rounded-full font-black text-sm flex items-center gap-1.5 shadow-lg
          ${isGold ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'}
        `}
      >
        <span className="text-base">{threshold.emoji}</span>
        <span>{threshold.label}</span>
      </div>
      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${remaining * 100}%`,
            background: isGold
              ? 'linear-gradient(90deg, #FFD700, #FF8C00)'
              : 'linear-gradient(90deg, #FF6B35, #FF3E3E)',
          }}
        />
      </div>
    </div>
  )
}

/* ═══════════════ CONFETTI BURST (enhanced) ═══════════════ */

function ConfettiBurst({ onDone, intensity }: { onDone: () => void; intensity?: number }) {
  const count = intensity ?? (20 + Math.floor(Math.random() * 20))
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.4,
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        isCircle: Math.random() > 0.5,
      })),
    [count]
  )

  useEffect(() => {
    const t = setTimeout(onDone, 1500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════ EMBER PARTICLES (cooking fire) ═══════════════ */

function EmberParticles() {
  const embers = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        delay: Math.random() * 2,
        duration: 0.6 + Math.random() * 0.6,
        ex: -15 + Math.random() * 30,
      })),
    []
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {embers.map((e) => (
        <div
          key={e.id}
          className="absolute w-1.5 h-1.5 rounded-full animate-ember"
          style={{
            left: `${e.left}%`,
            bottom: '5px',
            background: `radial-gradient(circle, #FF6B35, #FF3E3E)`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            animationIterationCount: 'infinite',
            '--ex': `${e.ex}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

/* ═══════════════ ORDER CARD (on steroids) ═══════════════ */

function OrderCard({
  order,
  isNew,
  onClick,
}: {
  order: KitchenOrder
  isNew: boolean
  onClick?: () => void
}) {
  const typeColor = getOrderColor(order.tipo)
  const typeLabel = ORDER_TYPE_LABELS[order.tipo] ?? order.tipo
  const isDone = order.stage === 'entregado'
  const isCooking = order.stage === 'cocinando'

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white dark:bg-gray-700/90 rounded-xl shadow-sm border p-3
        ${isNew ? 'animate-slam-in' : 'animate-fade-in-up'}
        ${isDone ? 'opacity-75 scale-[0.97] border-yellow-200 dark:border-amber-700/50' : 'border-gray-100 dark:border-gray-600'}
        ${isCooking ? 'animate-fire-shimmer' : ''}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/40 active:scale-[0.98]' : 'hover:shadow-md'}
        dark:hover:shadow-black/20 transition-all duration-200
      `}
    >
      {isCooking && <EmberParticles />}

      <div className="flex items-center justify-between mb-1.5 relative z-[1]">
        <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100">#{order.numero_pedido}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: typeColor }}
        >
          {typeLabel}
        </span>
      </div>

      <div className="flex items-center justify-between mb-1.5 relative z-[1]">
        <span className="text-xs font-bold text-green-600 dark:text-green-400">{formatGs(order.total)}</span>
      </div>

      {!isDone && (
        <>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden mb-1 relative z-[1]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${Math.min(order.progress * 100, 100)}%`,
                backgroundColor: STAGE_COLORS[order.stage],
              }}
            />
          </div>
          <div className="flex items-center justify-between relative z-[1]">
            <span className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">
              {formatElapsed(order.elapsed)}
            </span>
            <span className="text-[10px] text-gray-300 dark:text-gray-500">
              {Math.round(order.progress * 100)}%
            </span>
          </div>
        </>
      )}

      {isDone && (
        <div className="text-[11px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 relative z-[1]">
          <span>✅ Listo</span>
          <span className="text-green-500 dark:text-green-400/90">~{formatElapsed(order.elapsed)}</span>
        </div>
      )}
    </div>
  )
}

/* ═══════════════ STAGE COLUMN (enhanced) ═══════════════ */

function StageColumn({
  stage,
  orders,
  hasNewDelivery,
  hasNewOrder,
  onConfettiDone,
  onOrderClick,
}: {
  stage: KitchenStage
  orders: KitchenOrder[]
  hasNewDelivery: boolean
  hasNewOrder: boolean
  onConfettiDone: () => void
  onOrderClick?: (order: KitchenOrder) => void
}) {
  const isCooking = stage === 'cocinando'
  const isDelivered = stage === 'entregado'

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl bg-gradient-to-b ${STAGE_BG[stage]}
        border overflow-hidden min-h-[300px] min-w-0
        ${isCooking && orders.length > 0 ? 'animate-fire-shimmer border-gray-100/80 dark:border-gray-600' : 'border-gray-100/80 dark:border-gray-600'}
        ${isDelivered && hasNewDelivery ? 'animate-gold-pulse' : ''}
        ${hasNewOrder ? 'animate-shake' : ''}
      `}
    >
      {hasNewDelivery && <ConfettiBurst onDone={onConfettiDone} />}

      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b dark:border-gray-600"
        style={{ borderColor: `${STAGE_COLORS[stage]}25` }}
      >
        <div className="flex items-center gap-2">
          <span className={`text-xl ${isCooking ? 'animate-pulse-fire' : ''}`}>
            {STAGE_EMOJIS[stage]}
          </span>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{STAGE_LABELS[stage]}</span>
        </div>
        <span
          className="text-xs font-extrabold px-2.5 py-1 rounded-full text-white min-w-[28px] text-center"
          style={{ backgroundColor: STAGE_COLORS[stage] }}
        >
          {orders.length}
        </span>
      </div>

      {/* Orders */}
      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto custom-scrollbar">
        {orders.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <span className="text-sm text-gray-500 dark:text-gray-300 italic text-center px-2">
              {EMPTY_MESSAGES[stage]}
            </span>
          </div>
        )}
        {orders.map((order, i) => (
          <OrderCard
            key={order.id}
            order={order}
            isNew={i === 0 && hasNewOrder}
            onClick={onOrderClick ? () => onOrderClick(order) : undefined}
          />
        ))}
      </div>

      {/* Workers footer */}
      <div className="px-3 py-2 border-t border-gray-100/60 dark:border-gray-600 flex items-center gap-1">
        {WORKER_EMOJIS[stage].map((emoji, j) => (
          <span
            key={j}
            className={`text-lg ${orders.length > 0 ? 'animate-worker-bounce' : ''}`}
            style={{ animationDelay: `${j * 0.2}s` }}
          >
            {emoji}
          </span>
        ))}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto font-medium">
          {stage === 'nuevo' && 'Recepción'}
          {stage === 'cocinando' && 'Cocina'}
          {stage === 'empacando' && 'Empaque'}
          {stage === 'entregado' && 'Despacho'}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════ ACTIVITY TICKER (Upgrade Dopamina) ═══════════════ */

const HIGH_SCORE_GS = 200_000

function tickerEmojiByTotal(total: number, isDelivery: boolean): string {
  if (isDelivery) return total >= HIGH_SCORE_GS ? '🪙' : '💰'
  if (total >= HIGH_SCORE_GS) return '🪙'
  if (total >= 50_000) return '💰'
  return '💵'
}

interface TickerEvent {
  id: string
  text: string
  emoji: string
  ts: number
  total?: number
  isDelivery?: boolean
}

function ActivityTicker({ events }: { events: TickerEvent[] }) {
  if (events.length === 0) return null

  const doubled = [...events, ...events]

  return (
    <div className="w-full overflow-hidden bg-gray-900 rounded-xl h-8 flex items-center relative">
      <div
        className="flex gap-8 whitespace-nowrap animate-ticker"
        style={{ '--ticker-duration': `${Math.max(events.length * 5, 15)}s` } as React.CSSProperties}
      >
        {doubled.map((ev, i) => {
          const isHighScore = ev.total != null && ev.total >= HIGH_SCORE_GS
          const amountText =
            ev.total != null
              ? ev.isDelivery
                ? `+${formatGs(ev.total)}`
                : formatGs(ev.total)
              : null
          const labelText =
            ev.total != null && amountText != null ? ev.text.replace(amountText, '').trim() : null

          return (
            <span
              key={`${ev.id}-${i}`}
              className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border
                ${isHighScore ? 'border-amber-400/70 bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,0.25)]' : 'border-transparent'}
              `}
            >
              <span className="text-sm" title={isHighScore ? 'High score' : undefined}>
                {ev.emoji}
              </span>
              {amountText != null && labelText != null ? (
                <>
                  <span className="text-xs font-medium text-gray-400">{labelText}</span>
                  <span className="text-xs font-bold text-emerald-300 tabular-nums">{amountText}</span>
                </>
              ) : (
                <span className="text-xs font-medium text-gray-300">{ev.text}</span>
              )}
              <span className="text-gray-600">•</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════ RECORD BREAKER BANNER ═══════════════ */

function RecordBanner({ text }: { text: string }) {
  return (
    <div className="animate-slam-in bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-xl px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
      <span className="text-lg">🏆</span>
      <span className="text-sm font-black text-white tracking-wide">{text}</span>
      <span className="text-lg">🏆</span>
    </div>
  )
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */

export default function KitchenCanvas({
  orders,
  stats,
  newDeliveryIds,
  onDeliveryAnimated,
  onStreakChange,
  sessionId,
  onOrderClick,
  stageOverrides,
}: {
  orders: KitchenOrder[]
  stats: { todayRevenue: number; todayTotal: number; deliveredCount: number }
  newDeliveryIds: string[]
  onDeliveryAnimated: (id: string) => void
  onStreakChange?: (streak: number) => void
  /** Id del turno de caja; al cambiar (nuevo turno = Empezar el día), se reinicia la racha. */
  sessionId?: string | null
  onOrderClick?: (order: KitchenOrder) => void
  stageOverrides?: Record<string, KitchenStage>
}) {
  const soundPlayed = useRef<Set<string>>(new Set())
  const prevOrderCount = useRef(orders.length)
  const hasInitializedOrders = useRef(false)
  const prevSessionId = useRef<string | undefined>(sessionId ?? undefined)
  const [newOrderStages, setNewOrderStages] = useState<Set<KitchenStage>>(new Set())
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([])
  const [streak, setStreak] = useState(0)
  const lastOrderTime = useRef(Date.now())
  const prevRevenueRef = useRef(stats.todayRevenue)
  const [record, setRecord] = useState<string | null>(null)
  const bestRevenueRef = useRef(0)

  useEffect(() => {
    // Caja cerrada o sin sesión: nunca debe haber combo activo
    if (!sessionId) {
      setStreak(0)
      prevSessionId.current = undefined
      return
    }

    // Reiniciar racha al empezar un nuevo turno (Empezar el día)
    if (sessionId !== prevSessionId.current) {
      setStreak(0)
      prevSessionId.current = sessionId
    }
  }, [sessionId])

  // Detect new orders → sound + streak + ticker
  useEffect(() => {
    const count = orders.length

    // Primer snapshot: no considerar pedidos como nuevos ni disparar animaciones/sonidos
    if (!hasInitializedOrders.current) {
      prevOrderCount.current = count
      hasInitializedOrders.current = true
      return
    }

    if (count > prevOrderCount.current) {
      const diff = count - prevOrderCount.current
      const newOrders = orders.slice(0, diff)

      playNewOrderSound()

      const now = Date.now()
      const COMBO_WINDOW = 5 * 60_000
      if (now - lastOrderTime.current < COMBO_WINDOW) {
        setStreak((s) => {
          const next = s + diff
          if (next >= 5 && s < 5) playComboSound()
          return next
        })
      } else {
        setStreak(diff)
      }
      lastOrderTime.current = now

      const stages = new Set(newOrders.map((o) => o.stage))
      setNewOrderStages(stages)
      setTimeout(() => setNewOrderStages(new Set()), 500)

      setTickerEvents((prev) => {
        const newEvents: TickerEvent[] = newOrders.map((o) => ({
          id: `new-${o.id}`,
          text: `Pedido #${o.numero_pedido} recibido — ${formatGs(o.total)}`,
          emoji: tickerEmojiByTotal(o.total, false),
          ts: Date.now(),
          total: o.total,
          isDelivery: false,
        }))
        return [...newEvents, ...prev].slice(0, 20)
      })
    }
    prevOrderCount.current = count
  }, [orders])

  // Detect deliveries → sound + ticker; limpiar newDeliveryIds siempre para no dejar confetti/estilo persistente
  useEffect(() => {
    newDeliveryIds.forEach((id) => {
      if (!soundPlayed.current.has(id)) {
        soundPlayed.current.add(id)

        const order = orders.find((o) => o.id === id)
        if (order) {
          // "Reciente" = tiempo en etapa entregado <= ventana (no elapsed desde creación)
          const timeInEntregado = order.elapsed - STAGE_MS_ENTREGADO
          const isRecentDelivery =
            order.stage === 'entregado' && timeInEntregado <= RECENT_DELIVERY_WINDOW_MS

          if (isRecentDelivery) {
            playCoinSound()
            setTickerEvents((prev) => [
              {
                id: `del-${id}`,
                text: `#${order.numero_pedido} entregado — +${formatGs(order.total)}`,
                emoji: tickerEmojiByTotal(order.total, true),
                ts: Date.now(),
                total: order.total,
                isDelivery: true,
              },
              ...prev,
            ].slice(0, 20))
          }
        }
        // Siempre notificar para quitar id de newDeliveryIds y evitar confetti/estilo en entregas viejas
        onDeliveryAnimated(id)
      }
    })
  }, [newDeliveryIds, orders, onDeliveryAnimated])

  // Record breaker: solo mostrar banner cuando se supera un récord anterior (bestRevenueRef > 0) para no mostrar al abrir
  useEffect(() => {
    if (stats.todayRevenue > prevRevenueRef.current) {
      if (stats.todayRevenue > bestRevenueRef.current && bestRevenueRef.current > 0) {
        bestRevenueRef.current = stats.todayRevenue
        setRecord('¡NUEVO RÉCORD DE FACTURACIÓN!')
        setTimeout(() => setRecord(null), 4000)
      }
      if (bestRevenueRef.current === 0) {
        bestRevenueRef.current = stats.todayRevenue
      }
      prevRevenueRef.current = stats.todayRevenue
    }
  }, [stats.todayRevenue])

  // Streak decay
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastOrderTime.current
      if (elapsed > 5 * 60_000 && streak > 0) {
        setStreak(0)
      }
    }, 5_000)
    return () => clearInterval(interval)
  }, [streak])

  // Si no hay pedidos activos, no tiene sentido mostrar combo
  useEffect(() => {
    if (orders.length === 0 || stats.activeCount === 0) {
      setStreak(0)
    }
  }, [orders.length, stats.activeCount])

  // Report streak to parent
  useEffect(() => {
    onStreakChange?.(streak)
  }, [streak, onStreakChange])

  // Compute pedidos/hora
  const pedidosHora = useMemo(() => {
    const now = new Date()
    const hoursElapsed = now.getHours() + now.getMinutes() / 60
    if (hoursElapsed < 0.5) return stats.todayTotal
    return Math.round(stats.todayTotal / hoursElapsed)
  }, [stats.todayTotal])

  const groups = useMemo(() => {
    const g: Record<KitchenStage, KitchenOrder[]> = {
      nuevo: [],
      cocinando: [],
      empacando: [],
      entregado: [],
    }
    orders.forEach((o) => {
      const effectiveStage = stageOverrides?.[o.id] ?? o.stage
      g[effectiveStage].push({ ...o, stage: effectiveStage })
    })
    return g
  }, [orders, stageOverrides])

  const handleConfettiDone = useCallback(
    (stage: KitchenStage) => {
      groups[stage].forEach((o) => {
        if (newDeliveryIds.includes(o.id)) {
          onDeliveryAnimated(o.id)
        }
      })
    },
    [groups, newDeliveryIds, onDeliveryAnimated]
  )

  const hasNewDeliveryInStage = (stage: KitchenStage) =>
    groups[stage].some((o) => newDeliveryIds.includes(o.id))

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      {/* ─── Top Bar: Money counter + Combo + Rate ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80 flex-wrap gap-2">
        <MoneyCounter value={stats.todayRevenue} label="Facturado hoy" icon="💰" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 dark:text-gray-400 font-semibold uppercase tracking-wider">Pedidos/hora</span>
              <span className="text-lg font-black text-gray-900 dark:text-gray-100">{pedidosHora}</span>
            </div>
          </div>
          {streak >= 3 && stats.activeCount > 0 && (
            <ComboBadge streak={streak} lastOrderTime={lastOrderTime.current} />
          )}
        </div>
      </div>

      {/* ─── Contenido: kanban + ticker ─── */}
      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col">
        {record && (
          <div className="px-4 pt-2 flex-shrink-0">
            <RecordBanner text={record} />
          </div>
        )}

        <div className="flex-1 w-full min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:[grid-template-columns:repeat(4,minmax(0,1fr))] gap-3 p-3 overflow-x-auto overflow-y-hidden min-h-0">
          {KITCHEN_STAGES.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              orders={groups[stage]}
              hasNewDelivery={hasNewDeliveryInStage(stage)}
              hasNewOrder={newOrderStages.has(stage)}
              onConfettiDone={() => handleConfettiDone(stage)}
              onOrderClick={onOrderClick}
            />
          ))}
        </div>

        <div className="px-3 pb-3 flex-shrink-0">
          <ActivityTicker events={tickerEvents} />
        </div>
      </div>
    </div>
  )
}
