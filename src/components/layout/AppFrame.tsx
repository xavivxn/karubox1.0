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
      title: 'Cocina 3D',
      subtitle: 'Visualizá el flujo de pedidos en tu cocina 3D en tiempo real.',
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
    test: (path) => path.startsWith('/home/configuracion'),
    info: {
      title: 'Configuración del negocio',
      subtitle: 'Datos del local, fiscales y contacto.'
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

  // POS necesita scroll interno para que `position: sticky` funcione en el contenedor correcto.
  // No aplicamos esto al resto de la app para no afectar el scrollbar global.
  const isPosPage = pathname.startsWith('/home/pos')
  
  const pageInfo =
    PAGE_MAP.find((entry) => entry.test(pathname))?.info ??
    DEFAULT_INFO

  const isLoginPage = pathname === '/'

  return (
    <div
      className={`flex flex-col ${
        isLoginPage
          ? 'min-h-[100dvh] min-h-screen overflow-y-auto'
          : isPosPage
            ? 'h-screen min-h-0 overflow-hidden'
            : 'min-h-screen'
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
      <main
        className={`flex flex-col ${isLoginPage ? '' : 'flex-1 min-h-0 min-w-0'} ${
          pageInfo.fullWidth ? (isPosPage ? 'py-0' : 'py-4') : 'px-4 py-6'
        } ${!isLoginPage && isPosPage ? 'overflow-hidden' : ''}`}
        style={isLoginPage ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}
      >
        {pageInfo.fullWidth ? (
          children
        ) : (
          <div className="w-full min-w-0 max-w-7xl mx-auto space-y-10 overflow-x-hidden">{children}</div>
        )}
      </main>
      <AppFooter
        isDark={hideNavbar || darkMode}
        variant={isLoginPage ? 'login' : 'default'}
      />
    </div>
  );
}


