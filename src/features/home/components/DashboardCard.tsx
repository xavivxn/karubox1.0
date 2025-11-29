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
  const isOrange = card.color === 'orange'

  return (
    <Link
      href={card.href}
      className={`group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105 ${
        isOrange 
          ? 'hover:shadow-orange-500/20' 
          : 'hover:shadow-blue-500/20'
      } ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
          : isOrange
            ? 'bg-gradient-to-br from-white to-orange-50'
            : 'bg-gradient-to-br from-white to-blue-50'
      }`}
    >
      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500 ${
        isOrange ? 'bg-orange-500/10' : 'bg-blue-500/10'
      }`} />
      <div className="relative p-8 space-y-4">
        <div className={`inline-flex p-4 rounded-2xl ${
          darkMode 
            ? isOrange ? 'bg-orange-500/20' : 'bg-blue-500/20'
            : isOrange ? 'bg-orange-100' : 'bg-blue-100'
        }`}>
          <Icon className={`w-8 h-8 ${
            darkMode
              ? isOrange ? 'text-orange-400' : 'text-blue-400'
              : isOrange ? 'text-orange-600' : 'text-blue-600'
          }`} />
        </div>
        <div>
          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
          <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {card.description}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
          darkMode
            ? isOrange ? 'text-orange-400' : 'text-blue-400'
            : isOrange ? 'text-orange-600' : 'text-blue-600'
        }`}>
          {isPos ? 'Ingresar al POS' : 'Ver panel admin'} →
        </span>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-2 ${
        darkMode
          ? isOrange ? 'bg-orange-500/50' : 'bg-blue-500/50'
          : isOrange ? 'bg-orange-500' : 'bg-blue-500'
      }`} />
    </Link>
  )
}
