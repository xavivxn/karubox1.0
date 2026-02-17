'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AppNavbar } from './AppNavbar'
import { AppFooter } from './AppFooter'
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
  // {
  //   test: (path) => path.startsWith('/admin/clientes'),
  //   info: {
  //     title: 'Clientes & Fidelidad',
  //     subtitle: 'Segmentá, premiá y entendé el comportamiento de tus fans.'
  //   }
  // },
  // {
  //   test: (path) => path.startsWith('/kds'),
  //   info: {
  //     title: 'Pantalla de cocina',
  //     subtitle: 'Pedidos en tiempo real para producción.',
  //     fullWidth: true
  //   }
  // },
]

const DEFAULT_INFO: PageInfo = {
  title: 'LomiPos',
  subtitle: 'La solución todo en uno para tu negocio.'
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { darkMode } = useTenant()

  // Solo ocultar navbar en la ruta raíz (login)
  const hideNavbar = pathname === '/'
  
  const pageInfo =
    PAGE_MAP.find((entry) => entry.test(pathname))?.info ??
    DEFAULT_INFO

  return (
    <div
      className={`min-h-screen flex flex-col ${
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
      <main className={`flex-1 ${pageInfo.fullWidth ? "py-4" : "px-4 py-6"}`}>
        {pageInfo.fullWidth ? (
          children
        ) : (
          <div className="max-w-7xl mx-auto space-y-10">{children}</div>
        )}
      </main>
      {!hideNavbar && <AppFooter />}
    </div>
  );
}


