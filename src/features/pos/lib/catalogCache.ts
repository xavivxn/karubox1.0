import { posService } from '../services/posService'
import type { Categoria, Producto } from '../types/pos.types'

export const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

export type CatalogEntry = {
  categorias: Categoria[]
  productos: Producto[]
  at: number
}

const cache = new Map<string, CatalogEntry>()
const inflightLoads = new Map<string, Promise<CatalogEntry>>()

export function getCachedCatalog(tenantId: string): CatalogEntry | undefined {
  return cache.get(tenantId)
}

export function setCachedCatalog(
  tenantId: string,
  categorias: Categoria[],
  productos: Producto[]
): void {
  cache.set(tenantId, { categorias, productos, at: Date.now() })
}

/**
 * Prefetch categorías, productos y combo items en segundo plano. Útil al cargar
 * el tenant para que la primera entrada al POS tenga datos en caché.
 */
export function prefetchPOSCatalog(tenantId: string): void {
  void loadCatalogWithCache(tenantId)
}

export async function loadCatalogWithCache(tenantId: string): Promise<CatalogEntry> {
  const cached = getCachedCatalog(tenantId)
  if (cached && Date.now() - cached.at <= CACHE_TTL_MS) {
    return cached
  }

  const inflight = inflightLoads.get(tenantId)
  if (inflight) return inflight

  const promise = Promise.all([
    posService.loadCategorias(tenantId),
    posService.loadProductos(tenantId),
    posService.loadComboItems(tenantId)
  ])
    .then(([categorias, productos, comboMap]) => {
      const productosConCombos = productos.map((p) => {
        const items = comboMap.get(p.id)
        return items && items.length > 0 ? { ...p, combo_items: items } : p
      })
      const next = { categorias, productos: productosConCombos, at: Date.now() }
      cache.set(tenantId, next)
      return next
    })
    .finally(() => {
      inflightLoads.delete(tenantId)
    })

  inflightLoads.set(tenantId, promise)
  return promise
}
