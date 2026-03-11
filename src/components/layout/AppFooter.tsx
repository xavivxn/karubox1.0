'use client'

import { useTenant } from '@/contexts/TenantContext'

type AppFooterProps = {
  isDark?: boolean
}

export function AppFooter({ isDark }: AppFooterProps = {}) {
  const { darkMode } = useTenant()
  const effectiveDark = isDark !== undefined ? isDark : darkMode

  return (
    <footer className={`text-center text-sm py-6 ${
      effectiveDark 
        ? 'bg-gray-900/50 text-gray-400 border-t border-gray-800' 
        : 'bg-orange-50/50 text-gray-500 border-t border-orange-100'
    }`}>
      <p>ARDENTIUM Software Technologies® 2025</p>
    </footer>
  )
}
