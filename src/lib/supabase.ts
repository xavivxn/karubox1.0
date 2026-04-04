/**
 * DEPRECATED: Este archivo está deprecado
 * Usa en su lugar:
 * - @/lib/supabase/client para componentes del cliente
 * - @/lib/supabase/server para Server Components y Server Actions
 * - @/lib/supabase/middleware para el middleware
 */

import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env/supabase'

function resolveSupabasePublic(): { url: string; anonKey: string } {
  try {
    return { url: getSupabaseUrl(), anonKey: getSupabaseAnonKey() }
  } catch {
    return {
      url: 'https://placeholder.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
    }
  }
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = resolveSupabasePublic()

if (supabaseUrl.includes('placeholder')) {
  console.error(
    '❌ ERROR: Credenciales de Supabase no configuradas.\n' +
    'Por favor configura el archivo .env.local con tus credenciales (ver .env.example).'
  )
}

// Cliente de Supabase para compatibilidad con código antiguo
// TODO: Migrar código que use este cliente a los nuevos helpers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper para verificar conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('categorias').select('count')
    if (error) throw error
    return { success: true, message: 'Conexión exitosa con Supabase' }
  } catch (error) {
    return { success: false, message: 'Error de conexión', error }
  }
}
