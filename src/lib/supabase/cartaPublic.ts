import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env/supabase'

/**
 * Cliente Supabase con clave **anon** (pública) para la carta QR.
 * No usa service_role: cualquier visitante o cajero logueado puede cargar la carta
 * si existe la función RPC `get_carta_public_snapshot` en la base.
 */
export function createCartaPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
