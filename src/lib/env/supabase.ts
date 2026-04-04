/**
 * Resuelve URL, anon key y service role según NEXT_PUBLIC_SUPABASE_TARGET (prod | preprod).
 * Usar en cliente (URL + anon) y servidor (URL + anon + service role).
 */

export type SupabaseTarget = 'prod' | 'preprod'

function normalizeTarget(raw: string | undefined): SupabaseTarget {
  const t = (raw ?? 'prod').trim().toLowerCase()
  if (t === 'preprod') return 'preprod'
  return 'prod'
}

export function getSupabaseTarget(): SupabaseTarget {
  return normalizeTarget(process.env.NEXT_PUBLIC_SUPABASE_TARGET)
}

export function isPreprod(): boolean {
  return getSupabaseTarget() === 'preprod'
}

export function getSupabaseUrl(): string {
  const t = getSupabaseTarget()
  const url =
    t === 'preprod'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL_PREPROD
      : process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url?.trim()) {
    throw new Error(
      t === 'preprod'
        ? 'Falta NEXT_PUBLIC_SUPABASE_URL_PREPROD (con NEXT_PUBLIC_SUPABASE_TARGET=preprod).'
        : 'Falta NEXT_PUBLIC_SUPABASE_URL.'
    )
  }
  return url.trim()
}

export function getSupabaseAnonKey(): string {
  const t = getSupabaseTarget()
  const key =
    t === 'preprod'
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PREPROD
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key?.trim()) {
    throw new Error(
      t === 'preprod'
        ? 'Falta NEXT_PUBLIC_SUPABASE_ANON_KEY_PREPROD (con NEXT_PUBLIC_SUPABASE_TARGET=preprod).'
        : 'Falta NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }
  return key.trim()
}

/** Solo servidor (Server Actions, Route Handlers, etc.). No importar en Client Components. */
export function getSupabaseServiceRoleKey(): string {
  const t = getSupabaseTarget()
  const key =
    t === 'preprod'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY_PREPROD
      : process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key?.trim()) {
    throw new Error(
      t === 'preprod'
        ? 'Falta SUPABASE_SERVICE_ROLE_KEY_PREPROD (con NEXT_PUBLIC_SUPABASE_TARGET=preprod).'
        : 'Falta SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
  return key.trim()
}
