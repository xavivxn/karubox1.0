'use client'

import { useEffect, useState } from 'react'
import { type Achievement, TIER_COLORS, TIER_LABELS } from '../utils/achievements'

interface AchievementToastProps {
  achievement: Achievement
  onDismiss: (id: string) => void
}

function AchievementToastItem({ achievement, onDismiss }: AchievementToastProps) {
  const [exiting, setExiting] = useState(false)
  const tierColor = TIER_COLORS[achievement.tier]

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 3600)
    const removeTimer = setTimeout(() => onDismiss(achievement.id), 4200)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [achievement.id, onDismiss])

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl shadow-2xl border-2 px-5 py-4
        flex items-center gap-4 min-w-[320px] max-w-[400px]
        bg-white backdrop-blur-sm
        ${exiting ? 'animate-achievement-out' : 'animate-achievement-in'}
      `}
      style={{
        borderColor: tierColor,
        boxShadow: `0 0 20px ${tierColor}40, 0 4px 20px rgba(0,0,0,0.15)`,
      }}
    >
      {/* Tier shimmer background */}
      <div
        className="absolute inset-0 opacity-10 animate-medal-shine"
        style={{
          background: `linear-gradient(135deg, transparent 40%, ${tierColor} 50%, transparent 60%)`,
          backgroundSize: '200% 200%',
        }}
      />

      {/* Medal icon */}
      <div
        className="relative z-[1] w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 animate-tier-glow"
        style={{
          background: `linear-gradient(135deg, ${tierColor}30, ${tierColor}10)`,
          '--tier-color': tierColor,
        } as React.CSSProperties}
      >
        {achievement.emoji}
      </div>

      {/* Content */}
      <div className="relative z-[1] flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tierColor }}>
            {TIER_LABELS[achievement.tier]}
          </span>
          <span className="text-[10px] text-gray-300">
            {achievement.type === 'daily' ? '• Diario' : '• Global'}
          </span>
        </div>
        <p className="text-sm font-black text-gray-900 truncate">
          {achievement.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {achievement.description}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(achievement.id)}
        className="relative z-[1] text-gray-300 hover:text-gray-500 transition-colors text-lg"
      >
        ×
      </button>
    </div>
  )
}

export default function AchievementToastStack({
  achievements,
  onDismiss,
}: {
  achievements: Achievement[]
  onDismiss: (id: string) => void
}) {
  if (achievements.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-auto">
      {achievements.slice(0, 3).map((ach) => (
        <AchievementToastItem
          key={ach.id}
          achievement={ach}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}
