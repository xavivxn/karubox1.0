'use server'

import { createClient } from '@/lib/supabase/server'
import { getPostLoginRoute } from '@/config'
import type { UserRole } from '@/config/routing'

/**
 * Server Action para iniciar sesión
 * IMPORTANTE: No redirige aquí, retorna la ruta para que el cliente haga window.location.href
 * Esto es necesario con @supabase/ssr para sincronizar cookies correctamente
 */
export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Obtener el rol del usuario para determinar la ruta
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('auth_user_id', user.id)
      .single()

    if (usuario?.rol) {
      const defaultRoute = getPostLoginRoute(usuario.rol as UserRole)
      return { success: true, redirectTo: defaultRoute }
    }
  }

  return { success: true, redirectTo: '/home' }
}

/**
 * Server Action para cerrar sesión
 * Retorna success para que el cliente haga window.location.href
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  return { success: true }
}
