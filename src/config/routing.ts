/**
 * Lógica de enrutamiento por roles de usuario
 */

import { ROUTES } from './routes'

export type UserRole = 'admin' | 'cajero' 
// | 'cocinero' | 'repartidor'

/**
 * Configuración de acceso por rol
 */
export const ROLE_ACCESS = {
  admin: {
    defaultRoute: ROUTES.PROTECTED.HOME,
    allowedRoutes: [
      ROUTES.PROTECTED.HOME,
      ROUTES.PROTECTED.POS,
      ROUTES.PROTECTED.ADMIN,
      // ROUTES.PROTECTED.KDS,
      // ROUTES.PROTECTED.CLIENTES,
      // ROUTES.PROTECTED.INVENTARIO,
      // ROUTES.PROTECTED.REPORTES,
    ],
  },
  cajero: {
    defaultRoute: ROUTES.PROTECTED.POS,
    allowedRoutes: [
      ROUTES.PROTECTED.POS,
      // ROUTES.PROTECTED.CLIENTES,
    ],
  },
  // cocinero: {
  //   defaultRoute: ROUTES.PROTECTED.KDS,
  //   allowedRoutes: [
  //     ROUTES.PROTECTED.KDS,
  //   ],
  // },
  // repartidor: {
  //   defaultRoute: ROUTES.PROTECTED.POS,
  //   allowedRoutes: [
  //     ROUTES.PROTECTED.POS,
  //   ],
  // },
} as const

/**
 * Obtiene la ruta por defecto según el rol del usuario
 */
export function getDefaultRouteByRole(role: UserRole): string {
  return ROLE_ACCESS[role]?.defaultRoute || ROUTES.PROTECTED.HOME
}

/**
 * Verifica si un rol tiene acceso a una ruta específica
 */
export function hasRoleAccess(role: UserRole, pathname: string): boolean {
  const roleConfig = ROLE_ACCESS[role]
  if (!roleConfig) return false

  // Admin tiene acceso a todo
  if (role === 'admin') return true

  // Verificar si la ruta está en las permitidas
  return roleConfig.allowedRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )
}

/**
 * Obtiene la ruta de redirección después del login
 */
export function getPostLoginRoute(role: UserRole): string {
  return getDefaultRouteByRole(role)
}

/**
 * Obtiene la ruta de redirección cuando no hay acceso
 */
export function getUnauthorizedRedirect(role: UserRole): string {
  return getDefaultRouteByRole(role)
}

/**
 * Ruta de logout (siempre redirige al login)
 */
export function getLogoutRoute(): string {
  return ROUTES.PUBLIC.LOGIN
}
