'use client'

import { motion } from 'framer-motion'
import type { AdminDatePreset } from '../types/admin.types'

interface DatePresetPillsProps {
  selected: AdminDatePreset
  onChange: (preset: AdminDatePreset) => void
  disabled?: boolean
  /** Evita colisión de layout con otro grupo de pills (p. ej. header vs gráfico) */
  layoutId?: string
  className?: string
}

const PRESETS: Array<{ value: AdminDatePreset; label: string }> = [
  { value: 'turno_actual', label: 'Turno' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'ultimos_7_dias', label: '7 días' },
  { value: 'este_mes', label: 'Mes' },
  { value: 'mes_pasado', label: 'Mes ant.' },
  { value: 'historico', label: 'Histórico' }
]

export const DatePresetPills = ({
  selected,
  onChange,
  disabled,
  layoutId = 'adminDatePill',
  className = '',
}: DatePresetPillsProps) => {
  return (
    <div
      className={`flex gap-1 overflow-x-auto scrollbar-none p-1 rounded-2xl bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/50 ${className}`}
      role="radiogroup"
      aria-label="Seleccionar período"
    >
      {PRESETS.map((preset) => {
        const isActive = selected === preset.value
        return (
          <button
            key={preset.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(preset.value)}
            disabled={disabled}
            className={`
              relative px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isActive
                ? 'text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }
            `}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-orange-500 dark:bg-orange-600 shadow-lg shadow-orange-500/25"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{preset.label}</span>
          </button>
        )
      })}
    </div>
  )
}
