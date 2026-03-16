'use client'

import { useTenant } from '@/contexts/TenantContext'

type AppFooterProps = {
  isDark?: boolean
  className?: string
}

export function AppFooter({ isDark, className = '' }: AppFooterProps) {
  const { darkMode } = useTenant()
  const effectiveDark = isDark !== undefined ? isDark : darkMode

  return (
    <footer
      className={`min-h-14 flex-shrink-0 flex items-center justify-center text-center text-sm ${
        effectiveDark 
          ? 'bg-gray-900/50 text-gray-400 border-t border-gray-800' 
          : 'bg-orange-50/50 text-gray-500 border-t border-orange-100'
      } ${className}`.trim()}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <p>ARDENTIUM Software Technologies® 2025</p>
    </footer>
  )
}
