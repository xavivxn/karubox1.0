import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { ROUTES, isPublicRoute, getPostLoginRoute, getLogoutRoute, hasRoleAccess, getUnauthorizedRedirect } from '@/config'
import type { UserRole } from '@/config/routing'

/**
 * Middleware de autenticación y autorización
 * 
 * Responsabilidades:
 * 1. Verificar sesión de usuario
 * 2. Proteger rutas que requieren autenticación
 * 3. Redirigir según rol después del login
 * 4. Validar permisos de acceso por rol
 * 5. Verificar tenant y estado activo del usuario
 */
export async function authMiddleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname
  
  // Verificar que las variables de entorno estén configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Middleware: Variables de entorno de Supabase no configuradas')
    if (pathname !== ROUTES.PUBLIC.LOGIN) {
      return NextResponse.redirect(new URL(ROUTES.PUBLIC.LOGIN, req.url))
    }
    return res
  }

  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  // Si hay error al obtener la sesión, redirigir a login
  if (sessionError) {
    console.error('❌ Middleware: Error obteniendo sesión:', sessionError)
    if (pathname !== ROUTES.PUBLIC.LOGIN) {
      return NextResponse.redirect(new URL(ROUTES.PUBLIC.LOGIN, req.url))
    }
    return res
  }

  const isPublic = isPublicRoute(pathname)

  // Si no hay sesión y no está en una ruta pública → redirect a login
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL(ROUTES.PUBLIC.LOGIN, req.url))
  }

  // Si hay sesión y está en una ruta pública (login) → redirect según rol
  if (session && isPublic) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('auth_user_id', session.user.id)
      .single()

    if (usuario?.rol) {
      const defaultRoute = getPostLoginRoute(usuario.rol as UserRole)
      return NextResponse.redirect(new URL(defaultRoute, req.url))
    }
    
    // Fallback: ir a home
    return NextResponse.redirect(new URL(ROUTES.PROTECTED.HOME, req.url))
  }

  // Si hay sesión en ruta protegida, verificar usuario y permisos
  if (session && !isPublic) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id, rol, activo')
      .eq('auth_user_id', session.user.id)
      .single()

    // Si no hay usuario vinculado o está inactivo → logout
    if (!usuario || !usuario.activo) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL(getLogoutRoute(), req.url))
    }

    // Verificar si el rol tiene acceso a esta ruta
    const userRole = usuario.rol as UserRole
    if (!hasRoleAccess(userRole, pathname)) {
      const redirectUrl = getUnauthorizedRedirect(userRole)
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
  }

  return res
}
