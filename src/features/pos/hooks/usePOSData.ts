import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { posService } from '../services/posService'
import type { Categoria, Producto, FeedbackState } from '../types/pos.types'
import { buildUnexpectedErrorState } from '../utils/error.utils'
import { getCachedCatalog, setCachedCatalog } from '../lib/catalogCache'

export function usePOSData() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const { tenant, loading: tenantLoading } = useTenant()

  // Catálogo se carga solo al iniciar sesión (prefetch en TenantContext).
  // Aquí solo leemos de cache; si no hay cache (ej. prefetch aún no terminó), hacemos un único fetch de fallback.
  useEffect(() => {
    if (tenantLoading || !tenant) return

    const tenantId = tenant.id
    const cached = getCachedCatalog(tenantId)

    if (cached) {
      setCategorias(cached.categorias)
      setProductos(cached.productos)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function loadData() {
      try {
        const [cats, prods, comboMap] = await Promise.all([
          posService.loadCategorias(tenantId),
          posService.loadProductos(tenantId),
          posService.loadComboItems(tenantId)
        ])
        if (cancelled) return

        // Inyectar combo_items en los productos que son combos
        const productosConCombos = prods.map((p) => {
          const items = comboMap.get(p.id)
          return items && items.length > 0 ? { ...p, combo_items: items } : p
        })

        setCachedCatalog(tenantId, cats, productosConCombos)
        setCategorias(cats)
        setProductos(productosConCombos)
      } catch (error) {
        if (!cancelled) {
          console.error('Error cargando datos:', error)
          setFeedback(buildUnexpectedErrorState('No pudimos cargar el catálogo', error))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [tenant, tenantLoading])

  return {
    categorias,
    productos,
    loading,
    feedback,
    setFeedback
  }
}
