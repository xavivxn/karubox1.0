import { createClient } from '@supabase/supabase-js'

// Configurar variables de entorno
// Ver: ENV_CONFIG.md para instrucciones de configuración

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Credenciales de Supabase no configuradas. Ver ENV_CONFIG.md para instrucciones.'
  )
}

// Cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
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

