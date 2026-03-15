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
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100 text-blue-600',
      textColor: 'text-blue-700',
      border: 'border-blue-200',
    },
    {
      label: 'Activos',
      sublabel: 'vienen < 15 días',
      icon: <CheckCircle2 size={22} />,
      count: segments.activos.length,
      bg: 'bg-green-50',
      iconBg: 'bg-green-100 text-green-600',
      textColor: 'text-green-700',
      border: 'border-green-200',
    },
    {
      label: 'En riesgo',
      sublabel: '15 – 29 días sin venir',
      icon: <AlertTriangle size={22} />,
      count: segments.enRiesgo.length,
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100 text-amber-600',
      textColor: 'text-amber-700',
      border: 'border-amber-200',
    },
    {
      label: 'Inactivos',
      sublabel: '+30 días o sin visitas',
      icon: <UserX size={22} />,
      count: segments.inactivos.length,
      bg: 'bg-red-50',
      iconBg: 'bg-red-100 text-red-600',
      textColor: 'text-red-700',
      border: 'border-red-200',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} ${card.bg} p-4 flex items-center gap-4`}
        >
          <div className={`p-3 rounded-lg ${card.iconBg} flex-shrink-0`}>
            {card.icon}
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-10 bg-gray-200 rounded animate-pulse mb-1" />
            ) : (
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.count}</p>
            )}
            <p className="text-sm font-semibold text-gray-700">{card.label}</p>
            <p className="text-xs text-gray-500">{card.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
