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
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(ROUTES.PUBLIC.LOGIN)
  }
  
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()
  
  if (!usuario || !usuario.activo) {
    redirect(ROUTES.PUBLIC.LOGIN)
  }
  
  return { user, usuario }
}

/**
 * Verifica que el usuario tenga acceso a una ruta específica
 */
export async function requireRole(allowedRoles: UserRole[], currentPath: string) {
  const { usuario } = await requireAuth()
  
  const userRole = usuario.rol as UserRole
  
  console.log('🔒 [GUARD] Verificando acceso:', { userRole, currentPath, allowedRoles })
  
  // Verificar si el rol está en la lista de permitidos
  if (!allowedRoles.includes(userRole)) {
    console.log('❌ [GUARD] Rol no permitido. Redirigiendo...')
    const redirectUrl = getUnauthorizedRedirect(userRole)
    redirect(redirectUrl)
  }
  
  // Verificar si el rol tiene acceso a esta ruta específica
  const hasAccess = hasRoleAccess(userRole, currentPath)
  
  if (!hasAccess) {
    console.log('❌ [GUARD] Sin acceso a la ruta. Redirigiendo...')
    const redirectUrl = getUnauthorizedRedirect(userRole)
    redirect(redirectUrl)
  }
  
  console.log('✅ [GUARD] Acceso permitido')
  return { user: usuario }
}
