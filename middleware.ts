import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Si no hay sesión y no está en una ruta pública → redirect a login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Si hay sesión y está en login → redirect según rol
  if (session && isPublicRoute) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('auth_user_id', session.user.id)
      .single()

    if (usuario) {
      switch (usuario.rol) {
        case 'admin':
          return NextResponse.redirect(new URL('/', req.url)) // Admin ve el menú principal
        case 'cajero':
          return NextResponse.redirect(new URL('/pos', req.url))
        case 'cocinero':
          return NextResponse.redirect(new URL('/kds', req.url))
        case 'repartidor':
          return NextResponse.redirect(new URL('/pos', req.url))
      }
    }
    
    // Fallback: ir a la raíz
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Si hay sesión, verificar que el usuario tenga un tenant asignado
  if (session && !isPublicRoute) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tenant_id, rol, activo')
      .eq('auth_user_id', session.user.id)
      .single()

    // Si no hay usuario vinculado o está inactivo → logout
    if (!usuario || !usuario.activo) {
      await supabase.auth.signOut()
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    // Redirección según rol (solo para la raíz)
    // Admin puede quedarse en la raíz para ver el menú
    if (req.nextUrl.pathname === '/') {
      switch (usuario.rol) {
        case 'cajero':
          return NextResponse.redirect(new URL('/pos', req.url))
        case 'cocinero':
          return NextResponse.redirect(new URL('/kds', req.url))
        case 'repartidor':
          return NextResponse.redirect(new URL('/pos', req.url))
        // Admin se queda en "/" para ver el menú principal
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

