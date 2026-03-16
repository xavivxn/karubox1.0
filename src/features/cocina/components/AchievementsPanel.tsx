'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import type { SesionCaja } from '@/features/caja/types/caja.types'
import { getHistorialSesionStatsAction, type SessionStats } from '@/app/actions/caja'
import {
  type Achievement,
  type AchievementStore,
  DAILY_ACHIEVEMENTS,
  GLOBAL_ACHIEVEMENTS,
  ALL_ACHIEVEMENTS,
  TIER_COLORS,
  TIER_LABELS,
  TIER_BG,
  getGlobalProgress,
} from '../utils/achievements'

/* ════════════════════════════════════════════
   SPARKLE POSITIONS — fixed per achievement id
════════════════════════════════════════════ */
function getSparkles(seed: string) {
  const positions = [
    { top: '12%', left: '8%', delay: '0s', size: 10 },
    { top: '20%', left: '80%', delay: '0.4s', size: 8 },
    { top: '55%', left: '90%', delay: '0.8s', size: 12 },
    { top: '75%', left: '15%', delay: '1.2s', size: 9 },
    { top: '85%', left: '60%', delay: '0.6s', size: 7 },
    { top: '40%', left: '5%', delay: '1.6s', size: 11 },
    { top: '65%', left: '45%', delay: '1.0s', size: 8 },
  ]
  const shift = seed.length % positions.length
  return [...positions.slice(shift), ...positions.slice(0, shift)]
}

/* ════════════════════════════════════════════
   DIAMOND HOLO CARD
════════════════════════════════════════════ */
function DiamondMedalCard({
  achievement,
  unlocked,
  unlockTime,
  onClick,
}: {
  achievement: Achievement
  unlocked: boolean
  unlockTime: number | null
  onClick: (a: Achievement) => void
}) {
  const sparkles = useMemo(() => getSparkles(achievement.id), [achievement.id])

  if (!unlocked) {
    return (
      <div className="relative rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-4 opacity-60 grayscale">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gray-200 dark:bg-gray-600">
            🔒
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-600">
            Diamante
          </span>
        </div>
        <h4 className="text-sm font-bold mb-0.5 text-gray-400 dark:text-gray-500">{achievement.name}</h4>
        <p className="text-xs text-gray-400 dark:text-gray-500">{achievement.description}</p>
      </div>
    )
  }

  return (
    <div
      className="relative rounded-2xl border-2 p-4 cursor-pointer overflow-hidden select-none group"
      style={{
        borderColor: 'transparent',
        background:
          'linear-gradient(#0f0c24, #0f0c24) padding-box, linear-gradient(135deg, #f43f5e, #a855f7, #3b82f6, #06b6d4, #10b981, #f59e0b, #f43f5e) border-box',
      }}
      onClick={() => onClick(achievement)}
      title="Ver trofeo"
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-25 animate-holo-gradient pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, #f43f5e 0%, #a855f7 16%, #3b82f6 33%, #06b6d4 50%, #10b981 66%, #f59e0b 83%, #f43f5e 100%)',
          backgroundSize: '300% 300%',
        }}
      />
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div
          className="absolute inset-0 animate-holo-sheen"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
            width: '60%',
            left: '20%',
          }}
        />
      </div>
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="absolute text-white animate-holo-pop pointer-events-none"
          style={{ top: s.top, left: s.left, animationDelay: s.delay, fontSize: `${s.size}px`, textShadow: '0 0 6px #fff, 0 0 12px #a78bfa', lineHeight: 1 }}
        >✦</span>
      ))}
      <div className="relative z-[1]">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(59,130,246,0.2))', boxShadow: '0 0 12px rgba(167,139,250,0.5)' }}>
            {achievement.emoji}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: 'linear-gradient(90deg, #a855f7, #3b82f6)', color: '#fff' }}>
            Diamante
          </span>
        </div>
        <h4 className="text-sm font-bold mb-0.5 text-white drop-shadow">{achievement.name}</h4>
        <p className="text-xs text-purple-200">{achievement.description}</p>
        {unlockTime && (
          <p className="mt-2 text-[10px] text-purple-300/70">
            {new Date(unlockTime).toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1"><span>✨</span> Ver trofeo</span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   STANDARD MEDAL CARD (bronze / silver / gold)
════════════════════════════════════════════ */
function MedalCard({
  achievement, unlocked, unlockTime, store, darkMode,
}: {
  achievement: Achievement
  unlocked: boolean
  unlockTime: number | null
  store: AchievementStore | null
  darkMode?: boolean
}) {
  const tierColor = TIER_COLORS[achievement.tier]
  const progress = store && achievement.type === 'global' ? getGlobalProgress(achievement, store) : null

  return (
    <div
      className={`relative rounded-2xl border-2 p-4 transition-all duration-300 ${
        unlocked ? `bg-gradient-to-br ${TIER_BG[achievement.tier]} animate-medal-shine-subtle`
          : darkMode ? 'bg-gray-700/50 border-gray-600 opacity-70 grayscale' : 'bg-gray-50 border-gray-200 opacity-60 grayscale'
      }`}
      style={unlocked ? { borderColor: tierColor } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${unlocked ? 'animate-tier-glow' : ''}`}
          style={{ background: unlocked ? `${tierColor}20` : darkMode ? '#4b5563' : '#e5e7eb', '--tier-color': tierColor } as React.CSSProperties}>
          {unlocked ? achievement.emoji : '🔒'}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ color: unlocked ? tierColor : '#9ca3af', background: unlocked ? `${tierColor}15` : darkMode ? '#374151' : '#f3f4f6' }}>
          {TIER_LABELS[achievement.tier]}
        </span>
      </div>
      <h4 className={`text-sm font-bold mb-0.5 ${unlocked ? (darkMode ? 'text-white' : 'text-gray-900') : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {achievement.name}
      </h4>
      <p className={`text-xs ${unlocked ? (darkMode ? 'text-gray-300' : 'text-gray-600') : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {achievement.description}
      </p>
      {progress && !unlocked && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{progress.current}/{progress.target}</span>
            <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{Math.round((progress.current / progress.target) * 100)}%</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.target) * 100}%`, backgroundColor: tierColor }} />
          </div>
        </div>
      )}
      {unlockTime && (
        <p className={`mt-2 text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {new Date(unlockTime).toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   HISTORIAL DE TURNOS
════════════════════════════════════════════ */
const TIER_ORDER: Record<string, number> = { diamond: 0, gold: 1, silver: 2, bronze: 3 }

function formatDuration(aperturaAt: string, cierreAt: string | null): string {
  const from = new Date(aperturaAt).getTime()
  const to = cierreAt ? new Date(cierreAt).getTime() : Date.now()
  const mins = Math.round((to - from) / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PY', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
}

const TIPO_LABELS: Record<string, string> = {
  local: 'Local',
  delivery: 'Delivery',
  para_llevar: 'Para llevar',
}
const TIPO_ICONS: Record<string, string> = {
  local: '🪑',
  delivery: '🛵',
  para_llevar: '🛍️',
}

function formatGs(n: number) {
  return 'Gs. ' + Math.round(n).toLocaleString('es-PY')
}

function StatMini({
  label,
  value,
  icon,
  darkMode,
  highlight,
}: {
  label: string
  value: string
  icon: string
  darkMode: boolean
  highlight?: 'green' | 'red'
}) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-xl px-3 py-2 ${
      darkMode ? 'bg-gray-600/60' : 'bg-white border border-gray-100'
    }`}>
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
        {icon} {label}
      </span>
      <span className={`text-sm font-black tabular-nums ${
        highlight === 'green'
          ? 'text-green-500'
          : highlight === 'red'
            ? 'text-red-500'
            : darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {value}
      </span>
    </div>
  )
}

function HistorialCardSkeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <div className={`space-y-3 pt-4 ${darkMode ? 'text-gray-500' : 'text-gray-300'}`}>
      {[1, 2, 3].map(i => (
        <div key={i} className={`h-12 rounded-xl animate-pulse ${darkMode ? 'bg-gray-600/50' : 'bg-gray-100'}`} />
      ))}
    </div>
  )
}

function HistorialCard({
  sesion,
  achievementIds,
  darkMode,
  tenantId,
}: {
  sesion: SesionCaja
  achievementIds: string[]
  darkMode: boolean
  tenantId: string | undefined
}) {
  const [expanded, setExpanded] = useState(false)
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const unlocked = useMemo(() => {
    const map = new Map(ALL_ACHIEVEMENTS.map(a => [a.id, a]))
    return achievementIds
      .map(id => map.get(id))
      .filter(Boolean)
      .sort((a, b) => (TIER_ORDER[a!.tier] ?? 9) - (TIER_ORDER[b!.tier] ?? 9)) as Achievement[]
  }, [achievementIds])

  const dailyCount = unlocked.filter(a => a.type === 'daily').length
  const globalCount = unlocked.filter(a => a.type === 'global').length
  const isOpen = !sesion.cierre_at

  const ticketPromedio =
    sesion.cantidad_pedidos > 0
      ? sesion.total_ventas / sesion.cantidad_pedidos
      : 0

  const handleExpand = useCallback(async () => {
    const next = !expanded
    setExpanded(next)
    if (next && !stats && !loadingStats && tenantId) {
      setLoadingStats(true)
      const res = await getHistorialSesionStatsAction(
        tenantId,
        sesion.apertura_at,
        sesion.cierre_at
      )
      if (res.success) setStats(res.data)
      setLoadingStats(false)
    }
  }, [expanded, stats, loadingStats, tenantId, sesion.apertura_at, sesion.cierre_at])

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
    } ${isOpen ? 'ring-2 ring-amber-400/60' : ''}`}>
      {/* ── Header row ── */}
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={handleExpand}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
          isOpen ? 'bg-amber-100 dark:bg-amber-900/40' : darkMode ? 'bg-gray-600' : 'bg-white border border-gray-200'
        }`}>
          {isOpen ? '🟡' : '✅'}
        </div>

        {/* Date + hours */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatDateShort(sesion.apertura_at)}
            </span>
            {isOpen && (
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                En curso
              </span>
            )}
          </div>
          <div className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatHour(sesion.apertura_at)}
            {sesion.cierre_at ? ` – ${formatHour(sesion.cierre_at)}` : ''}
            {' · '}
            {formatDuration(sesion.apertura_at, sesion.cierre_at)}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right flex-shrink-0">
          <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {sesion.cantidad_pedidos} pedidos
          </div>
          <div className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Gs. {(sesion.total_ventas ?? 0).toLocaleString('es-PY')}
          </div>
        </div>

        {/* Achievement count + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {unlocked.length > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 px-2 py-0.5 rounded-full">
              <span className="text-xs">🏅</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{unlocked.length}</span>
            </div>
          )}
          <span className={`text-xs transition-transform duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-400'} ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className={`border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>

          {/* ─ Financial summary ─ */}
          <div className="px-4 pt-4 pb-3">
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
              Resumen financiero
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <StatMini icon="💰" label="Ventas" value={formatGs(sesion.total_ventas ?? 0)} darkMode={darkMode} />
              <StatMini icon="🔧" label="Costo est." value={formatGs(sesion.total_costo_estimado ?? 0)} darkMode={darkMode} />
              <StatMini icon="👷" label="Empleados" value={formatGs(sesion.monto_pagado_empleados ?? 0)} darkMode={darkMode} />
              <StatMini
                icon="📈"
                label="Ganancia"
                value={formatGs(sesion.ganancia_neta ?? 0)}
                darkMode={darkMode}
                highlight={(sesion.ganancia_neta ?? 0) >= 0 ? 'green' : 'red'}
              />
              <StatMini
                icon="🎯"
                label="Ticket prom."
                value={sesion.cantidad_pedidos > 0 ? formatGs(ticketPromedio) : '—'}
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* ─ Dynamic stats (lazy fetched) ─ */}
          <div className="px-4 pb-4 space-y-4">
            {loadingStats && <HistorialCardSkeleton darkMode={darkMode} />}

            {stats && (
              <>
                {/* Quiénes atendieron */}
                {stats.cajeros.length > 0 && (
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      👤 Quiénes atendieron
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {stats.cajeros.map((c, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                            darkMode
                              ? 'bg-blue-900/30 border border-blue-700/40 text-blue-300'
                              : 'bg-blue-50 border border-blue-100 text-blue-700'
                          }`}
                        >
                          <span>🧑‍💼</span>
                          <span>{c.nombre}</span>
                          <span className={`ml-0.5 font-bold ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                            · {c.cantidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clientes nuevos + anulados */}
                <div className="flex flex-wrap gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    darkMode ? 'bg-green-900/30 border border-green-700/40 text-green-300' : 'bg-green-50 border border-green-100 text-green-700'
                  }`}>
                    <span>🧑</span>
                    <span>Clientes nuevos:</span>
                    <span className="font-black">{stats.clientesNuevos}</span>
                  </div>
                  {stats.anulados > 0 && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      darkMode ? 'bg-red-900/30 border border-red-700/40 text-red-300' : 'bg-red-50 border border-red-100 text-red-600'
                    }`}>
                      <span>❌</span>
                      <span>Pedidos anulados:</span>
                      <span className="font-black">{stats.anulados}</span>
                    </div>
                  )}
                </div>

                {/* Tipo breakdown */}
                {stats.tipoBreakdown.length > 0 && (
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      📦 Tipos de pedido
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {stats.tipoBreakdown.map(({ tipo, count, total }) => (
                        <div
                          key={tipo}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                            darkMode
                              ? 'bg-gray-600/60 border border-gray-500/40 text-gray-200'
                              : 'bg-white border border-gray-200 text-gray-700'
                          }`}
                        >
                          <span>{TIPO_ICONS[tipo] ?? '📋'}</span>
                          <span>{TIPO_LABELS[tipo] ?? tipo}</span>
                          <span className={`font-black ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            · {count}
                          </span>
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                            {formatGs(total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Achievements */}
            <div>
              {unlocked.length === 0 ? (
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Sin logros desbloqueados en este turno.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      🏅 {unlocked.length} logros del turno
                    </p>
                    {dailyCount > 0 && (
                      <span className={`text-[10px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        · {dailyCount} del turno
                      </span>
                    )}
                    {globalCount > 0 && (
                      <span className={`text-[10px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        · {globalCount} globales
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {unlocked.map(ach => {
                      const color = TIER_COLORS[ach.tier]
                      return (
                        <div
                          key={ach.id}
                          title={`${ach.name}: ${ach.description}`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold"
                          style={{ borderColor: `${color}40`, background: `${color}12`, color }}
                        >
                          <span className="text-sm">{ach.emoji}</span>
                          <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>{ach.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   ACHIEVEMENTS PANEL
════════════════════════════════════════════ */
interface AchievementsPanelProps {
  open: boolean
  onClose: () => void
  isUnlocked: (id: string) => boolean
  getUnlockTime: (id: string) => number | null
  store: AchievementStore | null
  dailyProgress: number
  dailyTotal: number
  totalUnlocked: number
  totalAchievements: number
  onDiamondClick: (achievement: Achievement) => void
  /** Sesiones de caja para el historial */
  sesiones?: SesionCaja[]
}

export default function AchievementsPanel({
  open,
  onClose,
  isUnlocked,
  getUnlockTime,
  store,
  dailyProgress,
  dailyTotal,
  totalUnlocked,
  totalAchievements,
  onDiamondClick,
  sesiones = [],
}: AchievementsPanelProps) {
  const { darkMode, tenant } = useTenant()
  const [tab, setTab] = useState<'medallas' | 'historial'>('medallas')

  if (!open) return null

  const dailyPct = dailyTotal > 0 ? (dailyProgress / dailyTotal) * 100 : 0

  const renderCard = (ach: Achievement, showUnlockTime: boolean) => {
    const unlocked = isUnlocked(ach.id)
    const unlockTime = showUnlockTime ? getUnlockTime(ach.id) : null
    if (ach.tier === 'diamond') {
      return <DiamondMedalCard key={ach.id} achievement={ach} unlocked={unlocked} unlockTime={unlockTime} onClick={onDiamondClick} />
    }
    return <MedalCard key={ach.id} achievement={ach} unlocked={unlocked} unlockTime={unlockTime} store={store} darkMode={darkMode} />
  }

  const sessionHistory = store?.sessionHistory ?? {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 backdrop-blur-sm animate-fade-in-up ${darkMode ? 'bg-black/60' : 'bg-black/50'}`}
        onClick={onClose}
      />

      <div className={`relative z-[1] w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden animate-slam-in mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* ── Header ── */}
        <div className={`relative px-6 py-5 border-b ${darkMode ? 'bg-gradient-to-r from-amber-950/50 to-yellow-950/40 border-amber-800/50' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Logros</h2>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {totalUnlocked} de {totalAchievements} desbloqueados
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all text-xl font-light ${darkMode ? 'bg-gray-700/80 hover:bg-gray-600 border border-gray-600 text-gray-400 hover:text-white' : 'bg-white/80 hover:bg-white border border-gray-200 text-gray-400 hover:text-gray-600'}`}
            >
              ×
            </button>
          </div>

          {/* Daily progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                Turno actual: {dailyProgress}/{dailyTotal} medallas
              </span>
              <span className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {Math.round(dailyPct)}%
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${dailyPct}%`, background: 'linear-gradient(90deg, #F59E0B, #EAB308, #FFD700)' }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {([
              { key: 'medallas', label: '🥇 Medallas' },
              { key: 'historial', label: '📋 Historial de Turnos' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  tab === key
                    ? darkMode
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-600/50'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className={`overflow-y-auto max-h-[calc(85vh-200px)] p-6 custom-scrollbar ${darkMode ? 'scrollbar-thumb-gray-600' : ''}`}>

          {/* ═══ TAB: MEDALLAS ═══ */}
          {tab === 'medallas' && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📅</span>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Logros del Turno
                  </h3>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Se reinician al abrir un nuevo turno
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {DAILY_ACHIEVEMENTS.map((ach) => renderCard(ach, false))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🌟</span>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Logros Globales
                  </h3>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Permanentes
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {GLOBAL_ACHIEVEMENTS.map((ach) => renderCard(ach, true))}
                </div>
              </div>
            </>
          )}

          {/* ═══ TAB: HISTORIAL ═══ */}
          {tab === 'historial' && (
            <div className="space-y-3">
              {sesiones.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl">📋</span>
                  <p className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No hay turnos registrados todavía.
                  </p>
                </div>
              ) : (
                sesiones.map(sesion => (
                  <HistorialCard
                    key={sesion.id}
                    sesion={sesion}
                    achievementIds={sessionHistory[sesion.id]?.achievementIds ?? []}
                    darkMode={darkMode}
                    tenantId={tenant?.id}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
