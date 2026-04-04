'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { formatGuaranies } from '@/lib/utils/format'
import type { CandlestickTrendItem, TrendGranularity } from '../types/admin.types'

interface RevenueCandlestickChartProps {
  data: CandlestickTrendItem[]
  animationKey?: string
  granularity?: TrendGranularity
  isDark?: boolean
  /** Ajusta altura al contenedor flex (p. ej. modal a pantalla completa) */
  fillContainer?: boolean
}

const H_FIXED = 288
const PAD = { top: 12, right: 10, bottom: 48, left: 56 }

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(Math.round(value))
}

export function RevenueCandlestickChart({
  data,
  animationKey,
  granularity = 'day',
  isDark = false,
  fillContainer = false,
}: RevenueCandlestickChartProps) {
  const reduceMotion = useReducedMotion()
  const gid = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(400)
  const [chartH, setChartH] = useState(H_FIXED)
  const [tip, setTip] = useState<{ x: number; y: number; item: CandlestickTrendItem } | null>(null)

  const palette = useMemo(
    () =>
      isDark
        ? {
            grid: 'rgba(51, 65, 85, 0.42)',
            gridBase: 'rgba(71, 85, 105, 0.58)',
            axis: '#94a3b8',
            axisX: '#a5b4c9',
            bullStroke: '#fdba74',
            bearStroke: '#f9a8d4',
            wickBull: '#fde047',
            wickBear: '#fbcfe8',
          }
        : {
            grid: '#eef2f7',
            gridBase: '#dce3ed',
            axis: '#64748b',
            axisX: '#3f4f63',
            bullStroke: '#f97316',
            bearStroke: '#e11d48',
            wickBull: '#fbbf24',
            wickBear: '#f472b6',
          },
    [isDark]
  )

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
    const el = chartAreaRef.current
    if (!el) return
    const apply = () => {
      const h = el.clientHeight
      if (h > 0) setChartH(Math.max(160, Math.floor(h)))
    }
    apply()
    const ro = new ResizeObserver(() => apply())
    ro.observe(el)
    return () => ro.disconnect()
  }, [fillContainer])

  const { minV, maxV, ticks } = useMemo(() => {
    if (data.length === 0) {
      return { minV: 0, maxV: 1, ticks: [0, 1] }
    }
    const lows = data.map((d) => d.low)
    const highs = data.map((d) => d.high)
    let lo = Math.min(0, ...lows)
    let hi = Math.max(1, ...highs)
    if (hi === lo) hi = lo + 1
    const pad = (hi - lo) * 0.08
    lo = Math.max(0, lo - pad)
    hi = hi + pad
    const step = (hi - lo) / 4
    const t: number[] = []
    for (let i = 0; i <= 4; i++) t.push(lo + step * i)
    return { minV: lo, maxV: hi, ticks: t }
  }, [data])

  const plotW = Math.max(width, 320)
  const plotHeight = fillContainer ? chartH : H_FIXED
  const innerW = Math.max(1, plotW - PAD.left - PAD.right)
  const innerH = Math.max(1, plotHeight - PAD.top - PAD.bottom)

  const yScale = useCallback(
    (v: number) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH,
    [minV, maxV, innerH]
  )

  const n = Math.max(data.length, 1)
  const slotW = innerW / n

  const stagger = useMemo(() => Math.min(0.045, 0.65 / Math.max(data.length, 1)), [data.length])

  const wickEase = [0.22, 1, 0.36, 1] as [number, number, number, number]

  if (data.length === 0) {
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
        <p className="max-w-sm text-center text-xs opacity-90">Probá otro rango de fechas arriba o esperá a que ingresen pedidos.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none ${fillContainer ? 'flex min-h-0 flex-1 flex-col' : ''}`}
    >
      {/* Encabezado del gráfico: qué mide el eje */}
      <div
        className={`shrink-0 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 ${
          isDark
            ? 'border-slate-700/50 bg-gradient-to-r from-orange-500/8 via-transparent to-violet-500/10'
            : 'border-slate-200/80 bg-gradient-to-r from-orange-50/90 via-white to-violet-50/70'
        }`}
      >
        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          Montos en{' '}
          <span
            className={
              isDark
                ? 'bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-teal-600 to-emerald-700 bg-clip-text text-transparent'
            }
          >
            guaraníes (Gs)
          </span>
        </span>
        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          {granularity === 'hour' ? 'Eje horizontal: hora del día' : 'Eje horizontal: día'}
        </span>
      </div>

      <div
        ref={chartAreaRef}
        className={fillContainer ? 'min-h-0 flex-1' : undefined}
      >
      <svg
        key={animationKey}
        viewBox={`0 0 ${plotW} ${plotHeight}`}
        preserveAspectRatio="none"
        className={`block w-full overflow-visible ${fillContainer ? 'h-full min-h-[160px]' : 'h-[288px]'}`}
        onMouseLeave={() => setTip(null)}
      >
        <defs>
          <linearGradient id={`bull-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#fef08a' : '#ffedd5'} stopOpacity={isDark ? 0.62 : 0.98} />
            <stop offset="45%" stopColor={isDark ? '#fb923c' : '#fb923c'} stopOpacity={isDark ? 0.52 : 0.9} />
            <stop offset="100%" stopColor={isDark ? '#ea580c' : '#ea580c'} stopOpacity={isDark ? 0.48 : 0.82} />
          </linearGradient>
          <linearGradient id={`bear-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#fce7f3' : '#fdf2f8'} stopOpacity={isDark ? 0.58 : 0.95} />
            <stop offset="100%" stopColor={isDark ? '#e11d48' : '#db2777'} stopOpacity={isDark ? 0.52 : 0.82} />
          </linearGradient>
        </defs>

        {/* Etiqueta eje Y */}
        <text
          x={14}
          y={PAD.top + innerH / 2}
          fill={palette.axis}
          fontSize={10}
          fontWeight={600}
          fontFamily="system-ui, sans-serif"
          transform={`rotate(-90, 14, ${PAD.top + innerH / 2})`}
          textAnchor="middle"
        >
          Guaraníes ↑
        </text>

        {ticks.map((t, ti) => {
          const y = yScale(t)
          return (
            <g key={`g-${ti}-${t}`}>
              <line
                x1={PAD.left}
                x2={plotW - PAD.right}
                y1={y}
                y2={y}
                stroke={palette.grid}
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                fill={palette.axis}
                style={{ fontSize: 10, fontFamily: 'system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}
              >
                {formatAxisValue(t)}
              </text>
            </g>
          )
        })}

        <line
          x1={PAD.left}
          x2={plotW - PAD.right}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke={palette.gridBase}
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const cx = PAD.left + (i + 0.5) * slotW
          const bodyW = Math.min(12, Math.max(3, slotW * 0.5))
          const yH = yScale(d.high)
          const yL = yScale(d.low)
          const yO = yScale(d.open)
          const yC = yScale(d.close)
          const topBody = Math.min(yO, yC)
          const botBody = Math.max(yO, yC)
          const bull = d.close >= d.open
          const fill = bull ? `url(#bull-${gid})` : `url(#bear-${gid})`
          const rawH = botBody - topBody
          const hBody = Math.max(rawH, d.open === d.close ? 2 : 0.75)
          const stroke = bull ? palette.bullStroke : palette.bearStroke
          const wick = bull ? palette.wickBull : palette.wickBear

          return (
            <g
              key={`${animationKey}-${i}`}
              className="cursor-crosshair"
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect()
                if (!rect) return
                setTip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  item: d,
                })
              }}
              onMouseMove={(e) => {
                const rect = containerRef.current?.getBoundingClientRect()
                if (!rect) return
                setTip((prev) =>
                  prev
                    ? {
                        ...prev,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      }
                    : null
                )
              }}
            >
              <motion.line
                key={`wick-${animationKey}-${i}`}
                initial={reduceMotion ? false : { y1: yL, y2: yL, opacity: 0 }}
                animate={{ y1: yH, y2: yL, opacity: 0.98 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        y1: { duration: 0.5, ease: wickEase, delay: i * stagger },
                        y2: { duration: 0.5, ease: wickEase, delay: i * stagger },
                        opacity: { duration: 0.2, delay: i * stagger },
                      }
                }
                x1={cx}
                x2={cx}
                stroke={wick}
                strokeWidth={1.55}
                strokeLinecap="round"
              />
              <motion.rect
                key={`body-${animationKey}-${i}`}
                style={{ transformOrigin: '50% 100%', transformBox: 'fill-box' }}
                initial={reduceMotion ? false : { scaleY: 0.06, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness: 420,
                        damping: 26,
                        mass: 0.82,
                        delay: i * stagger,
                      }
                }
                x={cx - bodyW / 2}
                y={topBody}
                width={bodyW}
                height={hBody}
                rx={2.5}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
                strokeOpacity={0.95}
              />
            </g>
          )
        })}

        {data.map((d, i) => {
          if (data.length > 16 && i % Math.ceil(data.length / 12) !== 0) return null
          const cx = PAD.left + (i + 0.5) * slotW
          return (
            <text
              key={`x-${i}`}
              x={cx}
              y={plotHeight - 14}
              textAnchor="middle"
              fill={palette.axisX}
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
            className={`pointer-events-none absolute z-20 min-w-[176px] rounded-2xl border px-3 py-2.5 shadow-xl backdrop-blur-md ${
              isDark
                ? 'border-orange-500/25 bg-slate-900/95 text-slate-100 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55),0_0_0_1px_rgba(251,146,60,0.12)]'
                : 'border-orange-200/80 bg-white/98 text-slate-800 shadow-lg shadow-orange-200/35 shadow-violet-200/25'
            }`}
            style={{
              left: Math.min(Math.max(tip.x + 12, 8), plotW - 188),
              top: Math.max(tip.y - 128, 8),
            }}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
              {tip.item.label}
            </p>
            <div className="mt-2 space-y-1.5 text-[11px] leading-snug">
              <div className="flex justify-between gap-4">
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Total vendido</span>
                <span className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                  {formatGuaranies(tip.item.volume)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Primer pedido</span>
                <span className={isDark ? 'text-violet-300' : 'text-violet-700'}>{formatGuaranies(tip.item.open)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Ticket más alto</span>
                <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>{formatGuaranies(tip.item.high)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Ticket más bajo</span>
                <span className={isDark ? 'text-sky-300' : 'text-sky-700'}>{formatGuaranies(tip.item.low)}</span>
              </div>
              <div
                className={`flex justify-between gap-4 border-t pt-1.5 ${
                  isDark ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>Último pedido</span>
                <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {formatGuaranies(tip.item.close)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`shrink-0 flex flex-col gap-2 border-t px-2 py-2.5 sm:flex-row sm:items-center sm:justify-between ${
          isDark
            ? 'border-slate-700/60 bg-gradient-to-r from-orange-500/6 via-slate-900/30 to-violet-500/8'
            : 'border-slate-200/90 bg-gradient-to-r from-orange-50/70 via-amber-50/30 to-violet-50/65'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Resumen visual
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm ${
              isDark
                ? 'bg-orange-500/24 text-orange-100 shadow-orange-900/30 ring-1 ring-orange-400/25'
                : 'bg-orange-100 text-orange-950 shadow-orange-200/50 ring-1 ring-orange-300/50'
            }`}
          >
            {granularity === 'hour' ? 'Una barra = 1 hora' : 'Una barra = 1 día'}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm ${
              isDark
                ? 'bg-violet-500/24 text-violet-100 shadow-violet-900/30 ring-1 ring-violet-400/25'
                : 'bg-violet-100 text-violet-950 shadow-violet-200/45 ring-1 ring-violet-300/45'
            }`}
          >
            Altura ≈ cuánto se movieron los montos
          </span>
        </div>
        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Colores: caliente = mejor cierre · frío/rosa = menor cierre
        </span>
      </div>
    </div>
  )
}
