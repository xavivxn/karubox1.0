import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env/supabase'

/**
 * Cliente de Supabase para componentes del cliente
 * Úsalo en Client Components, hooks y contextos
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())
}
