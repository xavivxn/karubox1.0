'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, Home, Users, ShoppingCart, LayoutDashboard, ChefHat } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { ROUTES } from '@/config/routes'

interface BreadcrumbItem {
  label: string
  path: string
  icon?: React.ReactNode
}

export function Breadcrumb() {
  const pathname = usePathname()
  const router = useRouter()
  const { darkMode, isAdmin } = useTenant()

  // Construir items del breadcrumb basado en la ruta
  const items: BreadcrumbItem[] = []
  
  // Solo agregar "Inicio" si el usuario es admin
  if (isAdmin) {
    items.push({
      label: 'Inicio',
      path: ROUTES.PROTECTED.HOME,
      icon: <Home className="w-4 h-4" />,
    })
  }

  // Construir breadcrumb dinámicamente según la ruta
  if (pathname.startsWith('/home/admin')) {
    // Agregar Administración
    items.push({
      label: 'Administración',
      path: '/home/admin',
      icon: <LayoutDashboard className="w-4 h-4" />,
    })
    
    // Si hay subrutas, agregarlas
    if (pathname === '/home/admin/clientes') {
      items.push({
        label: 'Clientes',
        path: '/home/admin/clientes',
        icon: <Users className="w-4 h-4" />,
      })
    }
  } else if (pathname.startsWith('/home/pos')) {
    items.push({
      label: 'Punto de Venta',
      path: '/home/pos',
      icon: <ShoppingCart className="w-4 h-4" />,
    })
  } else if (pathname.startsWith('/home/kds')) {
    items.push({
      label: 'Cocina',
      path: '/home/kds',
      icon: <ChefHat className="w-4 h-4" />,
    })
  }

  const handleClick = (path: string, isLast: boolean) => {
    if (!isLast) {
      router.push(path)
    }
  }

  return (
    <nav
      className={`flex items-center gap-1.5 text-sm ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <div key={item.path} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight
                className={`w-4 h-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`}
              />
            )}
            <button
              onClick={() => handleClick(item.path, isLast)}
              disabled={isLast}
              className={`flex items-center gap-1.5 transition-colors ${
                isLast
                  ? `${
                      darkMode
                        ? 'text-white font-semibold cursor-default'
                        : 'text-gray-900 font-semibold cursor-default'
                    }`
                  : `${
                      darkMode
                        ? 'text-gray-400 hover:text-orange-400'
                        : 'text-gray-600 hover:text-orange-600'
                    } hover:underline`
              }`}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          </div>
        )
      })}
    </nav>
  )
}
