'use server'

import { createClient } from '@/lib/supabase/server'
import type { AchievementStore } from '@/features/cocina/utils/achievements'

export type CocinaAchievementActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

const MAX_STORE_BYTES = 900_000

function assertStoreShape(raw: unknown): raw is AchievementStore {
  if (!raw || typeof raw !== 'object') return false
  const o = raw as Record<string, unknown>
  return (
    typeof o.unlocked === 'object' &&
    o.unlocked !== null &&
    Array.isArray(o.dailyUnlocked) &&
    typeof o.sessionHistory === 'object' &&
    o.sessionHistory !== null &&
    typeof o.lifetimeStats === 'object' &&
    o.lifetimeStats !== null
  )
}

/**
 * Lee el estado de logros Cocina 3D persistido en BD para el tenant.
 */
export async function getCocinaAchievementStoreAction(
  tenantId: string | null
): Promise<CocinaAchievementActionResult<{ store: AchievementStore; updatedAt: string } | null>> {
  if (!tenantId) return { success: true, data: null }

  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('cocina_achievement_store')
      .select('store, updated_at')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) {
      console.error('getCocinaAchievementStoreAction:', error)
      return { success: false, error: error.message }
    }
    if (!data?.store) return { success: true, data: null }

    const store = data.store as unknown
    if (!assertStoreShape(store)) {
      return { success: true, data: null }
    }
    return {
      success: true,
      data: {
        store,
        updatedAt: (data as { updated_at: string }).updated_at,
      },
    }
  } catch (e) {
    console.error('getCocinaAchievementStoreAction:', e)
    return { success: false, error: 'Error al leer logros.' }
  }
}

/**
 * Guarda / actualiza el estado completo de logros en BD (mismo tenant que el usuario).
 */
export async function upsertCocinaAchievementStoreAction(
  tenantId: string,
  store: AchievementStore
): Promise<CocinaAchievementActionResult> {
  if (!tenantId) return { success: false, error: 'Tenant inválido.' }
  if (!assertStoreShape(store)) return { success: false, error: 'Datos de logros inválidos.' }

  const json = JSON.stringify(store)
  if (json.length > MAX_STORE_BYTES) {
    return { success: false, error: 'Estado de logros demasiado grande.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No hay sesión activa.' }

  const { data: usuario, error: errUsuario } = await supabase
    .from('usuarios')
    .select('id, tenant_id')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (errUsuario || !usuario || usuario.tenant_id !== tenantId) {
    return { success: false, error: 'No autorizado.' }
  }

  try {
    const { error } = await supabase.from('cocina_achievement_store').upsert(
      {
        tenant_id: tenantId,
        store: store as unknown as Record<string, unknown>,
      },
      { onConflict: 'tenant_id' }
    )
    if (error) {
      console.error('upsertCocinaAchievementStoreAction:', error)
      return { success: false, error: error.message || 'Error al guardar logros.' }
    }
    return { success: true, data: undefined }
  } catch (e) {
    console.error('upsertCocinaAchievementStoreAction:', e)
    return { success: false, error: 'Error al guardar logros.' }
  }
}
