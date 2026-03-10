'use client'

import { ReactNode, Suspense, useState, useEffect, useRef } from 'react'
import { LogOut, Menu, UserCircle2, Sun, Moon, BarChart3, ChevronDown } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { Breadcrumb } from './Breadcrumb'

interface AppNavbarProps {
  pageTitle: string
  pageSubtitle?: string
  actionsSlot?: ReactNode
}

export function AppNavbar({ pageTitle, pageSubtitle, actionsSlot }: AppNavbarProps) {
  const { tenant, usuario, signOut, darkMode, toggleDarkMode } = useTenant()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur ${
        darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-orange-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30">
              KM
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.35em] text-orange-500 mb-1">KarúPOS+</p>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className={`${darkMode ? 'font-semibold text-lg text-white' : 'font-semibold text-lg text-gray-900'}`}>{pageTitle}</span>
                <span className="text-gray-500 dark:text-gray-400 text-lg">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-lg">
                  Operando: <strong className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tenant?.nombre ?? '—'}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {actionsSlot}
            
            {/* User Menu con Dropdown */}
            <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex items-center gap-2 rounded-xl border border-orange-500 px-3 py-2 ${darkMode ? 'hover:bg-gray-900/50' : 'hover:bg-gray-50'} dark:transition`}
            >
              <UserCircle2 className="w-5 h-5 text-gray-400" />
              <div className="text-xs leading-tight text-left">
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{usuario?.nombre ?? 'Usuario'}</p>
                <p className="text-gray-500 dark:text-gray-400">{tenant?.slug ?? ''}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-200 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-hidden z-50`}>
                <button
                  onClick={() => {
                    toggleDarkMode()
                    setShowMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${darkMode ? 'text-gray-200 hover:text-black' : 'text-gray-700'} hover:bg-gray-50 dark:hover:bg-transparent dark:hover:border-l-2 dark:hover:border-orange-500 transition`}
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-600" />
                  )}
                  <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
                </button>
                
                <button
                  onClick={() => {
                    signOut()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-t border-gray-200 dark:border-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
        {/* Breadcrumb Navigation (Suspense por useSearchParams en prerender) */}
        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-800/50">
          <Suspense fallback={null}>
            <Breadcrumb />
          </Suspense>
        </div>
      </div>
    </header>
  )
}

