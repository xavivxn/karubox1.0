import { useEffect, useMemo, useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import type { Categoria, Producto, FeedbackState } from '../types/pos.types'
import { buildUnexpectedErrorState } from '../utils/error.utils'
import { loadCatalogWithCache } from '../lib/catalogCache'
import { useQuery } from '@tanstack/react-query'
import { measureEnd, measureStart } from '@/lib/perf/metrics'

export function usePOSData() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const { tenant, loading: tenantLoading } = useTenant()

  const tenantId = tenant?.id
  const posCatalog = useQuery({
    queryKey: ['pos-catalog', tenantId],
    enabled: Boolean(tenantId) && !tenantLoading,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const startedAt = measureStart()
      const data = await loadCatalogWithCache(tenantId as string)
      measureEnd('pos.catalog.load', startedAt, {
        tenant_id: tenantId,
        categorias: data.categorias.length,
        productos: data.productos.length
      })
      return data
    }
  })

  const categorias = useMemo<Categoria[]>(() => posCatalog.data?.categorias ?? [], [posCatalog.data])
  const productos = useMemo<Producto[]>(() => posCatalog.data?.productos ?? [], [posCatalog.data])

  useEffect(() => {
    if (posCatalog.error) {
      setFeedback(buildUnexpectedErrorState('No pudimos cargar el catálogo', posCatalog.error))
    }
  }, [posCatalog.error])

  return {
    categorias,
    productos,
    loading: tenantLoading || posCatalog.isLoading,
    feedback,
    setFeedback
  }
}
