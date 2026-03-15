import Link from 'next/link'
import { ShoppingCart, BarChart3, FileText, Users } from 'lucide-react'
import type { DashboardCard } from '../types/home.types'

const CARD_ICONS = {
  pos: ShoppingCart,
  admin: BarChart3,
  pedidos: FileText,
  clientes: Users,
} as const

const CARD_LABELS: Record<DashboardCard['icon'], string> = {
  pos: 'Ingresar al POS',
  admin: 'Ver panel admin',
  pedidos: 'Ver historial',
  clientes: 'Ver clientes →',
}

interface DashboardCardProps {
  card: DashboardCard
  darkMode: boolean
}

export function DashboardCardComponent({ card, darkMode }: DashboardCardProps) {
  const isOrange = card.color === 'orange'
  const isGreen  = card.color === 'green'
  const isPurple = card.color === 'purple'
  // blue is the default fallback

  const Icon  = CARD_ICONS[card.icon]
  const label = CARD_LABELS[card.icon]

  const shadowCls = isOrange ? 'hover:shadow-orange-500/20'
    : isGreen  ? 'hover:shadow-emerald-500/20'
    : isPurple ? 'hover:shadow-purple-500/20'
    : 'hover:shadow-blue-500/20'

  const bgCls = darkMode
    ? 'bg-gradient-to-br from-gray-800 to-gray-900'
    : isOrange ? 'bg-gradient-to-br from-white to-orange-50'
    : isGreen  ? 'bg-gradient-to-br from-white to-emerald-50'
    : isPurple ? 'bg-gradient-to-br from-white to-purple-50'
    : 'bg-gradient-to-br from-white to-blue-50'

  const blobCls = isOrange ? 'bg-orange-500/10'
    : isGreen  ? 'bg-emerald-500/10'
    : isPurple ? 'bg-purple-500/10'
    : 'bg-blue-500/10'

  const iconBgCls = darkMode
    ? isOrange ? 'bg-orange-500/20' : isGreen ? 'bg-emerald-500/20' : isPurple ? 'bg-purple-500/20' : 'bg-blue-500/20'
    : isOrange ? 'bg-orange-100'    : isGreen ? 'bg-emerald-100'    : isPurple ? 'bg-purple-100'    : 'bg-blue-100'

  const iconColorCls = darkMode
    ? isOrange ? 'text-orange-400' : isGreen ? 'text-emerald-400' : isPurple ? 'text-purple-400' : 'text-blue-400'
    : isOrange ? 'text-orange-600' : isGreen ? 'text-emerald-600' : isPurple ? 'text-purple-600' : 'text-blue-600'

  const textColorCls = darkMode
    ? isOrange ? 'text-orange-400' : isGreen ? 'text-emerald-400' : isPurple ? 'text-purple-400' : 'text-blue-400'
    : isOrange ? 'text-orange-600' : isGreen ? 'text-emerald-600' : isPurple ? 'text-purple-600' : 'text-blue-600'

  const barCls = darkMode
    ? isOrange ? 'bg-orange-500/50' : isGreen ? 'bg-emerald-500/50' : isPurple ? 'bg-purple-500/50' : 'bg-blue-500/50'
    : isOrange ? 'bg-orange-500'    : isGreen ? 'bg-emerald-500'    : isPurple ? 'bg-purple-500'    : 'bg-blue-500'

  return (
    <Link
      href={card.href}
      className={`group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105 ${shadowCls} ${bgCls}`}
    >
      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500 ${blobCls}`} />
      <div className="relative p-8 space-y-4">
        <div className={`inline-flex p-4 rounded-2xl ${iconBgCls}`}>
          <Icon className={`w-8 h-8 ${iconColorCls}`} />
        </div>
        <div>
          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
          <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {card.description}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${textColorCls}`}>
          {label}
        </span>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-2 ${barCls}`} />
    </Link>
  )
}
