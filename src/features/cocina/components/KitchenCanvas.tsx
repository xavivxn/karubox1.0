'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  KITCHEN_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_EMOJIS,
  getOrderColor,
  playCoinSound,
  playNewOrderSound,
  playComboSound,
  type KitchenOrder,
  type KitchenStage,
} from '../utils/cocina.utils'
import type { NextTarget } from '../utils/achievements'
import OrderDetailModal from './OrderDetailModal'

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
  nuevo: 'from-orange-50 to-orange-100/50',
  cocinando: 'from-red-50 to-red-100/50',
  empacando: 'from-green-50 to-green-100/50',
  entregado: 'from-yellow-50 to-amber-100/50',
}

const EMPTY_MESSAGES: Record<KitchenStage, string> = {
  nuevo: 'Esperando el próximo pedido... 🎯',
  cocinando: 'La parrilla espera el próximo pedido... 🔥',
  empacando: 'Listo para empacar... 📦',
  entregado: '¡A despachar se ha dicho! 🚀',
}

const CONFETTI_COLORS = ['#FFD700', '#FF6B35', '#4CAF50', '#4A90D9', '#FF3E3E', '#9B59B6', '#FF69B4']

const COMBO_THRESHOLDS = [
  { min: 2, label: 'COMBO x2!', emoji: '✨' },
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
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
        <motion.div
          key={value}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.38 }}
          className="text-lg font-black text-gray-900 tabular-nums leading-tight"
        >
          {formatted.split('').map((ch, i) => (
            <RollingDigit key={`${i}-${ch}`} digit={ch} delay={i} />
          ))}
        </motion.div>
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
    <div className="flex items-center gap-2">
      <motion.div
        key={`${streak}-${threshold.min}`}
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.65, duration: 0.42 }}
        className={`
          px-3 py-1.5 rounded-full font-black text-sm flex items-center gap-1.5 shadow-lg
          ${isGold ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'}
        `}
      >
        <span className="text-base">{threshold.emoji}</span>
        <span>{threshold.label}</span>
      </motion.div>
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
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

/* ═══════════════ NEXT TARGET PROGRESS BAR ═══════════════ */

function NextTargetBar({ target }: { target: NextTarget }) {
  const ratio = target.current / target.target
  const formatValue = (v: number) =>
    target.isRevenue ? `Gs. ${Math.round(v / 1000)}k` : String(v)

  return (
    <div className="flex items-center gap-2 text-[11px] text-gray-400">
      <span className="font-semibold text-gray-500 truncate max-w-[110px]">
        {target.achievement.emoji} {target.achievement.name}
      </span>
      <span className="text-gray-300 text-[10px]">
        {formatValue(target.current)}/{formatValue(target.target)}
      </span>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
            originX: 0,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: ratio }}
          transition={{ type: 'spring', damping: 22, stiffness: 90 }}
        />
      </div>
    </div>
  )
}

/* ═══════════════ CONFETTI BURST ═══════════════ */

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

/* ═══════════════ ORDER CARD ═══════════════ */

function OrderCard({ order, onClick }: { order: KitchenOrder; onClick: (o: KitchenOrder) => void }) {
  const typeColor = getOrderColor(order.tipo)
  const typeLabel = ORDER_TYPE_LABELS[order.tipo] ?? order.tipo
  const isDone = order.stage === 'entregado'
  const isCooking = order.stage === 'cocinando'

  return (
    <motion.div
      layout
      layoutId={`order-${order.id}`}
      initial={{ opacity: 0, y: -14, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, y: 10 }}
      transition={{ type: 'spring', bounce: 0.35, duration: 0.42 }}
      onClick={() => onClick(order)}
      className={`
        relative bg-white rounded-xl shadow-sm border p-3 cursor-pointer
        ${isDone ? 'opacity-75 scale-[0.97] border-yellow-200' : 'border-gray-100'}
        ${isCooking ? 'animate-fire-shimmer' : ''}
        hover:shadow-md hover:border-gray-200 active:scale-[0.98] transition-all duration-150
      `}
    >
      {isCooking && <EmberParticles />}

      <div className="flex items-center justify-between mb-1.5 relative z-[1]">
        <span className="text-sm font-extrabold text-gray-800">#{order.numero_pedido}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: typeColor }}
        >
          {typeLabel}
        </span>
      </div>

      <div className="flex items-center justify-between mb-1.5 relative z-[1]">
        <span className="text-xs font-bold text-green-600">{formatGs(order.total)}</span>
      </div>

      {!isDone && (
        <>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1 relative z-[1]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${Math.min(order.progress * 100, 100)}%`,
                backgroundColor: STAGE_COLORS[order.stage],
              }}
            />
          </div>
          <div className="flex items-center justify-between relative z-[1]">
            <span className="text-[11px] text-gray-400 font-medium">
              {formatElapsed(order.elapsed)}
            </span>
            <span className="text-[10px] text-gray-300">
              {Math.round(order.progress * 100)}%
            </span>
          </div>
        </>
      )}

      {isDone && (
        <div className="text-[11px] text-green-600 font-semibold flex items-center gap-1 relative z-[1]">
          <span>✅ Listo</span>
          <span className="text-green-500">~{formatElapsed(order.elapsed)}</span>
        </div>
      )}
    </motion.div>
  )
}

/* ═══════════════ STAGE COLUMN ═══════════════ */

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
  onOrderClick: (o: KitchenOrder) => void
}) {
  const isCooking = stage === 'cocinando'
  const isDelivered = stage === 'entregado'

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl bg-gradient-to-b ${STAGE_BG[stage]}
        border overflow-hidden min-h-[300px]
        ${isCooking && orders.length > 0 ? 'animate-fire-shimmer' : 'border-gray-100/80'}
        ${isDelivered && hasNewDelivery ? 'animate-gold-pulse' : ''}
        ${hasNewOrder ? 'animate-shake' : ''}
      `}
    >
      {hasNewDelivery && <ConfettiBurst onDone={onConfettiDone} />}

      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: `${STAGE_COLORS[stage]}25` }}
      >
        <div className="flex items-center gap-2">
          <span className={`text-xl ${isCooking ? 'animate-pulse-fire' : ''}`}>
            {STAGE_EMOJIS[stage]}
          </span>
          <span className="text-sm font-bold text-gray-700">{STAGE_LABELS[stage]}</span>
        </div>
        <motion.span
          key={orders.length}
          initial={{ scale: 1.55 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.6, duration: 0.32 }}
          className="text-xs font-extrabold px-2.5 py-1 rounded-full text-white min-w-[28px] text-center inline-block"
          style={{ backgroundColor: STAGE_COLORS[stage] }}
        >
          {orders.length}
        </motion.span>
      </div>

      {/* Orders */}
      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto custom-scrollbar">
        {orders.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <span className="text-sm text-gray-300 italic text-center px-2">
              {EMPTY_MESSAGES[stage]}
            </span>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onClick={onOrderClick} />
          ))}
        </AnimatePresence>
      </div>

      {/* Workers footer */}
      <div className="px-3 py-2 border-t border-gray-100/60 flex items-center gap-1">
        {WORKER_EMOJIS[stage].map((emoji, j) => (
          <span
            key={j}
            className={`text-lg ${orders.length > 0 ? 'animate-worker-bounce' : ''}`}
            style={{ animationDelay: `${j * 0.2}s` }}
          >
            {emoji}
          </span>
        ))}
        <span className="text-[10px] text-gray-400 ml-auto font-medium">
          {stage === 'nuevo' && 'Recepción'}
          {stage === 'cocinando' && 'Parrilla'}
          {stage === 'empacando' && 'Empaque'}
          {stage === 'entregado' && 'Despacho'}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════ ACTIVITY TICKER ═══════════════ */

interface TickerEvent {
  id: string
  text: string
  emoji: string
  ts: number
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
        {doubled.map((ev, i) => (
          <span key={`${ev.id}-${i}`} className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
            <span>{ev.emoji}</span>
            <span>{ev.text}</span>
            <span className="text-gray-600">•</span>
          </span>
        ))}
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
  nextTarget,
}: {
  orders: KitchenOrder[]
  stats: { todayRevenue: number; todayTotal: number; deliveredCount: number }
  newDeliveryIds: string[]
  onDeliveryAnimated: (id: string) => void
  onStreakChange?: (streak: number) => void
  nextTarget?: NextTarget | null
}) {
  const soundPlayed = useRef<Set<string>>(new Set())
  const prevOrderCount = useRef(orders.length)
  const [newOrderStages, setNewOrderStages] = useState<Set<KitchenStage>>(new Set())
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([])
  const [streak, setStreak] = useState(0)
  const lastOrderTime = useRef(Date.now())
  const prevRevenueRef = useRef(stats.todayRevenue)
  const [record, setRecord] = useState<string | null>(null)
  const bestRevenueRef = useRef(0)
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)

  const handleOrderClick = useCallback((order: KitchenOrder) => {
    setSelectedOrder(order)
  }, [])

  const handleModalClose = useCallback(() => {
    setSelectedOrder(null)
  }, [])

  // Detect new orders → sound + streak + ticker
  useEffect(() => {
    const count = orders.length
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
          emoji: '📋',
          ts: Date.now(),
        }))
        return [...newEvents, ...prev].slice(0, 20)
      })
    }
    prevOrderCount.current = count
  }, [orders])

  // Detect deliveries → sound + ticker
  useEffect(() => {
    newDeliveryIds.forEach((id) => {
      if (!soundPlayed.current.has(id)) {
        soundPlayed.current.add(id)
        playCoinSound()

        const order = orders.find((o) => o.id === id)
        if (order) {
          setTickerEvents((prev) => [
            {
              id: `del-${id}`,
              text: `#${order.numero_pedido} entregado — +${formatGs(order.total)}`,
              emoji: '✅',
              ts: Date.now(),
            },
            ...prev,
          ].slice(0, 20))
        }
      }
    })
  }, [newDeliveryIds, orders])

  // Record breaker detection
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
    orders.forEach((o) => g[o.stage].push(o))
    return g
  }, [orders])

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
    <div className="h-full flex flex-col">
      {/* ─── Top Bar: Money counter + Combo + Rate ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-wrap gap-2">
        <MoneyCounter value={stats.todayRevenue} label="Facturado hoy" icon="💰" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Pedidos/hora</span>
              <span className="text-lg font-black text-gray-900">{pedidosHora}</span>
            </div>
          </div>
          <AnimatePresence mode="popLayout">
            {streak >= 2 && (
              <motion.div
                key="combo"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.36 }}
              >
                <ComboBadge streak={streak} lastOrderTime={lastOrderTime.current} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Next Target Progress ─── */}
      <AnimatePresence>
        {nextTarget && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
            className="px-4 py-1.5 bg-amber-50/60 border-b border-amber-100/80 overflow-hidden"
          >
            <NextTargetBar target={nextTarget} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Record Banner ─── */}
      {record && (
        <div className="px-4 pt-2">
          <RecordBanner text={record} />
        </div>
      )}

      {/* ─── Kanban Columns ─── */}
      <LayoutGroup>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 overflow-hidden">
          {KITCHEN_STAGES.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              orders={groups[stage]}
              hasNewDelivery={hasNewDeliveryInStage(stage)}
              hasNewOrder={newOrderStages.has(stage)}
              onConfettiDone={() => handleConfettiDone(stage)}
              onOrderClick={handleOrderClick}
            />
          ))}
        </div>
      </LayoutGroup>

      {/* ─── Activity Ticker ─── */}
      <div className="px-3 pb-3">
        <ActivityTicker events={tickerEvents} />
      </div>

      {/* ─── Order Detail Modal ─── */}
      <OrderDetailModal order={selectedOrder} onClose={handleModalClose} />
    </div>
  )
}
