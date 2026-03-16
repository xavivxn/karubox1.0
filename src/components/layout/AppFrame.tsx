'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/config/routes'
import { AppNavbar } from './AppNavbar'
import { AppFooter } from './AppFooter'
import { InactiveTenantOverlay } from '@/components/ui/InactiveTenantOverlay'
import { useTenant } from '@/contexts/TenantContext'
import { THEME_CONFIG } from '@/utils/constants'

type PageInfo = {
  title: string
  subtitle?: string
  fullWidth?: boolean
}

const NAV_EXCLUDED_PATHS = ['/']

const PAGE_MAP: Array<{ test: (pathname: string) => boolean; info: PageInfo }> = [
  {
    test: (path) => path === '/home',
    info: {
      title: 'AtlasBurger',
    }
  },
  {
    test: (path) => path.startsWith('/home/admin/cocina'),
    info: {
      title: 'Cocina Virtual',
      subtitle: 'Tu cocina en 3D — Visualizá el flujo de pedidos en tiempo real.',
      fullWidth: true
    }
  },
  {
    test: (path) => path.startsWith('/home/admin'),
    info: {
      title: 'Dashboard general',
      subtitle: 'Ventas, inventario y caja en un solo lugar.'
    }
  },
  {
    test: (path) => path.startsWith('/home/pos'),
    info: {
      title: 'Punto de Venta',
      subtitle: 'Cobrá más rápido y controlá el pedido al detalle.',
      fullWidth: true
    }
  },
  {
    test: (path) => path.startsWith('/home/pedidos'),
    info: {
      title: 'Historial de pedidos',
      subtitle: 'Consultá y anulá pedidos (solo admin).'
    }
  },
  {
    test: (path) => path === '/owner',
    info: {
      title: 'Panel Owner',
      subtitle: 'Gestioná todas las lomiterías de la plataforma.'
    }
  },
  {
    test: (path) => path.startsWith('/owner/tenants'),
    info: {
      title: 'Lomiterías',
      subtitle: 'Creá y administrá los negocios registrados.'
    }
  },
]

const DEFAULT_INFO: PageInfo = {
  title: 'LomiPos',
  subtitle: 'La solución todo en uno para tu negocio.'
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { darkMode, tenant } = useTenant()

  // Prefetch POS para que el primer clic no dispare un RSC lento
  useEffect(() => {
    if (tenant) router.prefetch(ROUTES.PROTECTED.POS)
  }, [tenant, router])

  // Ocultar navbar en rutas de autenticación
  const hideNavbar = NAV_EXCLUDED_PATHS.includes(pathname)
  
  const pageInfo =
    PAGE_MAP.find((entry) => entry.test(pathname))?.info ??
    DEFAULT_INFO

  const isLoginPage = pathname === '/'

  return (
    <div
      className={`flex flex-col ${
        isLoginPage ? 'h-screen overflow-hidden' : 'min-h-screen'
      } ${
        hideNavbar
          ? THEME_CONFIG.DARK.background
          : darkMode
          ? THEME_CONFIG.DARK.background
          : THEME_CONFIG.LIGHT.background
      } ${darkMode ? "text-gray-100" : "text-gray-900"}`}
    >
      {!hideNavbar && (
        <AppNavbar pageTitle={pageInfo.title} pageSubtitle={pageInfo.subtitle} />
      )}
      <InactiveTenantOverlay />
      <main className={`flex-1 min-h-0 flex flex-col ${isLoginPage ? 'overflow-y-auto' : ''} ${pageInfo.fullWidth ? "py-4" : "px-4 py-6"}`}>
        {pageInfo.fullWidth ? (
          children
        ) : (
          <div className="max-w-7xl mx-auto space-y-10">{children}</div>
        )}
      </main>
      <AppFooter isDark={hideNavbar || darkMode} />
    </div>
  );
}


