/**
 * Definición centralizada de todas las rutas de la aplicación
 */

export const ROUTES = {
  // Rutas públicas (sin autenticación)
  PUBLIC: {
    LOGIN: '/',
  },

  // Rutas protegidas (requieren autenticación)
  PROTECTED: {
    HOME: '/home',
    POS: '/home/pos',
    PEDIDOS: '/home/pedidos',
    ADMIN: '/home/admin',
    CLIENTES: '/home/admin/clientes',
    COCINA: '/home/admin/cocina',
    OWNER: '/owner',
    // KDS: '/home/kds',
    // INVENTARIO: '/home/dashboard/inventario',
    // REPORTES: '/home/dashboard/reportes',
  },

  /** Query param para breadcrumb de Cocina 3D: 'home' = desde Inicio, 'admin' = desde Administración */
  COCINA_FROM: {
    HOME: 'home',
    ADMIN: 'admin',
  } as const,

  /** Query param para breadcrumb de Clientes: 'home' = desde Inicio, 'admin' = desde Administración */
  CLIENTES_FROM: {
    HOME: 'home',
    ADMIN: 'admin',
  } as const,

  /** Query param para breadcrumb de Historial de pedidos: 'home' = desde Inicio, 'pos' = desde Punto de Venta */
  PEDIDOS_FROM: {
    HOME: 'home',
    POS: 'pos',
  } as const,

  // Rutas de API (futuro)
  API: {
    AUTH: '/api/auth',
    PRODUCTOS: '/api/productos',
    PEDIDOS: '/api/pedidos',
    CLIENTES: '/api/clientes',
  },
} as const

/**
 * Lista de rutas públicas que no requieren autenticación
 */
export const PUBLIC_ROUTES = [
  ROUTES.PUBLIC.LOGIN,
] as const

/**
 * Lista de rutas protegidas que requieren autenticación
 */
export const PROTECTED_ROUTES = Object.values(ROUTES.PROTECTED)

/**
 * Verifica si una ruta es pública
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
}

/**
 * Verifica si una ruta es protegida
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route))
}

/**
 * Obtiene la ruta base de una ruta completa
 * Ejemplo: /home/pos/123 -> /home/pos
 */
export function getBaseRoute(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length <= 2) return pathname
  return `/${segments.slice(0, 2).join('/')}`
}
