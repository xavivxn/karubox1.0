'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Activity, CandlestickChart, ChartColumnIncreasing, Hand, History, Info, Loader2, Maximize2, Minimize2, Sparkles } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import { RevenueCandlestickChart } from './RevenueCandlestickChart'
import { RevenueBarTrendChart } from './RevenueBarTrendChart'
import { DatePresetPills } from './DatePresetPills'
import type { AdminDatePreset, DashboardStats } from '../types/admin.types'

interface WeeklyTrendProps {
  stats: DashboardStats
  animationKey?: string
  selectedPreset: AdminDatePreset
  onPresetChange: (preset: AdminDatePreset) => void
  isRefreshing?: boolean
  darkMode?: boolean
  /** Sin caja abierta: métricas del último turno cerrado */
  datosUltimoTurno?: boolean
}

export const WeeklyTrend = ({
  stats,
  animationKey,
  selectedPreset,
  onPresetChange,
  isRefreshing = false,
  darkMode = false,
  datosUltimoTurno = false,
}: WeeklyTrendProps) => {
  const [expanded, setExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple')
  const [metricMode, setMetricMode] = useState<'revenue' | 'orders' | 'avgTicket'>('revenue')

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [expanded])

  const granularity = stats.trendGranularity ?? 'day'
  const candles = stats.candleTrend ?? []
  const trendBuckets = stats.trendBuckets ?? []
  const metricValues = useMemo(
    () =>
      trendBuckets.map((bucket) =>
        metricMode === 'revenue' ? bucket.revenue : metricMode === 'orders' ? bucket.orders : bucket.avgTicket
      ),
    [trendBuckets, metricMode]
  )
  const seriesTotal = useMemo(() => metricValues.reduce((sum, value) => sum + value, 0), [metricValues])
  const peakInsight = useMemo(() => {
    if (!trendBuckets.length) return null
    const best = trendBuckets.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev), trendBuckets[0])
    return { label: best.label, revenue: best.revenue }
  }, [trendBuckets])
  const bestTicketInsight = useMemo(() => {
    if (!trendBuckets.length) return null
    const best = trendBuckets.reduce((prev, curr) => (curr.avgTicket > prev.avgTicket ? curr : prev), trendBuckets[0])
    return { label: best.label, avgTicket: best.avgTicket }
  }, [trendBuckets])

  const { title, explainer } = useMemo(() => {
    if (viewMode === 'simple') {
      const metricTitle =
        metricMode === 'revenue'
          ? 'Ingresos por bloque'
          : metricMode === 'orders'
            ? 'Pedidos por bloque'
            : 'Ticket medio por bloque'
      return {
        title: metricTitle,
        explainer:
          'Lectura rápida del período: barras más altas representan mejor desempeño del bloque. Pasá el mouse para ver ingresos, pedidos, ticket medio y variación frente al bloque anterior.',
      }
    }
    if (granularity === 'hour') {
      return {
        title: 'Por horas del día',
        explainer:
          'Cada barra es una hora: el color naranja indica que el último pedido fue más alto que el primero; el rosa, lo contrario. La línea vertical muestra el rango entre el ticket más chico y el más grande de esa hora.',
      }
    }
    return {
      title: 'Por días',
      explainer:
        'Cada barra es un día completo: comparás volumen total y cómo se movieron los montos de los pedidos. Pasá el cursor sobre una barra para ver números exactos.',
    }
  }, [granularity, metricMode, viewMode])

  const shellClasses = `
        overflow-hidden rounded-3xl border-2 shadow-sm backdrop-blur-sm
        transition-[border-color,box-shadow,ring-color] duration-300
        dark:shadow-[0_12px_48px_-16px_rgba(0,0,0,0.55)]
        ${darkMode
          ? 'border-slate-500/85 bg-slate-900/70 ring-2 ring-orange-500/35 shadow-[0_8px_44px_-14px_rgba(251,146,60,0.14),0_0_0_1px_rgba(251,146,60,0.12)]'
          : 'border-slate-300/95 bg-white/95 ring-2 ring-orange-400/45 shadow-slate-200/80 shadow-[0_10px_44px_-12px_rgba(251,146,60,0.22),0_0_0_1px_rgba(251,146,60,0.14)]'
        }
      `

  const toggleExpand = () => setExpanded((v) => !v)

  /** Padding del overlay expandido: respeta notch / home indicator / bordes curvos */
  const expandedOverlayPadding = {
    paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
    paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
    paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
  } as const

  const panelBody = (
    <div
      className={`relative flex flex-col ${expanded ? 'h-full min-h-0 flex-1 overflow-hidden' : ''} ${shellClasses}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal={expanded}
      aria-label={expanded ? 'Ingresos — vista expandida' : undefined}
    >
      {/* Brillo ambiental suave (refuerzo dopaminérgico) */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-[0.14] motion-safe:animate-[pulse_5s_ease-in-out_infinite] ${
          darkMode
            ? 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(251,146,60,0.35),transparent_55%)]'
            : 'bg-[radial-gradient(ellipse_85%_55%_at_50%_-5%,rgba(251,146,60,0.2),transparent_55%)]'
        }`}
        aria-hidden
      />
      {/* Orbes de color */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl ${
          darkMode ? 'bg-orange-500/15' : 'bg-orange-200/85'
        }`}
      />
      <div
        className={`pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full blur-3xl ${
          darkMode ? 'bg-violet-500/13' : 'bg-amber-200/60'
        }`}
      />
      <div
        className={`pointer-events-none absolute right-1/3 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full blur-3xl ${
          darkMode ? 'bg-teal-500/11' : 'bg-teal-200/45'
        }`}
      />

      <div
        className={`relative border-b px-5 py-4 ${expanded ? 'shrink-0' : ''} ${darkMode ? 'border-slate-700/60' : 'border-slate-200/80'}`}
      >
        <button
          type="button"
          onClick={toggleExpand}
          className={`absolute right-3 top-3 z-20 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
            darkMode
              ? 'border-slate-600 bg-slate-800/90 text-slate-100 hover:bg-slate-800'
              : 'border-slate-200 bg-white/95 text-slate-800 hover:bg-slate-50'
          }`}
          aria-pressed={expanded}
          aria-label={expanded ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
        >
          {expanded ? (
            <Minimize2 className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
          ) : (
            <Maximize2 className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
          )}
        </button>
        <div className="flex flex-col gap-4 pr-10 sm:flex-row sm:items-start sm:justify-between sm:pr-11">
          <div className="flex min-w-0 flex-1 gap-3">
            <motion.div
              animate={isRefreshing ? { rotate: [0, 5, -5, 0] } : { scale: [1, 1.04, 1] }}
              transition={
                isRefreshing
                  ? { duration: 0.55, repeat: Infinity, repeatDelay: 0.85 }
                  : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
              }
              whileHover={{ scale: 1.06 }}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                darkMode
                  ? 'bg-gradient-to-br from-orange-500/30 to-amber-500/14 ring-1 ring-orange-400/40 shadow-[0_0_24px_-4px_rgba(251,146,60,0.35)]'
                  : 'bg-gradient-to-br from-orange-100 to-amber-50 ring-1 ring-orange-300/90 shadow-md shadow-orange-200/50'
              }`}
            >
              <Activity className={`h-5 w-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} aria-hidden />
            </motion.div>
            <div className="min-w-0">
              <p
                className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                  darkMode ? 'text-orange-400/95' : 'text-orange-600/90'
                }`}
              >
                <motion.span
                  animate={{ rotate: [0, 8, -4, 0], scale: [1, 1.12, 1] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <Sparkles className={`h-3 w-3 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} aria-hidden />
                </motion.span>
                Ingresos
              </p>
              <h2
                className={`text-xl font-semibold tracking-tight ${
                  darkMode
                    ? 'bg-gradient-to-r from-white via-orange-100/95 to-violet-200/90 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-slate-900 via-orange-700 to-violet-700 bg-clip-text text-transparent'
                }`}
              >
                ¿Cómo vienen las ventas?
              </h2>
              {datosUltimoTurno && (
                <p
                  className={`mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium ${
                    darkMode
                      ? 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30'
                      : 'bg-amber-50 text-amber-950 ring-1 ring-amber-200/90'
                  }`}
                >
                  <History className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  Datos del último turno cerrado (no hay turno abierto)
                </p>
              )}
              <p
                className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${datosUltimoTurno ? 'mt-2' : 'mt-0.5'}`}
              >
                {stats.trendContextLabel ?? 'Período seleccionado'}
              </p>
              <p
                className={`mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${
                  darkMode
                    ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25'
                    : 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80'
                }`}
              >
                <span className="opacity-90">{title}</span>
              </p>
            </div>
          </div>
          <motion.div
            key={seriesTotal}
            initial={{ scale: 0.98, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className={`shrink-0 rounded-2xl border px-4 py-3 text-right ${
              darkMode
                ? 'border-orange-500/35 bg-gradient-to-br from-slate-800/90 via-orange-950/20 to-violet-950/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'border-orange-300/80 bg-gradient-to-br from-orange-50 via-amber-50/80 to-white shadow-md shadow-orange-200/40'
            }`}
          >
            <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {metricMode === 'revenue'
                ? 'Suma del período elegido'
                : metricMode === 'orders'
                  ? 'Pedidos acumulados del período'
                  : 'Suma de tickets promedio por bloque'}
            </p>
            <p
              className={`text-lg font-semibold tabular-nums tracking-tight ${
                darkMode ? 'text-orange-50' : 'text-orange-700'
              }`}
            >
              {metricMode === 'revenue'
                ? formatGuaranies(seriesTotal)
                : metricMode === 'orders'
                  ? `${Math.round(seriesTotal)} pedidos`
                  : formatGuaranies(seriesTotal)}
            </p>
            <p className={`mt-1 text-[10px] ${darkMode ? 'text-teal-400/90' : 'text-teal-700/90'}`}>
              {metricMode === 'revenue'
                ? 'Guaraníes · todos los pedidos del filtro'
                : metricMode === 'orders'
                  ? 'Cantidad total de pedidos del filtro'
                  : 'Suma de ticket medio en cada bloque del filtro'}
            </p>
          </motion.div>
        </div>

        {/* Ayuda en una frase */}
        <div
          className={`mt-4 flex gap-2 rounded-2xl border px-3 py-2.5 ${
            darkMode
              ? 'border-sky-500/20 bg-slate-800/50 text-slate-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.12)]'
              : 'border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white to-violet-50/40 text-slate-700 shadow-sm shadow-sky-100/60'
          }`}
        >
          <Info className={`mt-0.5 h-4 w-4 shrink-0 ${darkMode ? 'text-sky-400' : 'text-sky-600'}`} aria-hidden />
          <p className="text-[12px] leading-snug">{explainer}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Modo visual
          </span>
          <button
            type="button"
            onClick={() => setViewMode('simple')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${
              viewMode === 'simple'
                ? darkMode
                  ? 'border-orange-400/65 bg-orange-500/22 text-orange-50'
                  : 'border-orange-300/90 bg-orange-50 text-orange-900'
                : darkMode
                  ? 'border-slate-600 bg-slate-800/70 text-slate-300'
                  : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <ChartColumnIncreasing className="h-3 w-3" aria-hidden />
            Simple
          </button>
          <button
            type="button"
            onClick={() => setViewMode('advanced')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${
              viewMode === 'advanced'
                ? darkMode
                  ? 'border-violet-400/65 bg-violet-500/18 text-violet-50'
                  : 'border-violet-300/90 bg-violet-50 text-violet-900'
                : darkMode
                  ? 'border-slate-600 bg-slate-800/70 text-slate-300'
                  : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <CandlestickChart className="h-3 w-3" aria-hidden />
            Avanzado
          </button>
          {viewMode === 'simple' && (
            <>
              <span className={`ml-1 text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Métrica
              </span>
              {[
                { key: 'revenue', label: 'Ingresos' },
                { key: 'orders', label: 'Pedidos' },
                { key: 'avgTicket', label: 'Ticket medio' },
              ].map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setMetricMode(mode.key as 'revenue' | 'orders' | 'avgTicket')}
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${
                    metricMode === mode.key
                      ? darkMode
                        ? 'border-teal-400/60 bg-teal-500/20 text-teal-50'
                        : 'border-teal-300/90 bg-teal-50 text-teal-900'
                      : darkMode
                        ? 'border-slate-600 bg-slate-800/70 text-slate-300'
                        : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {viewMode === 'advanced' ? (
            <>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Leyenda
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium shadow-sm ${
                  darkMode
                    ? 'border-orange-500/45 bg-orange-500/14 text-orange-100 shadow-orange-900/20'
                    : 'border-orange-300/90 bg-orange-50 text-orange-950 shadow-orange-200/50'
                }`}
              >
                <span className="h-2.5 w-2 rounded-sm bg-gradient-to-b from-amber-300 to-orange-600 shadow-[0_0_6px_rgba(251,146,60,0.55)]" aria-hidden />
                Mejor cierre que apertura
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium shadow-sm ${
                  darkMode
                    ? 'border-rose-500/45 bg-rose-500/14 text-rose-100 shadow-rose-900/25'
                    : 'border-rose-300/90 bg-rose-50 text-rose-950 shadow-rose-200/45'
                }`}
              >
                <span className="h-2.5 w-2 rounded-sm bg-gradient-to-b from-rose-300 to-rose-600 shadow-[0_0_6px_rgba(244,63,94,0.45)]" aria-hidden />
                Menor cierre que apertura
              </span>
            </>
          ) : (
            <>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium shadow-sm ${
                  darkMode
                    ? 'border-teal-500/40 bg-teal-500/14 text-teal-100 shadow-teal-900/20'
                    : 'border-teal-300/90 bg-teal-50 text-teal-950 shadow-teal-200/45'
                }`}
              >
                <Hand className="h-3 w-3 opacity-90" aria-hidden />
                Pasá el mouse sobre las barras
              </span>
              {peakInsight && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium shadow-sm ${
                    darkMode
                      ? 'border-amber-500/45 bg-amber-500/14 text-amber-100'
                      : 'border-amber-300/90 bg-amber-50 text-amber-900'
                  }`}
                >
                  Hora pico: {peakInsight.label} · {formatGuaranies(peakInsight.revenue)}
                </span>
              )}
              {bestTicketInsight && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium shadow-sm ${
                    darkMode
                      ? 'border-violet-500/45 bg-violet-500/14 text-violet-100'
                      : 'border-violet-300/90 bg-violet-50 text-violet-900'
                  }`}
                >
                  Mejor ticket: {bestTicketInsight.label} · {formatGuaranies(bestTicketInsight.avgTicket)}
                </span>
              )}
            </>
          )}
        </div>

        <div className="mt-4">
          <p className={`mb-2 text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Elegí el período
          </p>
          <DatePresetPills
            selected={selectedPreset}
            onChange={onPresetChange}
            layoutId="trendDatePill"
            className="snap-x snap-mandatory scroll-px-2"
            disabled={isRefreshing}
          />
        </div>
      </div>

      <div
        className={`relative flex flex-col p-4 sm:p-5 ${expanded ? 'min-h-0 flex-1' : ''}`}
      >
        <div
          className={`relative flex flex-col ${expanded ? 'min-h-0 flex-1' : 'min-h-[320px]'}`}
        >
          <div
            className={`relative flex flex-col overflow-hidden rounded-2xl border shadow-inner ${
              darkMode
                ? 'border-slate-600/70 bg-slate-950/50 ring-1 ring-teal-500/15 shadow-[inset_0_0_48px_-20px_rgba(20,184,166,0.12)]'
                : 'border-slate-200/90 bg-gradient-to-b from-slate-50/95 via-white to-violet-50/35 ring-1 ring-violet-200/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
            } ${expanded ? 'min-h-0 flex-1' : ''}`}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-tr from-orange-400/6 via-transparent to-violet-500/10`}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0.85, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                darkMode
                  ? 'bg-gradient-to-r from-teal-600/90 to-emerald-700/90 text-white shadow-lg shadow-teal-900/40 ring-1 ring-white/10'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-300/50 ring-1 ring-white/30'
              }`}
            >
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" aria-hidden />
              Interactivo
            </motion.div>
            {viewMode === 'simple' ? (
              <RevenueBarTrendChart
                data={trendBuckets}
                metricMode={metricMode}
                animationKey={animationKey}
                granularity={granularity}
                isDark={darkMode}
                fillContainer={expanded}
              />
            ) : (
              <RevenueCandlestickChart
                data={candles}
                animationKey={animationKey}
                granularity={granularity}
                isDark={darkMode}
                fillContainer={expanded}
              />
            )}
          </div>

          {isRefreshing && (
            <div
              className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl border backdrop-blur-md ${
                darkMode ? 'border-slate-600/40 bg-slate-950/75' : 'border-white/60 bg-white/85'
              }`}
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="relative">
                <div
                  className={`absolute inset-0 animate-ping rounded-full ${darkMode ? 'bg-orange-400/25' : 'bg-orange-300/40'}`}
                />
                <div
                  className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
                    darkMode
                      ? 'bg-gradient-to-br from-orange-500 to-violet-700 shadow-orange-900/30'
                      : 'bg-gradient-to-br from-orange-500 to-amber-400 shadow-orange-200/80'
                  }`}
                >
                  <Loader2 className="h-7 w-7 animate-spin text-white" aria-hidden />
                </div>
              </div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                Actualizando gráfico…
              </p>
              <p className={`max-w-xs text-center text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Un momento mientras cargamos los datos del período
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const expandedLayer =
    expanded &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] box-border flex h-full max-h-[100dvh] min-h-0 w-full flex-col overflow-hidden"
        style={expandedOverlayPadding}
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity dark:bg-black/60"
          onClick={() => setExpanded(false)}
          aria-label="Cerrar vista expandida"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="relative z-10 flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden shadow-2xl sm:mx-auto"
        >
          {panelBody}
        </motion.div>
      </div>,
      document.body
    )

  return (
    <Fragment>
      {expanded && (
        <div className="min-h-[min(380px,42vh)] xl:col-span-2" aria-hidden />
      )}
      {!expanded ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.1 }}
          className="xl:col-span-2 relative"
        >
          {panelBody}
        </motion.div>
      ) : (
        expandedLayer
      )}
    </Fragment>
  )
}
