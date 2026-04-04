import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/env/supabase'

/** Lee el claim `role` del JWT de Supabase (anon / authenticated / service_role). */
function supabaseJwtRole(jwt: string): string | null {
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(b64, 'base64').toString('utf8')
    const payload = JSON.parse(json) as { role?: string }
    return payload.role ?? null
  } catch {
    return null
  }
}

/**
 * Cliente Supabase con service role key.
 * SOLO usar en Server Actions y Server Components — NUNCA en el cliente.
 * Bypassa RLS y permite operaciones de administración como crear usuarios.
 */
export function createAdminClient() {
  const url = getSupabaseUrl()
  const serviceKey = getSupabaseServiceRoleKey()

  const role = supabaseJwtRole(serviceKey.trim())
  if (role === 'anon' || role === 'authenticated') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY tiene la clave equivocada: estás usando la clave "anon" (pública). ' +
        'En Supabase: Project Settings → API → en "Project API keys" copiá la clave "service_role" (secret), no la "anon".'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
