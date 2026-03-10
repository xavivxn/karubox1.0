/**
 * Guards de autenticación para Server Components
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/routes'
import { getPostLoginRoute, hasRoleAccess, getUnauthorizedRedirect } from '@/config/routing'
import type { UserRole } from '@/config/routing'

/**
 * Verifica autenticación y retorna usuario.
 * Redirige al login si no hay sesión o si el usuario no existe en la tabla usuarios.
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(ROUTES.PUBLIC.LOGIN)

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('id,tenant_id,auth_user_id,email,nombre,rol,activo')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (!usuario || !usuario.activo || usuarioError) redirect(ROUTES.PUBLIC.LOGIN)
  return { user, usuario }
}

/**
 * Guard exclusivo para el rol owner.
 * Redirige al login si no está autenticado, o al home del rol si no es owner.
 */
export async function requireOwner() {
  const { usuario } = await requireAuth()

  if (usuario.rol !== 'owner') {
    redirect(getPostLoginRoute(usuario.rol as UserRole))
  }

  return { usuario }
}

/**
 * Verifica que el usuario tenga acceso a una ruta específica.
 * El owner nunca pasa por aquí — usa requireOwner() para sus rutas.
 */
export async function requireRole(allowedRoles: UserRole[], currentPath: string) {
  const { usuario } = await requireAuth()
  const userRole = usuario.rol as UserRole

  // El owner no tiene acceso a rutas de tenants (/home/*)
  if (userRole === 'owner') {
    redirect(ROUTES.PROTECTED.OWNER)
  }

  if (!allowedRoles.includes(userRole)) {
    redirect(getUnauthorizedRedirect(userRole))
  }

  if (!hasRoleAccess(userRole, currentPath)) {
    redirect(getUnauthorizedRedirect(userRole))
  }

  return { user: usuario }
}
