import { createClient } from '@supabase/supabase-js'

// TODO: Configurar variables de entorno en .env.local
// NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
// NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente de Supabase para operaciones del lado del cliente
// Una vez que tengas las credenciales de Supabase:
// 1. Crea un proyecto en https://supabase.com
// 2. Copia la URL y la ANON KEY del proyecto
// 3. Créalas en el archivo .env.local en la raíz del proyecto

