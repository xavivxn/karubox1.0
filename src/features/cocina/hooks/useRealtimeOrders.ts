'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getOrderStage,
  type KitchenOrder,
  type KitchenStats,
} from '../utils/cocina.utils'

interface UseRealtimeOrdersParams {
  tenantId: string | undefined
}

interface RawPedido {
  id: string
  numero_pedido: number
  total: number | string
  created_at: string
  tipo: string | null
  estado_pedido: string
}

export function useRealtimeOrders({ tenantId }: UseRealtimeOrdersParams) {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [stats, setStats] = useState<KitchenStats>({
    todayTotal: 0,
    todayRevenue: 0,
    activeCount: 0,
    deliveredCount: 0,
  })
  const [newDeliveryIds, setNewDeliveryIds] = useState<string[]>([])
  const explodedRef = useRef<Set<string>>(new Set())

  const processRawOrders = useCallback(
    (raw: RawPedido[]): KitchenOrder[] =>
      raw
        .filter((o) => o.estado_pedido === 'FACT')
        .map((o) => {
          const { stage, elapsed, progress } = getOrderStage(o.created_at)
          return {
            id: o.id,
            numero_pedido: o.numero_pedido,
            total: Number(o.total) || 0,
            created_at: o.created_at,
            tipo: o.tipo || 'local',
            stage,
            elapsed,
            progress,
          }
        }),
    []
  )

  const computeStats = useCallback((list: KitchenOrder[]): KitchenStats => {
    const active = list.filter((o) => o.stage !== 'entregado').length
    const delivered = list.filter((o) => o.stage === 'entregado').length
    return {
      todayTotal: list.length,
      todayRevenue: list.reduce((s, o) => s + o.total, 0),
      activeCount: active,
      deliveredCount: delivered,
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    if (!tenantId) return
    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, total, created_at, tipo, estado_pedido')
      .eq('tenant_id', tenantId)
      .eq('estado_pedido', 'FACT')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if (data) {
      const processed = processRawOrders(data)
      setOrders(processed)
      setStats(computeStats(processed))
    }
  }, [tenantId, processRawOrders, computeStats])

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Refresh stages each 5 s & detect new deliveries
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) => {
        const updated = prev.map((o) => {
          const { stage, elapsed, progress } = getOrderStage(o.created_at)
          return { ...o, stage, elapsed, progress }
        })

        const fresh = updated.filter(
          (o) => o.stage === 'entregado' && !explodedRef.current.has(o.id)
        )
        if (fresh.length > 0) {
          fresh.forEach((o) => explodedRef.current.add(o.id))
          setNewDeliveryIds((p) => [...p, ...fresh.map((o) => o.id)])
        }

        setStats(computeStats(updated))
        return updated
      })
    }, 5_000)

    return () => clearInterval(interval)
  }, [computeStats])

  // Realtime subscription
  useEffect(() => {
    if (!tenantId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`cocina-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, fetchOrders])

  const clearDelivery = useCallback((id: string) => {
    setNewDeliveryIds((prev) => prev.filter((d) => d !== id))
  }, [])

  return { orders, stats, newDeliveryIds, clearDelivery }
}
