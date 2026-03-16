'use client'

import { useTenant } from '@/contexts/TenantContext'
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
}

function MedalCard({
  achievement,
  unlocked,
  unlockTime,
  store,
  darkMode,
}: {
  achievement: Achievement
  unlocked: boolean
  unlockTime: number | null
  store: AchievementStore | null
  darkMode?: boolean
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
          : darkMode
            ? 'bg-gray-700/50 border-gray-600 opacity-70 grayscale'
            : 'bg-gray-50 border-gray-200 opacity-60 grayscale'
        }
      `}
      style={unlocked ? { borderColor: tierColor } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${unlocked ? 'animate-tier-glow' : ''}
          `}
          style={{
            background: unlocked ? `${tierColor}20` : darkMode ? '#4b5563' : '#e5e7eb',
            '--tier-color': tierColor,
          } as React.CSSProperties}
        >
          {unlocked ? achievement.emoji : '🔒'}
        </div>
        <span
          className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            color: unlocked ? tierColor : darkMode ? '#9ca3af' : '#9ca3af',
            background: unlocked ? `${tierColor}15` : darkMode ? '#374151' : '#f3f4f6',
          }}
        >
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
            <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {progress.current}/{progress.target}
            </span>
            <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {Math.round((progress.current / progress.target) * 100)}%
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
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
        <p className={`mt-2 text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {new Date(unlockTime).toLocaleDateString('es-PY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
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
}: AchievementsPanelProps) {
  const { darkMode } = useTenant()

  if (!open) return null

  const dailyPct = dailyTotal > 0 ? (dailyProgress / dailyTotal) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 backdrop-blur-sm animate-fade-in-up ${darkMode ? 'bg-black/60' : 'bg-black/50'}`}
        onClick={onClose}
      />

      <div className={`relative z-[1] w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden animate-slam-in mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
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

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                Medallas del Día: {dailyProgress}/{dailyTotal}
              </span>
              <span className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {Math.round(dailyPct)}%
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
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

        <div className={`overflow-y-auto max-h-[calc(85vh-160px)] p-6 custom-scrollbar ${darkMode ? 'scrollbar-thumb-gray-600' : ''}`}>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📅</span>
              <h3 className={`text-base font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Logros del Día</h3>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Se reinician a medianoche</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {DAILY_ACHIEVEMENTS.map((ach) => (
                <MedalCard
                  key={ach.id}
                  achievement={ach}
                  unlocked={isUnlocked(ach.id)}
                  unlockTime={null}
                  store={store}
                  darkMode={darkMode}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🌟</span>
              <h3 className={`text-base font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Logros Globales</h3>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Permanentes</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {GLOBAL_ACHIEVEMENTS.map((ach) => (
                <MedalCard
                  key={ach.id}
                  achievement={ach}
                  unlocked={isUnlocked(ach.id)}
                  unlockTime={getUnlockTime(ach.id)}
                  store={store}
                  darkMode={darkMode}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
