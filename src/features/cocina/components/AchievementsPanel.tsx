'use client'

import { useMemo } from 'react'
import {
  type Achievement,
  type AchievementStore,
  DAILY_ACHIEVEMENTS,
  GLOBAL_ACHIEVEMENTS,
  TIER_COLORS,
  TIER_LABELS,
  TIER_BG,
  getGlobalProgress,
} from '../utils/achievements'

/* ════════════════════════════════════════════
   SPARKLE POSITIONS — fixed per achievement id
   so they don't jump on re-render
════════════════════════════════════════════ */
function getSparkles(seed: string) {
  const positions = [
    { top: '12%', left: '8%',  delay: '0s',    size: 10 },
    { top: '20%', left: '80%', delay: '0.4s',  size: 8  },
    { top: '55%', left: '90%', delay: '0.8s',  size: 12 },
    { top: '75%', left: '15%', delay: '1.2s',  size: 9  },
    { top: '85%', left: '60%', delay: '0.6s',  size: 7  },
    { top: '40%', left: '5%',  delay: '1.6s',  size: 11 },
    { top: '65%', left: '45%', delay: '1.0s',  size: 8  },
  ]
  // shift based on seed length so different cards vary slightly
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
      <div className="relative rounded-2xl border-2 border-gray-200 bg-gray-50 p-4 opacity-60 grayscale">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gray-200">
            🔒
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-gray-400 bg-gray-100">
            Diamante
          </span>
        </div>
        <h4 className="text-sm font-bold mb-0.5 text-gray-400">{achievement.name}</h4>
        <p className="text-xs text-gray-400">{achievement.description}</p>
      </div>
    )
  }

  return (
    <div
      className="relative rounded-2xl border-2 p-4 cursor-pointer overflow-hidden select-none group"
      style={{
        borderColor: 'transparent',
        background: 'linear-gradient(#0f0c24, #0f0c24) padding-box, linear-gradient(135deg, #f43f5e, #a855f7, #3b82f6, #06b6d4, #10b981, #f59e0b, #f43f5e) border-box',
      }}
      onClick={() => onClick(achievement)}
      title="Ver trofeo"
    >
      {/* Rainbow holo background layer */}
      <div
        className="absolute inset-0 rounded-2xl opacity-25 animate-holo-gradient pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #f43f5e 0%, #a855f7 16%, #3b82f6 33%, #06b6d4 50%, #10b981 66%, #f59e0b 83%, #f43f5e 100%)',
          backgroundSize: '300% 300%',
        }}
      />

      {/* Sheen diagonal sweep */}
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

      {/* Sparkle stars */}
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="absolute text-white animate-holo-pop pointer-events-none"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            fontSize: `${s.size}px`,
            textShadow: '0 0 6px #fff, 0 0 12px #a78bfa',
            lineHeight: 1,
          }}
        >
          ✦
        </span>
      ))}

      {/* Content */}
      <div className="relative z-[1]">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(59,130,246,0.2))',
              boxShadow: '0 0 12px rgba(167,139,250,0.5)',
            }}
          >
            {achievement.emoji}
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #a855f7, #3b82f6)',
              color: '#fff',
            }}
          >
            Diamante
          </span>
        </div>

        <h4 className="text-sm font-bold mb-0.5 text-white drop-shadow">
          {achievement.name}
        </h4>
        <p className="text-xs text-purple-200">{achievement.description}</p>

        {unlockTime && (
          <p className="mt-2 text-[10px] text-purple-300/70">
            {new Date(unlockTime).toLocaleDateString('es-PY', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        )}

        {/* "Ver trofeo" hint on hover */}
        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
            <span>✨</span> Ver trofeo
          </span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   STANDARD MEDAL CARD (bronze / silver / gold)
════════════════════════════════════════════ */
function MedalCard({
  achievement,
  unlocked,
  unlockTime,
  store,
}: {
  achievement: Achievement
  unlocked: boolean
  unlockTime: number | null
  store: AchievementStore | null
}) {
  const tierColor = TIER_COLORS[achievement.tier]
  const progress = store && achievement.type === 'global'
    ? getGlobalProgress(achievement, store)
    : null

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-300
        ${unlocked
          ? `bg-gradient-to-br ${TIER_BG[achievement.tier]} animate-medal-shine-subtle`
          : 'bg-gray-50 border-gray-200 opacity-60 grayscale'
        }
      `}
      style={unlocked ? { borderColor: tierColor } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${unlocked ? 'animate-tier-glow' : ''}`}
          style={{
            background: unlocked ? `${tierColor}20` : '#e5e7eb',
            '--tier-color': tierColor,
          } as React.CSSProperties}
        >
          {unlocked ? achievement.emoji : '🔒'}
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            color: unlocked ? tierColor : '#9ca3af',
            background: unlocked ? `${tierColor}15` : '#f3f4f6',
          }}
        >
          {TIER_LABELS[achievement.tier]}
        </span>
      </div>

      <h4 className={`text-sm font-bold mb-0.5 ${unlocked ? 'text-gray-900' : 'text-gray-400'}`}>
        {achievement.name}
      </h4>
      <p className={`text-xs ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
        {achievement.description}
      </p>

      {progress && !unlocked && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-medium">
              {progress.current}/{progress.target}
            </span>
            <span className="text-[10px] text-gray-400">
              {Math.round((progress.current / progress.target) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(progress.current / progress.target) * 100}%`,
                backgroundColor: tierColor,
              }}
            />
          </div>
        </div>
      )}

      {unlockTime && (
        <p className="mt-2 text-[10px] text-gray-400">
          {new Date(unlockTime).toLocaleDateString('es-PY', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
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
}: AchievementsPanelProps) {
  if (!open) return null

  const dailyPct = dailyTotal > 0 ? (dailyProgress / dailyTotal) * 100 : 0

  const renderCard = (ach: Achievement, showUnlockTime: boolean) => {
    const unlocked = isUnlocked(ach.id)
    const unlockTime = showUnlockTime ? getUnlockTime(ach.id) : null

    if (ach.tier === 'diamond') {
      return (
        <DiamondMedalCard
          key={ach.id}
          achievement={ach}
          unlocked={unlocked}
          unlockTime={unlockTime}
          onClick={onDiamondClick}
        />
      )
    }

    return (
      <MedalCard
        key={ach.id}
        achievement={ach}
        unlocked={unlocked}
        unlockTime={unlockTime}
        store={store}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in-up"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-[1] w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-slam-in mx-4">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className="text-xl font-black text-gray-900">Logros</h2>
                <p className="text-xs text-gray-500 font-medium">
                  {totalUnlocked} de {totalAchievements} desbloqueados
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all text-xl font-light"
            >
              ×
            </button>
          </div>

          {/* Daily progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-700">
                Medallas del Día: {dailyProgress}/{dailyTotal}
              </span>
              <span className="text-xs font-bold text-amber-600">
                {Math.round(dailyPct)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${dailyPct}%`,
                  background: 'linear-gradient(90deg, #F59E0B, #EAB308, #FFD700)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-160px)] p-6 custom-scrollbar">
          {/* Daily Achievements */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📅</span>
              <h3 className="text-base font-bold text-gray-800">Logros del Día</h3>
              <span className="text-xs text-gray-400 font-medium">Se reinician a medianoche</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {DAILY_ACHIEVEMENTS.map((ach) => renderCard(ach, false))}
            </div>
          </div>

          {/* Global Achievements */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🌟</span>
              <h3 className="text-base font-bold text-gray-800">Logros Globales</h3>
              <span className="text-xs text-gray-400 font-medium">Permanentes</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {GLOBAL_ACHIEVEMENTS.map((ach) => renderCard(ach, true))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
