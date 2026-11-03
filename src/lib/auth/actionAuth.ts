import { createClient } from '@/lib/supabase/server'

/**
 * Resuelve el local (tenant) y el rol del usuario a partir de la SESIÓN,
 * nunca de un argumento que manda el navegador. Usar en Server Actions y
 * Route Handlers para evitar IDOR (que alguien pase el tenant_id de otro local).
 * Devuelve tenantId null si no hay sesión, el usuario no existe o está inactivo.
 */
export async function resolveSessionTenant(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>
  tenantId: string | null
  rol: string | null
  usuarioId: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, tenantId: null, rol: null, usuarioId: null }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, tenant_id, rol, activo')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .maybeSingle()

  if (!usuario || !usuario.activo) {
    return { supabase, tenantId: null, rol: null, usuarioId: null }
  }

  return {
    supabase,
    tenantId: usuario.tenant_id ?? null,
    rol: usuario.rol ?? null,
    usuarioId: usuario.id ?? null,
  }
}
