'use client'

import { useState, useCallback, useEffect } from 'react'
import { getSesionAbiertaAction, getSesionCerradaMasRecienteAction } from '@/app/actions/caja'
import type { SesionCaja } from '../types/caja.types'

interface UseEstadoCajaReturn {
  sesionAbierta: SesionCaja | null
  /** Última sesión cerrada (para mostrar resumen cuando la caja está cerrada) */
  ultimaSesionCerrada: SesionCaja | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useEstadoCaja(tenantId: string | null): UseEstadoCajaReturn {
  const [sesionAbierta, setSesionAbierta] = useState<SesionCaja | null>(null)
  const [ultimaSesionCerrada, setUltimaSesionCerrada] = useState<SesionCaja | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEstado = useCallback(async () => {
    if (!tenantId) {
      setSesionAbierta(null)
      setUltimaSesionCerrada(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const [abiertaRes, cerradaRes] = await Promise.all([
      getSesionAbiertaAction(tenantId),
      getSesionCerradaMasRecienteAction(tenantId)
    ])
    if (abiertaRes.success) setSesionAbierta(abiertaRes.data)
    else {
      setError(abiertaRes.error)
      setSesionAbierta(null)
    }
    if (cerradaRes.success) setUltimaSesionCerrada(cerradaRes.data)
    else setUltimaSesionCerrada(null)
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    fetchEstado()
  }, [fetchEstado])

  return { sesionAbierta, ultimaSesionCerrada, loading, error, refetch: fetchEstado }
}
