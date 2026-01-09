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
  console.log('🚀 [GUARD] requireAuth iniciado')
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('👤 [GUARD] Usuario de Supabase:', user ? user.email : 'null', 'Error:', error)
  
  if (!user) {
    console.log('❌ [GUARD] No hay usuario, redirigiendo a login')
    redirect(ROUTES.PUBLIC.LOGIN)
  }
  
  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()
  
  console.log('📋 [GUARD] Usuario de DB:', usuario ? `${usuario.email} (${usuario.rol})` : 'null', 'Error:', usuarioError)
  
  if (!usuario || !usuario.activo) {
    console.log('❌ [GUARD] Usuario no encontrado o inactivo, redirigiendo a login')
    redirect(ROUTES.PUBLIC.LOGIN)
  }
  
  console.log('✅ [GUARD] Usuario autenticado:', usuario.email, 'Rol:', usuario.rol)
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
