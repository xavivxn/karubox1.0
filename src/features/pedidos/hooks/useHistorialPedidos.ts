'use client'

import { useState, useCallback } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { pedidosService } from '../services/pedidosService'
import type { HistorialPedidosFilters, PedidoParaHistorial } from '../types/pedidos.types'

function getDefaultFilters(): HistorialPedidosFilters {
  const today = new Date().toISOString().slice(0, 10)
  return {
    fechaDesde: today,
    fechaHasta: today,
    estadoPedido: 'todos',
    numeroPedido: ''
  }
}

export function useHistorialPedidos() {
  const { tenant } = useTenant()
  const [pedidos, setPedidos] = useState<PedidoParaHistorial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<HistorialPedidosFilters>(getDefaultFilters)

  const load = useCallback(
    async (appliedFilters?: HistorialPedidosFilters) => {
      if (!tenant?.id) return
      const f = appliedFilters ?? filters
      setLoading(true)
      setError(null)
      const { data, error: err } = await pedidosService.listForHistorial(tenant.id, f)
      setLoading(false)
      if (err) {
        setError(err.message)
        setPedidos([])
        return
      }
      setPedidos(data)
    },
    [tenant?.id]
  )


  const setFilter = useCallback(<K extends keyof HistorialPedidosFilters>(
    key: K,
    value: HistorialPedidosFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters())
  }, [])

  return {
    pedidos,
    loading,
    error,
    filters,
    setFilter,
    resetFilters,
    load
  }
}
