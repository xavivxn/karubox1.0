'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  KITCHEN_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_EMOJIS,
  getOrderColor,
  type KitchenOrder,
  type KitchenStage,
} from '../utils/cocina.utils'

/* ═══════════════ TYPES ═══════════════ */

interface OrderItem {
  id: string
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  notas: string | null
}

interface OrderDetail {
  cliente_nombre: string | null
  usuario_nombre: string | null
}

/* ═══════════════ HELPERS ═══════════════ */

function formatGs(n: number) {
  return 'Gs. ' + n.toLocaleString('es-PY')
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatElapsed(ms: number) {
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `hace ${h}h ${m}m` : `hace ${h}h`
}

const TYPE_LABELS: Record<string, string> = {
  delivery: 'Delivery',
  local: 'Local',
  para_llevar: 'Para llevar',
}

const TYPE_ICONS: Record<string, string> = {
  delivery: '🛵',
  local: '🪑',
  para_llevar: '🛍️',
}

/* ═══════════════ SKELETON LOADER ═══════════════ */

function SkeletonLine({ width = 'full' }: { width?: string }) {
  return (
    <div className={`h-3 bg-gray-100 dark:bg-gray-600/80 rounded-full animate-pulse w-${width}`} />
  )
}

/* ═══════════════ MAIN MODAL ═══════════════ */

export default function OrderDetailModal({
  order,
  onClose,
  isAdmin,
  onStageChange,
}: {
  order: KitchenOrder | null
  onClose: () => void
  isAdmin?: boolean
  onStageChange?: (orderId: string, stage: KitchenStage) => void
}) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!order) {
      setItems([])
      setDetail(null)
      return
    }

    setLoading(true)
    setItems([])
    setDetail(null)

    const supabase = createClient()

    Promise.all([
      supabase
        .from('items_pedido')
        .select('id, producto_nombre, cantidad, precio_unitario, subtotal, notas')
        .eq('pedido_id', order.id)
        .order('id', { ascending: true }),
      supabase
        .from('pedidos')
        .select('clientes:cliente_id(nombre), usuarios:usuario_id(nombre)')
        .eq('id', order.id)
        .maybeSingle(),
    ]).then(([itemsRes, detailRes]) => {
      setItems((itemsRes.data ?? []) as OrderItem[])

      const row = detailRes.data as Record<string, unknown> | null
      setDetail({
        cliente_nombre:
          (row?.clientes as { nombre: string | null } | null)?.nombre ?? null,
        usuario_nombre:
          (row?.usuarios as { nombre: string | null } | null)?.nombre ?? null,
      })
      setLoading(false)
    })
  }, [order?.id])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const stageColor = order ? STAGE_COLORS[order.stage] : '#999'
  const typeColor = order ? getOrderColor(order.tipo) : '#999'

  return (
    <AnimatePresence>
      {order && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="fixed right-0 z-50 w-full max-w-[90vw] sm:max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0.18, duration: 0.42 }}
            style={{
              top: 'env(safe-area-inset-top, 0px)',
              bottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* ── Header ── */}
            <div
              className="px-5 pt-5 pb-4 border-b flex items-start justify-between"
              style={{ borderColor: `${stageColor}30` }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    #{order.numero_pedido}
                  </span>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white flex items-center gap-1"
                    style={{ backgroundColor: typeColor }}
                  >
                    <span>{TYPE_ICONS[order.tipo] ?? '📋'}</span>
                    <span>{TYPE_LABELS[order.tipo] ?? order.tipo}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-300">
                  {formatTime(order.created_at)} · {formatElapsed(order.elapsed)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/60 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* ── Stage pill ── */}
            <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800/70 flex items-center gap-2">
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full text-white flex items-center gap-1.5"
                style={{ backgroundColor: stageColor }}
              >
                <span>{STAGE_EMOJIS[order.stage]}</span>
                <span>{STAGE_LABELS[order.stage]}</span>
              </span>

              {order.stage !== 'entregado' && (
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(order.progress * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ backgroundColor: stageColor }}
                  />
                </div>
              )}
            </div>

            {/* ── Client / Cashier ── */}
            <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800/70 space-y-1.5">
              {loading ? (
                <>
                  <SkeletonLine width="2/3" />
                  <SkeletonLine width="1/2" />
                </>
              ) : (
                <>
                  {detail?.cliente_nombre ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-200">
                      <span>👤</span>
                      <span className="font-semibold">{detail.cliente_nombre}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-300 dark:text-gray-400">
                      <span>👤</span>
                      <span>Sin cliente registrado</span>
                    </div>
                  )}
                  {detail?.usuario_nombre && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-300">
                      <span>👨‍💼</span>
                      <span>Cajero: {detail.usuario_nombre}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Items list ── */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-300 mb-3">
                📋 Ítems del pedido
              </p>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1.5">
                      <SkeletonLine width="3/4" />
                      <SkeletonLine width="1/3" />
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-gray-300 dark:text-gray-400 italic text-center py-6">
                  Sin ítems registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.22 }}
                      className="bg-gray-50 dark:bg-gray-800/40 rounded-xl px-3.5 py-2.5 border border-gray-50/60 dark:border-gray-700/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span
                            className="text-xs font-black flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: stageColor, fontSize: '10px' }}
                          >
                            {item.cantidad}
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {item.producto_nombre}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-green-600 dark:text-emerald-400 flex-shrink-0 whitespace-nowrap">
                          {formatGs(item.subtotal)}
                        </span>
                      </div>
                      {item.notas && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-300 mt-1 ml-7 italic">
                          {item.notas}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Admin: mover etapa ── */}
            {isAdmin && onStageChange && (
              <div
                className="px-5 py-3 border-t border-gray-50 dark:border-gray-800/70"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-300 mb-2">
                  🔧 Mover etapa (admin)
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {KITCHEN_STAGES.map((s) => {
                    const isActive = order.stage === s
                    return (
                      <button
                        key={s}
                        onClick={() => onStageChange(order.id, s)}
                        disabled={isActive}
                        className={`
                          flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center
                          transition-all duration-150 text-[10px] font-bold border-2
                          ${isActive
                            ? 'text-white border-transparent scale-[1.04] shadow-md'
                            : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600 hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-gray-200 dark:hover:bg-gray-800/40'
                          }
                        `}
                        style={isActive ? { backgroundColor: STAGE_COLORS[s], borderColor: STAGE_COLORS[s] } : {}}
                      >
                        <span className="text-base">{STAGE_EMOJIS[s]}</span>
                        <span className="leading-tight">{STAGE_LABELS[s]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Total footer ── */}
            <div
              className="px-5 py-4 border-t"
              style={{ borderColor: `${stageColor}30` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-300">Total</span>
                <motion.span
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
                  className="text-xl font-black text-gray-900 dark:text-gray-100"
                >
                  {formatGs(order.total)}
                </motion.span>
              </div>
              {order.stage === 'entregado' && (
                <p className="text-[11px] text-green-500 dark:text-emerald-400 font-semibold mt-1 text-right">
                  ✅ Pedido entregado
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
