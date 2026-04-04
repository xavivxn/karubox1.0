/**
 * Caché en memoria de la lista de usuarios del tenant (navbar).
 * Evita llamar al servidor en cada apertura del menú; se refresca por TTL o invalidación.
 */

import { listUsuariosMyTenant, type UsuarioDelTenant } from '@/app/actions/tenant'

const TTL_MS = 5 * 60 * 1000

type Entry = { usuarios: UsuarioDelTenant[]; fetchedAt: number }

const store = new Map<string, Entry>()

function isFresh(entry: Entry): boolean {
  return Date.now() - entry.fetchedAt < TTL_MS
}

export function invalidateUsuariosDelTenantCache(tenantId: string): void {
  store.delete(tenantId)
}

export function setUsuariosDelTenantCache(tenantId: string, usuarios: UsuarioDelTenant[]): void {
  store.set(tenantId, { usuarios, fetchedAt: Date.now() })
}

export function getUsuariosDelTenantCacheSnapshot(tenantId: string): UsuarioDelTenant[] | null {
  const e = store.get(tenantId)
  return e && isFresh(e) ? e.usuarios : null
}

/**
 * Devuelve datos en caché si siguen vigentes; si no, pide al servidor.
 * Con `force: true` siempre red.
 */
export async function loadUsuariosDelTenantCached(
  tenantId: string | null | undefined,
  options?: { force?: boolean }
): Promise<{ error: string | null; usuarios: UsuarioDelTenant[] }> {
  if (!tenantId) return { error: null, usuarios: [] }

  if (!options?.force) {
    const e = store.get(tenantId)
    if (e && isFresh(e)) {
      return { error: null, usuarios: e.usuarios }
    }
  }

  const { error, usuarios } = await listUsuariosMyTenant()
  if (!error) {
    store.set(tenantId, { usuarios, fetchedAt: Date.now() })
  }
  return { error, usuarios }
}
