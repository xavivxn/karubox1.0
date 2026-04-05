
export const LOGIN_STRINGS = {
  LOGIN_TITLE: 'KarúBox',
  LOGIN_SUBTITLE: 'Karú rápido, caja fácil',
} as const

export const APP_VERSION = '1.0.4' as const
export const APP_VERSION_LABEL = `KarúBox - v${APP_VERSION}` as const

export const FEATURES = [
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

export type LoginStrings = keyof typeof LOGIN_STRINGS
export type Feature = keyof typeof FEATURES