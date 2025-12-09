import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/features/auth/view/LoginForm'
import { getPostLoginRoute } from '@/config'
import type { UserRole } from '@/config/routing'

export default async function LoginPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si ya hay sesión, redirigir según el rol
  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('auth_user_id', user.id)
      .single()

    if (usuario?.rol) {
      const defaultRoute = getPostLoginRoute(usuario.rol as UserRole)
      redirect(defaultRoute)
    } else {
      redirect('/home')
    }
  }

  return <LoginForm />
}