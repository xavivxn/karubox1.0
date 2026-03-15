'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, Home, Users, ShoppingCart, LayoutDashboard, ChefHat, Store, PlusCircle, Package, UserCog, Building2, FileText } from 'lucide-react'
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
  const searchParams = useSearchParams()
  const { darkMode, isAdmin } = useTenant()

  const items: BreadcrumbItem[] = []

  if (pathname.startsWith('/owner')) {
    // Home siempre es el primer item para el rol owner
    items.push({
      label: 'Home',
      path: ROUTES.PROTECTED.OWNER,
      icon: <Home className="w-4 h-4" />,
    })

    if (pathname === '/owner/tenants/new') {
      items.push({
        label: 'Crear lomitería',
        path: '/owner/tenants/new',
        icon: <PlusCircle className="w-4 h-4" />,
      })
    } else if (pathname.match(/^\/owner\/tenants\/[^/]+$/) && !pathname.endsWith('/new')) {
      const tenantName = searchParams.get('name')
      items.push({
        label: tenantName ?? 'Detalle del negocio',
        path: pathname,
        icon: <Building2 className="w-4 h-4" />,
      })
    } else if (pathname.includes('/owner/tenants/') && pathname.endsWith('/productos')) {
      const tenantName = searchParams.get('name')
      items.push({
        label: tenantName ?? 'Gestionar productos',
        path: pathname,
        icon: tenantName ? <Store className="w-4 h-4" /> : <Package className="w-4 h-4" />,
      })
    } else if (pathname.includes('/owner/tenants/') && pathname.endsWith('/cajeros')) {
      // Extraer tenantId para construir la ruta hacia productos
      const match = pathname.match(/\/owner\/tenants\/([^/]+)\/cajeros/)
      const tenantId = match?.[1]
      const tenantName = searchParams.get('name')
      if (tenantId) {
        items.push({
          label: tenantName ?? 'Gestionar productos',
          path: `/owner/tenants/${tenantId}/productos${tenantName ? `?name=${encodeURIComponent(tenantName)}` : ''}`,
          icon: <Store className="w-4 h-4" />,
        })
      }
      items.push({
        label: 'Usuarios',
        path: pathname,
        icon: <UserCog className="w-4 h-4" />,
      })
    }
  } else {
    // Rutas /home: "Inicio" solo si es admin
    if (isAdmin) {
      items.push({
        label: 'Inicio',
        path: ROUTES.PROTECTED.HOME,
        icon: <Home className="w-4 h-4" />,
      })
    }

    if (pathname.startsWith('/home/admin')) {
      items.push({
        label: 'Administración',
        path: '/home/admin',
        icon: <LayoutDashboard className="w-4 h-4" />,
      })

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
    } else if (pathname.startsWith('/home/pedidos')) {
      items.push({
        label: 'Historial de pedidos',
        path: '/home/pedidos',
        icon: <FileText className="w-4 h-4" />,
      })
    } else if (pathname.startsWith('/home/kds')) {
      items.push({
        label: 'Cocina',
        path: '/home/kds',
        icon: <ChefHat className="w-4 h-4" />,
      })
    }
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
