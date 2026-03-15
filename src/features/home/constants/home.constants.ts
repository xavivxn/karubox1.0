import { ROUTES } from '@/config'

export interface DashboardCard {
  title: string
  description: string
  href: string
  icon: 'pos' | 'admin' | 'pedidos'
  color: 'orange' | 'blue' | 'green'
}

export interface Feature {
  icon: string
  title: string
  description: string
}

export const DASHBOARD_CARDS: DashboardCard[] = [
  {
    title: 'Punto de Venta',
    description: 'Toma pedidos rápido, controla clientes y suma puntos automáticamente.',
    href: ROUTES.PROTECTED.POS,
    icon: 'pos',
    color: 'orange'
  },
  {
    title: 'Historial de pedidos',
    description: 'Consultá pedidos por fecha y estado. Solo administradores pueden anular.',
    href: ROUTES.PROTECTED.PEDIDOS,
    icon: 'pedidos',
    color: 'green'
  },
  {
    title: 'Administración',
    description: 'Panel con ventas, inventario, fidelización y cierres de caja.',
    href: ROUTES.PROTECTED.ADMIN,
    icon: 'admin',
    color: 'blue'
  }
]

export const FEATURES: Feature[] = [
  {
    icon: '⚡',
    title: 'Rápido y Eficiente',
    description: 'Tomá pedidos en segundos.'
  },
  {
    icon: '⭐',
    title: 'Puntos de Fidelidad',
    description: 'Premiá a tus clientes frecuentes.'
  },
  {
    icon: '📊',
    title: 'Reportes Detallados',
    description: 'Analizá ventas en tiempo real.'
  }
]
