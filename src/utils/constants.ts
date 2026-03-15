/**
 * Auth Module - Constants
 * Constantes de configuración del módulo de autenticación
 */

// Theme Configuration
export const THEME_CONFIG = {
  LIGHT: {
    name: 'light',
    background: 'bg-white',
    text: 'text-gray-900',
    card: 'bg-white',
    border: 'border-orange-100',
  },
  DARK: {
    name: 'dark',
    background: 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900',
    text: 'text-gray-100',
    card: 'bg-gray-800',
    border: 'border-gray-700',
  },
} as const

// Types
export type ThemeMode = keyof typeof THEME_CONFIG
