import { posService } from '../services/posService'
import type { Categoria, Producto, SauceProduct } from '../types/pos.types'

export const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

export type CatalogEntry = {
  categorias: Categoria[]
  productos: Producto[]
  /** Productos categoría "Salsas" (drawer carrito), precargados con el catálogo */
  salsas: SauceProduct[]
  at: number
}

const cache = new Map<string, CatalogEntry>()

export function getCachedCatalog(tenantId: string): CatalogEntry | undefined {
  return cache.get(tenantId)
}

export function setCachedCatalog(
  tenantId: string,
  categorias: Categoria[],
  productos: Producto[],
  salsas: SauceProduct[]
): void {
  cache.set(tenantId, { categorias, productos, salsas, at: Date.now() })
}

/** Actualiza solo las salsas en una entrada existente (p. ej. tras revalidar en el drawer). */
export function setCachedSalsas(tenantId: string, salsas: SauceProduct[]): void {
  const prev = cache.get(tenantId)
  if (!prev) return
  cache.set(tenantId, { ...prev, salsas, at: Date.now() })
}

/**
 * Prefetch categorías, productos y combo items en segundo plano. Útil al cargar
 * el tenant para que la primera entrada al POS tenga datos en caché.
 */
export function prefetchPOSCatalog(tenantId: string): void {
  Promise.all([
    posService.loadCategorias(tenantId),
    posService.loadProductos(tenantId),
    posService.loadComboItems(tenantId),
    posService.loadSauceProducts(tenantId).catch((): SauceProduct[] => [])
  ])
    .then(([categorias, productos, comboMap, salsas]) => {
      const productosConCombos = productos.map((p) => {
        const items = comboMap.get(p.id)
        return items && items.length > 0 ? { ...p, combo_items: items } : p
      })
      setCachedCatalog(tenantId, categorias, productosConCombos, salsas)
    })
    .catch(() => {})
}
