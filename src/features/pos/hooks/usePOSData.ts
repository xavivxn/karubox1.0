import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { posService } from '../services/posService'
import type { Categoria, Producto, FeedbackState } from '../types/pos.types'
import { buildUnexpectedErrorState } from '../utils/error.utils'
import {
  getCachedCatalog,
  setCachedCatalog,
  CACHE_TTL_MS
} from '../lib/catalogCache'

export function usePOSData() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const { tenant, loading: tenantLoading } = useTenant()

  useEffect(() => {
    if (tenantLoading || !tenant) return

    const tenantId = tenant.id
    const cached = getCachedCatalog(tenantId)
    const useCache = cached && Date.now() - cached.at < CACHE_TTL_MS

    if (useCache) {
      setCategorias(cached.categorias)
      setProductos(cached.productos)
      setLoading(false)
      // Revalidar en segundo plano
      Promise.all([
        posService.loadCategorias(tenantId),
        posService.loadProductos(tenantId)
      ])
        .then(([cats, prods]) => {
          setCachedCatalog(tenantId, cats, prods)
          setCategorias(cats)
          setProductos(prods)
        })
        .catch(() => {})
      return
    }

    let cancelled = false
    setLoading(true)

    async function loadData() {
      try {
        const [cats, prods] = await Promise.all([
          posService.loadCategorias(tenantId),
          posService.loadProductos(tenantId)
        ])
        if (cancelled) return
        setCachedCatalog(tenantId, cats, prods)
        setCategorias(cats)
        setProductos(prods)
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
