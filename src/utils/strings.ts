
export const LOGIN_STRINGS = {
  LOGIN_TITLE: 'LomiPos',
  LOGIN_SUBTITLE: 'La solución para tu negocio.',
} as const

export const FEATURES = [
  {
    icon: '⚡',
    title: 'Rápido y Eficiente',
    description: 'Tomá pedidos en segundos.'
  },
  // {
  //   icon: '⭐',
  //   title: 'Puntos de Fidelidad',
  //   description: 'Premiá a tus clientes frecuentes.'
  // },
  {
    icon: '📊',
    title: 'Reportes Detallados',
    description: 'Analizá ventas en tiempo real.'
  }
]

export type LoginStrings = keyof typeof LOGIN_STRINGS
export type Feature = keyof typeof FEATURES