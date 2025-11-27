import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { posService } from '../services/posService'
import type { Categoria, Producto, FeedbackState } from '../types/pos.types'
import { buildUnexpectedErrorState } from '../utils/error.utils'

export function usePOSData() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const { tenant, loading: tenantLoading } = useTenant()

  useEffect(() => {
    async function loadData() {
      if (tenantLoading || !tenant) return

      try {
        const [cats, prods] = await Promise.all([
          posService.loadCategorias(tenant.id),
          posService.loadProductos(tenant.id)
        ])

        setCategorias(cats)
        setProductos(prods)
      } catch (error) {
        console.error('Error cargando datos:', error)
        setFeedback(buildUnexpectedErrorState('No pudimos cargar el catálogo', error))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [tenant, tenantLoading])

  return {
    categorias,
    productos,
    loading,
    feedback,
    setFeedback
  }
}
