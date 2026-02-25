/**
 * Guards de autenticación para Server Components
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/routes'
import { getPostLoginRoute, hasRoleAccess, getUnauthorizedRedirect } from '@/config/routing'
import type { UserRole } from '@/config/routing'

/**
 * Verifica autenticación y retorna usuario
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

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
 * Verifica que el usuario tenga acceso a una ruta específica
 */
export async function requireRole(allowedRoles: UserRole[], currentPath: string) {
  const { usuario } = await requireAuth()
  const userRole = usuario.rol as UserRole

  if (!allowedRoles.includes(userRole)) {
    redirect(getUnauthorizedRedirect(userRole))
  }
  if (!hasRoleAccess(userRole, currentPath)) {
    redirect(getUnauthorizedRedirect(userRole))
  }
  return { user: usuario }
}
