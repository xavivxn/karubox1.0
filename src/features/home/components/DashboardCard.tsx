import Link from 'next/link'
import { ShoppingCart, BarChart3, FileText, Users, ChefHat } from 'lucide-react'
import type { DashboardCard } from '../types/home.types'

const CARD_ICONS = {
  pos: ShoppingCart,
  admin: BarChart3,
  pedidos: FileText,
  clientes: Users,
  cocina: ChefHat,
} as const

const CARD_LABELS: Record<DashboardCard['icon'], string> = {
  pos: 'Ingresar al POS',
  admin: 'Ver panel admin',
  pedidos: 'Ver historial',
  clientes: 'Ver clientes →',
  cocina: 'Abrir cocina 3D →',
}

interface DashboardCardProps {
  card: DashboardCard
  darkMode: boolean
}

type CardColor = DashboardCard['color']

const COLOR_MAP: Record<CardColor, { shadow: string; bgLight: string; blob: string; iconBgLight: string; iconBgDark: string; iconLight: string; iconDark: string; barLight: string; barDark: string }> = {
  orange:  { shadow: 'hover:shadow-orange-500/20',  bgLight: 'bg-gradient-to-br from-white to-orange-50',  blob: 'bg-orange-500/10',  iconBgLight: 'bg-orange-100',  iconBgDark: 'bg-orange-500/20',  iconLight: 'text-orange-600',  iconDark: 'text-orange-400',  barLight: 'bg-orange-500',  barDark: 'bg-orange-500/50' },
  green:   { shadow: 'hover:shadow-emerald-500/20', bgLight: 'bg-gradient-to-br from-white to-emerald-50', blob: 'bg-emerald-500/10', iconBgLight: 'bg-emerald-100', iconBgDark: 'bg-emerald-500/20', iconLight: 'text-emerald-600', iconDark: 'text-emerald-400', barLight: 'bg-emerald-500', barDark: 'bg-emerald-500/50' },
  blue:    { shadow: 'hover:shadow-blue-500/20',    bgLight: 'bg-gradient-to-br from-white to-blue-50',    blob: 'bg-blue-500/10',    iconBgLight: 'bg-blue-100',    iconBgDark: 'bg-blue-500/20',    iconLight: 'text-blue-600',    iconDark: 'text-blue-400',    barLight: 'bg-blue-500',    barDark: 'bg-blue-500/50' },
  purple:  { shadow: 'hover:shadow-purple-500/20',  bgLight: 'bg-gradient-to-br from-white to-purple-50',  blob: 'bg-purple-500/10',  iconBgLight: 'bg-purple-100',  iconBgDark: 'bg-purple-500/20',  iconLight: 'text-purple-600',  iconDark: 'text-purple-400',  barLight: 'bg-purple-500',  barDark: 'bg-purple-500/50' },
  red:     { shadow: 'hover:shadow-red-500/20',     bgLight: 'bg-gradient-to-br from-white to-red-50',     blob: 'bg-red-500/10',     iconBgLight: 'bg-red-100',     iconBgDark: 'bg-red-500/20',     iconLight: 'text-red-600',     iconDark: 'text-red-400',     barLight: 'bg-red-500',     barDark: 'bg-red-500/50' },
}

export function DashboardCardComponent({ card, darkMode }: DashboardCardProps) {
  const c = COLOR_MAP[card.color] ?? COLOR_MAP.blue
  const Icon  = CARD_ICONS[card.icon]
  const label = CARD_LABELS[card.icon]

  const bgCls = darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : c.bgLight

  return (
    <Link
      href={card.href}
      className={`group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105 ${c.shadow} ${bgCls}`}
    >
      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500 ${c.blob}`} />
      <div className="relative p-8 space-y-4">
        <div className={`inline-flex p-4 rounded-2xl ${darkMode ? c.iconBgDark : c.iconBgLight}`}>
          <Icon className={`w-8 h-8 ${darkMode ? c.iconDark : c.iconLight}`} />
        </div>
        <div>
          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
          <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {card.description}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${darkMode ? c.iconDark : c.iconLight}`}>
          {label}
        </span>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-2 ${darkMode ? c.barDark : c.barLight}`} />
    </Link>
  )
}
