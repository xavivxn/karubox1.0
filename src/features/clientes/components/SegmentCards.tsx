/**
 * Panel de Clientes - Tarjetas de segmentos
 * Muestra 4 métricas clave: total, activos, en riesgo, inactivos
 */

import { Users, CheckCircle2, AlertTriangle, UserX } from 'lucide-react'
import type { Segmentos } from '../types/clientes.types'

interface SegmentCardsProps {
  segments: Segmentos
  loading: boolean
}

interface CardDef {
  label: string
  sublabel: string
  icon: React.ReactNode
  count: number
  bg: string
  iconBg: string
  textColor: string
  border: string
}

export const SegmentCards = ({ segments, loading }: SegmentCardsProps) => {
  const cards: CardDef[] = [
    {
      label: 'Total clientes',
      sublabel: 'registrados',
      icon: <Users size={22} />,
      count: segments.total,
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      iconBg: 'bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300',
      textColor: 'text-blue-700 dark:text-blue-200',
      border: 'border-blue-200 dark:border-blue-700/60',
    },
    {
      label: 'Activos',
      sublabel: 'vienen < 15 días',
      icon: <CheckCircle2 size={22} />,
      count: segments.activos.length,
      bg: 'bg-green-50 dark:bg-green-950/40',
      iconBg: 'bg-green-100 dark:bg-green-800/60 text-green-600 dark:text-green-300',
      textColor: 'text-green-700 dark:text-green-200',
      border: 'border-green-200 dark:border-green-700/60',
    },
    {
      label: 'En riesgo',
      sublabel: '15 – 29 días sin venir',
      icon: <AlertTriangle size={22} />,
      count: segments.enRiesgo.length,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      iconBg: 'bg-amber-100 dark:bg-amber-800/60 text-amber-600 dark:text-amber-300',
      textColor: 'text-amber-700 dark:text-amber-200',
      border: 'border-amber-200 dark:border-amber-700/60',
    },
    {
      label: 'Inactivos',
      sublabel: '+30 días o sin visitas',
      icon: <UserX size={22} />,
      count: segments.inactivos.length,
      bg: 'bg-red-50 dark:bg-red-950/40',
      iconBg: 'bg-red-100 dark:bg-red-800/60 text-red-600 dark:text-red-300',
      textColor: 'text-red-700 dark:text-red-200',
      border: 'border-red-200 dark:border-red-700/60',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} ${card.bg} p-4 flex items-center gap-3 sm:gap-4 transition-colors`}
        >
          <div className={`p-2.5 sm:p-3 rounded-lg ${card.iconBg} flex-shrink-0`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            {loading ? (
              <div className="h-7 w-10 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-1" />
            ) : (
              <p className={`text-xl sm:text-2xl font-bold ${card.textColor} tabular-nums`}>{card.count}</p>
            )}
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{card.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
