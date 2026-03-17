'use client'

import { ReactNode, Suspense, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, UserCircle2, Sun, Moon, ChevronDown, Pencil, Users } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { Breadcrumb } from './Breadcrumb'
import { LOGIN_STRINGS } from '@/utils/strings'
import { ROUTES } from '@/config/routes'
import { listUsuariosMyTenant, updateNombreUsuarioMyTenant, type UsuarioDelTenant } from '@/app/actions/tenant'

const ROL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  cajero: 'Cajero',
  cocinero: 'Cocinero',
  repartidor: 'Repartidor',
}

interface AppNavbarProps {
  pageTitle: string
  pageSubtitle?: string
  actionsSlot?: ReactNode
}

export function AppNavbar({ pageTitle, pageSubtitle, actionsSlot }: AppNavbarProps) {
  const { tenant, usuario, signOut, darkMode, toggleDarkMode, isAdmin } = useTenant()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [usuarios, setUsuarios] = useState<UsuarioDelTenant[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNombre, setEditingNombre] = useState('')
  const [savingNombre, setSavingNombre] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
        setEditingId(null)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  useEffect(() => {
    if (!showMenu) return
    listUsuariosMyTenant().then(({ usuarios: list }) => setUsuarios(list))
  }, [showMenu])

  const handleSaveNombre = async (id: string) => {
    if (editingNombre.trim() === '') return
    setSavingNombre(true)
    const { error } = await updateNombreUsuarioMyTenant(id, editingNombre.trim())
    setSavingNombre(false)
    setEditingId(null)
    if (!error) listUsuariosMyTenant().then(({ usuarios: list }) => setUsuarios(list))
  }

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
              </div>
            </div>
          </div>
          {/* Bloque unificado: negocio + rol/nombre usuario + menú */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {actionsSlot}
            <div className="relative flex items-center" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className={`
                  flex items-center gap-2 rounded-xl border min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 sm:gap-2 sm:px-2 sm:py-1.5 md:px-3 md:py-2 justify-center sm:justify-start
                  ${darkMode ? 'border-orange-500/50 hover:bg-gray-800/80' : 'border-orange-200 hover:bg-orange-50/80'}
                `}
                title={`${tenant?.nombre ?? ''} · ${usuario?.nombre ?? 'Usuario'}`}
              >
                {/* Foto del local + nombre del negocio */}
                {tenant && (
                  <>
                    {tenant.logo_url ? (
                      <img
                        src={tenant.logo_url}
                        alt=""
                        className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700"
                        onError={(e) => {
                          const el = e.currentTarget
                          el.style.display = 'none'
                          const fallback = el.nextElementSibling
                          if (fallback instanceof HTMLElement) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <span
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm flex-shrink-0 ${tenant.logo_url ? 'hidden' : ''}`}
                    >
                      {(tenant.nombre ?? 'N').charAt(0).toUpperCase()}
                    </span>
                    <span className={`hidden sm:inline text-sm font-semibold truncate max-w-[90px] md:max-w-[120px] ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {tenant.nombre ?? '—'}
                    </span>
                  </>
                )}
                {/* Separador + Rol y nombre del usuario */}
                <span className="hidden sm:inline w-px h-5 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                <UserCircle2 className="w-5 h-5 shrink-0 text-gray-400 sm:w-5 sm:h-5" />
                <div className="hidden sm:block text-xs leading-tight text-left min-w-0">
                  <p className={`font-semibold truncate max-w-[100px] md:max-w-[140px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {usuario?.nombre ?? 'Usuario'}
                  </p>
                  <p className={`truncate max-w-[100px] md:max-w-[140px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {usuario?.rol ? ROL_LABELS[usuario.rol] ?? usuario.rol : '—'}
                  </p>
                </div>
                <ChevronDown className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} shadow-xl overflow-hidden z-50`}>
                  {/* Rol y nombre del usuario actual */}
                  <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rol</p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{usuario?.rol ? ROL_LABELS[usuario.rol] ?? usuario.rol : '—'}</p>
                    <p className={`text-xs uppercase tracking-wider mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nombre</p>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{usuario?.nombre ?? '—'}</p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => { router.push(ROUTES.PROTECTED.CONFIGURACION); setShowMenu(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-50'} transition border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                    >
                      <Pencil className="w-4 h-4 shrink-0" />
                      <span>Configuración del negocio</span>
                    </button>
                  )}
                  {/* Usuarios del local */}
                  <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Users className="w-3.5 h-3.5" />
                      Usuarios del local
                    </p>
                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                      {usuarios.map((u) => (
                        <li key={u.id} className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                          {editingId === u.id ? (
                            <input
                              type="text"
                              value={editingNombre}
                              onChange={(e) => setEditingNombre(e.target.value)}
                              onBlur={() => handleSaveNombre(u.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNombre(u.id); if (e.key === 'Escape') setEditingId(null) }}
                              disabled={savingNombre}
                              className={`flex-1 min-w-0 text-sm px-2 py-1 rounded border ${darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                              autoFocus
                            />
                          ) : (
                            <>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{u.nombre}</p>
                                <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{ROL_LABELS[u.rol] ?? u.rol}</p>
                              </div>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => { setEditingId(u.id); setEditingNombre(u.nombre) }}
                                  className="p-1 rounded hover:bg-gray-600/50 dark:hover:bg-gray-500/50 text-gray-500"
                                  aria-label="Editar nombre"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => { toggleDarkMode(); setShowMenu(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-50'} transition`}
                  >
                    {darkMode ? <Sun className="w-4 h-4 text-yellow-500 shrink-0" /> : <Moon className="w-4 h-4 text-gray-600 shrink-0" />}
                    <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { signOut(); setShowMenu(false) }}
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

