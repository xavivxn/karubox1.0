'use client'

import { ReactNode, Suspense, useState, useEffect, useRef } from 'react'
import { LogOut, Menu, UserCircle2, Sun, Moon, BarChart3, ChevronDown } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { Breadcrumb } from './Breadcrumb'
import { LOGIN_STRINGS } from '@/utils/strings'

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
      <div className="max-w-7xl mx-auto px-3 py-2.5 sm:px-4 sm:py-3 md:py-4">
        <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
          {/* Logo + título — compacto en móvil */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/30 sm:h-10 sm:w-10 sm:text-xl md:h-12 md:w-12 md:rounded-2xl">
              🍔
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-orange-500 mb-0.5 sm:text-xs sm:tracking-[0.35em] sm:mb-1">
                {LOGIN_STRINGS.LOGIN_TITLE}
              </p>
              <div className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm flex-wrap">
                <span className={`truncate font-semibold sm:text-base md:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {pageTitle}
                </span>
                <span className="hidden sm:inline text-gray-500 dark:text-gray-400">•</span>
                <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
                  Operando: <strong className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tenant?.nombre ?? '—'}</strong>
                </span>
              </div>
            </div>
          </div>
          {/* Acciones + menú usuario */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {actionsSlot}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                title={`${usuario?.nombre ?? 'Usuario'} · ${tenant?.slug ?? ''}`}
                className={`flex items-center rounded-xl border border-orange-500 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 justify-center sm:justify-start ${darkMode ? 'hover:bg-gray-900/50' : 'hover:bg-gray-50'} transition`}
              >
                <UserCircle2 className="w-5 h-5 shrink-0 text-gray-400 sm:w-5 sm:h-5" />
                <div className="hidden sm:block text-xs leading-tight text-left">
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{usuario?.nombre ?? 'Usuario'}</p>
                  <p className="text-gray-500 dark:text-gray-400 truncate max-w-[120px] md:max-w-[160px]">{tenant?.slug ?? ''}</p>
                </div>
                <ChevronDown className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <div className={`absolute right-0 mt-2 w-52 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-lg overflow-hidden z-50`}>
                  <div className={`sm:hidden px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{usuario?.nombre ?? 'Usuario'}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Operando: {tenant?.nombre ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => {
                      toggleDarkMode()
                      setShowMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-50'} transition`}
                  >
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-yellow-500 shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-gray-600 shrink-0" />
                    )}
                    <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
                  </button>
                  <button
                    onClick={() => {
                      signOut()
                      setShowMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Breadcrumb — más compacto en móvil */}
        <div className="mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-gray-200/50 dark:border-gray-800/50">
          <Suspense fallback={null}>
            <Breadcrumb />
          </Suspense>
        </div>
      </div>
    </header>
  )
}

