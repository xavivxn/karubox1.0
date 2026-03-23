'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Achievement, TIER_COLORS, TIER_LABELS } from '../utils/achievements'

interface AchievementToastProps {
  achievement: Achievement
  onDismiss: (id: string) => void
}

function AchievementToastItem({ achievement, onDismiss }: AchievementToastProps) {
  const tierColor = TIER_COLORS[achievement.tier]

  useEffect(() => {
    const removeTimer = setTimeout(() => onDismiss(achievement.id), 4500)
    return () => clearTimeout(removeTimer)
  }, [achievement.id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ x: 420, opacity: 0, rotate: 8, scale: 0.82 }}
      animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
      exit={{ x: 420, opacity: 0, scale: 0.88, transition: { duration: 0.22, ease: 'easeIn' } }}
      transition={{ type: 'spring', bounce: 0.45, duration: 0.52 }}
      className="relative overflow-hidden rounded-2xl shadow-2xl border-2 px-5 py-4 flex items-center gap-4 min-w-[320px] max-w-[400px] bg-white dark:bg-gray-900/95 backdrop-blur-sm cursor-pointer"
      style={{
        borderColor: tierColor,
        boxShadow: `0 0 24px ${tierColor}50, 0 6px 24px rgba(0,0,0,0.15)`,
      }}
      onClick={() => onDismiss(achievement.id)}
    >
      {/* Tier shimmer background */}
      <div
        className="absolute inset-0 opacity-10 animate-medal-shine"
        style={{
          background: `linear-gradient(135deg, transparent 40%, ${tierColor} 50%, transparent 60%)`,
          backgroundSize: '200% 200%',
        }}
      />

      {/* Medal icon — bounces in with extra spring */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.7, duration: 0.6, delay: 0.12 }}
        className="relative z-[1] w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 animate-tier-glow"
        style={{
          background: `linear-gradient(135deg, ${tierColor}30, ${tierColor}10)`,
          '--tier-color': tierColor,
        } as React.CSSProperties}
      >
        {achievement.emoji}
      </motion.div>

      {/* Content slides in slightly after icon */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
        className="relative z-[1] flex-1 min-w-0"
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tierColor }}>
            {TIER_LABELS[achievement.tier]}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {achievement.type === 'daily' ? '• Diario' : '• Global'}
          </span>
        </div>
        <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
          {achievement.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
          {achievement.description}
        </p>
      </motion.div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(achievement.id) }}
        className="relative z-[1] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-lg"
      >
        ×
      </button>
    </motion.div>
  )
}

export default function AchievementToastStack({
  achievements,
  onDismiss,
}: {
  achievements: Achievement[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-auto">
      <AnimatePresence mode="popLayout">
        {achievements.slice(0, 3).map((ach) => (
          <AchievementToastItem
            key={ach.id}
            achievement={ach}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
