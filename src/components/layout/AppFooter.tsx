'use client'

import { useTenant } from '@/contexts/TenantContext'

export function AppFooter() {
  const { darkMode } = useTenant()

  return (
    <footer className={`text-center text-sm py-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <p>ARDENTIUM Software Technologies® 2025</p>
    </footer>
  )
}
