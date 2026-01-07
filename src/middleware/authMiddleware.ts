import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { ROUTES, isPublicRoute, getPostLoginRoute, getLogoutRoute, hasRoleAccess, getUnauthorizedRedirect } from '@/config'
import type { UserRole } from '@/config/routing'

/**
 * Middleware de autenticación y autorización
 * 
 * Responsabilidades:
 * 1. Actualizar sesión de Supabase
 * 2. Verificar sesión de usuario
 * 3. Proteger rutas que requieren autenticación
 * 4. Redirigir según rol después del login
 * 5. Validar permisos de acceso por rol
 * 6. Verificar tenant y estado activo del usuario
 */
export async function authMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Actualizar sesión de Supabase
  const { supabase, user, response } = await updateSession(req)

  const isPublic = isPublicRoute(pathname)

  // Si no hay usuario y no está en una ruta pública → redirect a login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL(ROUTES.PUBLIC.LOGIN, req.url))
  }

  // Si hay usuario y está en una ruta pública (login) → redirect según rol
  if (user && isPublic) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('auth_user_id', user.id)
      .single()

    if (usuario?.rol) {
      const defaultRoute = getPostLoginRoute(usuario.rol as UserRole)
      return NextResponse.redirect(new URL(defaultRoute, req.url))
    }
    
    // Fallback: ir a home
    return NextResponse.redirect(new URL(ROUTES.PROTECTED.HOME, req.url))
  }

  // Si hay usuario en ruta protegida, verificar usuario y permisos
  if (user && !isPublic) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id, rol, activo')
      .eq('auth_user_id', user.id)
      .single()

    // Si no hay usuario vinculado o está inactivo → logout
    if (!usuario || !usuario.activo) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL(getLogoutRoute(), req.url))
    }

    // Verificar si el rol tiene acceso a esta ruta
    const userRole = usuario.rol as UserRole
    console.log('🔒 Middleware - Verificando acceso:', { userRole, pathname })
    
    const hasAccess = hasRoleAccess(userRole, pathname)
    console.log('🔒 Resultado hasRoleAccess:', hasAccess)
    
    if (!hasAccess) {
      const redirectUrl = getUnauthorizedRedirect(userRole)
      console.log('❌ Acceso denegado. Redirigiendo a:', redirectUrl)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
    
    console.log('✅ Acceso permitido a:', pathname)
  }

  return response
}
