'use client'

import { useTenant } from '@/contexts/TenantContext'

export function AppFooter() {
  const { darkMode } = useTenant()

  return (
    <footer className={`text-center text-sm py-6 ${
      darkMode 
        ? 'bg-gray-900/50 text-gray-400 border-t border-gray-800' 
        : 'bg-orange-50/50 text-gray-500 border-t border-orange-100'
    }`}>
      <p>ARDENTIUM Software Technologies® 2025</p>
    </footer>
  )
}
