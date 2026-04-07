'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { formatGuaranies } from '@/lib/utils/format'
import type { TrendBucketItem, TrendGranularity } from '../types/admin.types'

type MetricMode = 'revenue' | 'orders' | 'avgTicket'

interface RevenueBarTrendChartProps {
  data: TrendBucketItem[]
  metricMode: MetricMode
  granularity?: TrendGranularity
  animationKey?: string
  isDark?: boolean
  fillContainer?: boolean
}

const H_FIXED = 288
const PAD = { top: 14, right: 12, bottom: 48, left: 56 }

const metricCopy: Record<MetricMode, { title: string; axis: string }> = {
  revenue: { title: 'Ingresos', axis: 'Guaraníes (Gs)' },
  orders: { title: 'Pedidos', axis: 'Cantidad de pedidos' },
  avgTicket: { title: 'Ticket medio', axis: 'Ticket promedio (Gs)' },
}

function formatMetricValue(mode: MetricMode, value: number): string {
  if (mode === 'orders') return `${Math.round(value)}`
  return formatGuaranies(value)
}

function formatAxisValue(mode: MetricMode, value: number): string {
  if (mode === 'orders') return String(Math.round(value))
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(Math.round(value))
}

export function RevenueBarTrendChart({
  data,
  metricMode,
  granularity = 'day',
  animationKey,
  isDark = false,
  fillContainer = false,
}: RevenueBarTrendChartProps) {
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)
  const [chartH, setChartH] = useState(H_FIXED)
  const [tip, setTip] = useState<{ x: number; y: number; item: TrendBucketItem; index: number } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!fillContainer) {
      setChartH(H_FIXED)
      return
    }
    const el = areaRef.current
    if (!el) return
    const apply = () => {
      const h = el.clientHeight
      if (h > 0) setChartH(Math.max(160, Math.floor(h)))
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fillContainer])

  const values = useMemo(
    () =>
      data.map((item) =>
        metricMode === 'revenue' ? item.revenue : metricMode === 'orders' ? item.orders : item.avgTicket
      ),
    [data, metricMode]
  )

  const { maxV, ticks } = useMemo(() => {
    if (values.length === 0) return { maxV: 1, ticks: [0, 1] }
    const rawMax = Math.max(1, ...values)
    const upper = rawMax * 1.12
    const step = upper / 4
    return { maxV: upper, ticks: [0, step, step * 2, step * 3, step * 4] }
  }, [values])

  const plotW = Math.max(width, 320)
  const plotH = fillContainer ? chartH : H_FIXED
  const innerW = Math.max(1, plotW - PAD.left - PAD.right)
  const innerH = Math.max(1, plotH - PAD.top - PAD.bottom)
  const slotW = innerW / Math.max(data.length, 1)
  const barW = Math.min(28, Math.max(6, slotW * 0.56))

  const yScale = (value: number) => PAD.top + innerH - (value / maxV) * innerH

  if (!data.length) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-10 ${
          fillContainer ? 'min-h-0 flex-1' : 'min-h-[280px]'
        } ${
          isDark
            ? 'border-slate-700/60 bg-slate-900/30 text-slate-400'
            : 'border-slate-200/90 bg-gradient-to-b from-violet-50/30 to-slate-50/50 text-slate-500'
        }`}
      >
        <p className="text-sm font-medium">No hay ventas en este período</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative w-full select-none ${fillContainer ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
      <div
        className={`shrink-0 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 ${
          isDark
            ? 'border-slate-700/50 bg-gradient-to-r from-orange-500/8 via-transparent to-violet-500/10'
            : 'border-slate-200/80 bg-gradient-to-r from-orange-50/90 via-white to-violet-50/70'
        }`}
      >
        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {metricCopy[metricMode].title}{' '}
          <span className={isDark ? 'text-teal-300' : 'text-teal-700'}>{metricCopy[metricMode].axis}</span>
        </span>
        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          {granularity === 'hour' ? 'Eje horizontal: hora del día' : 'Eje horizontal: día'}
        </span>
      </div>

      <div ref={areaRef} className={fillContainer ? 'min-h-0 flex-1' : undefined}>
        <svg
          key={`${animationKey ?? 'series'}-${metricMode}`}
          viewBox={`0 0 ${plotW} ${plotH}`}
          preserveAspectRatio="none"
          className={`block w-full overflow-visible ${fillContainer ? 'h-full min-h-[160px]' : 'h-[288px]'}`}
          onMouseLeave={() => setTip(null)}
        >
          {ticks.map((tick, idx) => {
            const y = yScale(tick)
            return (
              <g key={`grid-${idx}`}>
                <line x1={PAD.left} x2={plotW - PAD.right} y1={y} y2={y} stroke={isDark ? 'rgba(51, 65, 85, 0.42)' : '#eef2f7'} />
                <text
                  x={PAD.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={isDark ? '#94a3b8' : '#64748b'}
                  style={{ fontSize: 10, fontFamily: 'system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatAxisValue(metricMode, tick)}
                </text>
              </g>
            )
          })}

          {data.map((item, index) => {
            const value = values[index] ?? 0
            const x = PAD.left + (index + 0.5) * slotW - barW / 2
            const y = yScale(value)
            const h = Math.max(2, PAD.top + innerH - y)
            return (
              <g
                key={`${item.timestamp}-${metricMode}`}
                className="cursor-crosshair"
                onMouseEnter={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, item, index })
                }}
                onMouseMove={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (!rect) return
                  setTip((prev) => (prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null))
                }}
              >
                <motion.rect
                  initial={reduceMotion ? false : { scaleY: 0.08, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 24, delay: index * 0.03 }}
                  style={{ transformOrigin: '50% 100%', transformBox: 'fill-box' }}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={Math.min(8, barW / 2)}
                  fill={isDark ? 'url(#barGradDark)' : 'url(#barGradLight)'}
                  stroke={isDark ? 'rgba(251,146,60,0.65)' : 'rgba(249,115,22,0.75)'}
                />
              </g>
            )
          })}

          <defs>
            <linearGradient id="barGradLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="barGradDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {data.map((d, i) => {
            if (data.length > 16 && i % Math.ceil(data.length / 12) !== 0) return null
            const cx = PAD.left + (i + 0.5) * slotW
            return (
              <text
                key={`x-${d.timestamp}`}
                x={cx}
                y={plotH - 14}
                textAnchor="middle"
                fill={isDark ? '#a5b4c9' : '#3f4f63'}
                style={{ fontSize: 9, fontFamily: 'system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}
              >
                {d.label.length > 10 ? `${d.label.slice(0, 9)}…` : d.label}
              </text>
            )
          })}
        </svg>
      </div>

      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            className={`pointer-events-none absolute z-20 min-w-[196px] rounded-2xl border px-3 py-2.5 shadow-xl backdrop-blur-md ${
              isDark
                ? 'border-orange-500/25 bg-slate-900/95 text-slate-100 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)]'
                : 'border-orange-200/80 bg-white/98 text-slate-800 shadow-lg shadow-orange-200/35'
            }`}
            style={{ left: Math.min(Math.max(tip.x + 12, 8), plotW - 208), top: Math.max(tip.y - 136, 8) }}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
              {tip.item.label}
            </p>
            <div className="mt-2 space-y-1.5 text-[11px] leading-snug">
              <div className="flex justify-between gap-4">
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Ingresos</span>
                <span className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>{formatGuaranies(tip.item.revenue)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Pedidos</span>
                <span>{tip.item.orders}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Ticket medio</span>
                <span>{formatGuaranies(tip.item.avgTicket)}</span>
              </div>
              <div className={`flex justify-between gap-4 border-t pt-1.5 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Variación vs anterior</span>
                <span
                  className={
                    tip.index > 0 && values[tip.index] >= values[tip.index - 1]
                      ? isDark
                        ? 'text-emerald-300'
                        : 'text-emerald-700'
                      : isDark
                        ? 'text-rose-300'
                        : 'text-rose-700'
                  }
                >
                  {tip.index === 0
                    ? 'N/A'
                    : `${values[tip.index - 1] === 0 ? 0 : Math.round(((values[tip.index] - values[tip.index - 1]) / values[tip.index - 1]) * 100)}%`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
