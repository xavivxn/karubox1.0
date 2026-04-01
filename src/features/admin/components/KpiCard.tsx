'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface KpiCardProps {
  title: string
  value: string | ReactNode
  subtitle?: string
  accent?: 'orange' | 'blue' | 'green' | 'purple'
  children?: ReactNode
  darkMode?: boolean
  index?: number
}

const accentStylesLight: Record<string, string> = {
  orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/30',
  blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/30',
  green: 'from-green-500/10 to-green-500/5 border-green-500/30',
  purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/30'
}

const accentStylesDark: Record<string, string> = {
  orange: 'from-orange-500/20 to-orange-500/10 border-orange-500/40 bg-gray-800/80',
  blue: 'from-blue-500/20 to-blue-500/10 border-blue-500/40 bg-gray-800/80',
  green: 'from-green-500/20 to-green-500/10 border-green-500/40 bg-gray-800/80',
  purple: 'from-purple-500/20 to-purple-500/10 border-purple-500/40 bg-gray-800/80'
}

export function KpiCard({ title, value, subtitle, accent = 'orange', children, darkMode, index = 0 }: KpiCardProps) {
  const accentStyles = darkMode ? accentStylesDark : accentStylesLight
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className={`rounded-3xl border bg-gradient-to-br p-6 shadow-lg ${darkMode ? 'shadow-black/20 border-gray-700' : 'shadow-black/5'} ${accentStyles[accent]}`}
    >
      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
      <div className={`mt-3 text-4xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      {subtitle && <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  )
}
