/**
 * Panel de Clientes - Tarjetas por nivel VIP
 * Muestra cantidad de clientes Oro, Plata, Bronce.
 */

'use client'

import { Award, Medal, Gem } from 'lucide-react'
import type { SegmentosNivel } from '../types/clientes.types'

interface LevelSegmentCardsProps {
  segmentosNivel: SegmentosNivel
  loading: boolean
  /** 'row' = 3 cards in one row (default). 'column' = stacked vertically to fill height next to Top 10. */
  layout?: 'row' | 'column'
}

const CARDS = [
  {
    label: 'Oro',
    sublabel: 'mayores ventas',
    icon: <Award size={22} className="text-amber-600 dark:text-amber-400" />,
    key: 'oro' as const,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    iconBg: 'bg-amber-100 dark:bg-amber-800/60 text-amber-600 dark:text-amber-300',
    textColor: 'text-amber-700 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-700/60',
  },
  {
    label: 'Plata',
    sublabel: 'ventas medias',
    icon: <Medal size={22} className="text-gray-500 dark:text-gray-400" />,
    key: 'plata' as const,
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    iconBg: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    textColor: 'text-gray-700 dark:text-gray-200',
    border: 'border-gray-200 dark:border-gray-600',
  },
  {
    label: 'Bronce',
    sublabel: 'primeros pasos',
    icon: <Gem size={22} className="text-amber-700 dark:text-amber-600" />,
    key: 'bronce' as const,
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    iconBg: 'bg-orange-100 dark:bg-orange-800/60 text-orange-600 dark:text-orange-300',
    textColor: 'text-orange-700 dark:text-orange-200',
    border: 'border-orange-200 dark:border-orange-700/60',
  },
] as const

export const LevelSegmentCards = ({ segmentosNivel, loading, layout = 'row' }: LevelSegmentCardsProps) => {
  const isColumn = layout === 'column'
  return (
    <div
      className={`grid gap-3 sm:gap-4 min-w-0 ${
        isColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'
      }`}
    >
      {CARDS.map((card) => (
        <div
          key={card.key}
          className={`rounded-xl border ${card.border} ${card.bg} p-4 flex items-center gap-3 sm:gap-4 transition-colors min-w-0 overflow-hidden`}
        >
          <div className={`p-2.5 sm:p-3 rounded-lg ${card.iconBg} flex-shrink-0`}>{card.icon}</div>
          <div className="min-w-0">
            {loading ? (
              <div className="h-7 w-10 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-1" />
            ) : (
              <p className={`text-xl sm:text-2xl font-bold ${card.textColor} tabular-nums`}>
                {segmentosNivel[card.key]}
              </p>
            )}
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{card.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

