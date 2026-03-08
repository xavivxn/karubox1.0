import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service role key.
 * SOLO usar en Server Actions y Server Components — NUNCA en el cliente.
 * Bypassa RLS y permite operaciones de administración como crear usuarios.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Faltan variables de entorno: SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
