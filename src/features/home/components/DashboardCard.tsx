import Link from 'next/link'
import { ShoppingCart, BarChart3 } from 'lucide-react'
import type { DashboardCard } from '../types/home.types'

interface DashboardCardProps {
  card: DashboardCard
  darkMode: boolean
}

export function DashboardCardComponent({ card, darkMode }: DashboardCardProps) {
  const isPos = card.icon === 'pos'
  const Icon = isPos ? ShoppingCart : BarChart3
  const colorClass = card.color === 'orange' ? 'orange' : 'blue'

  return (
    <Link
      href={card.href}
      className={`group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-${colorClass}-500/20 ${
        darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : `bg-gradient-to-br from-white to-${colorClass}-50`
      }`}
    >
      <div className={`absolute top-0 right-0 w-40 h-40 bg-${colorClass}-500/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500`} />
      <div className="relative p-8 space-y-4">
        <div className={`inline-flex p-4 rounded-2xl ${darkMode ? `bg-${colorClass}-500/20` : `bg-${colorClass}-100`}`}>
          <Icon className={`w-8 h-8 ${darkMode ? `text-${colorClass}-400` : `text-${colorClass}-600`}`} />
        </div>
        <div>
          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
          <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {card.description}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${darkMode ? `text-${colorClass}-400` : `text-${colorClass}-600`}`}>
          {isPos ? 'Ingresar al POS' : 'Ver panel admin'} →
        </span>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-2 ${darkMode ? `bg-${colorClass}-500/50` : `bg-${colorClass}-500`}`} />
    </Link>
  )
}
