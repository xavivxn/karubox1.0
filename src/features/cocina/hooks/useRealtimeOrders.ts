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
  /** Inicio del turno (apertura_at). Si null y no hay hasta, no se muestran pedidos. */
  desde?: string | null
  /** Fin del turno (cierre_at). Si se pasa, se listan solo pedidos del turno cerrado (p. ej. en "Entregado") hasta un nuevo turno. */
  hasta?: string | null
}

interface RawPedido {
  id: string
  numero_pedido: number
  total: number | string
  created_at: string
  tipo: string | null
  estado_pedido: string
}

export function useRealtimeOrders({ tenantId, desde, hasta }: UseRealtimeOrdersParams) {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [stats, setStats] = useState<KitchenStats>({
    todayTotal: 0,
    todayRevenue: 0,
    activeCount: 0,
    deliveredCount: 0,
  })
  const [newDeliveryIds, setNewDeliveryIds] = useState<string[]>([])
  const [initialLoad, setInitialLoad] = useState(true)
  const explodedRef = useRef<Set<string>>(new Set())
  const ordersRef = useRef<KitchenOrder[]>([])
  const fetchInFlightRef = useRef(false)
  const fetchQueuedRef = useRef(false)

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
    if (!tenantId) {
      setInitialLoad(false)
      return
    }
    if (desde === null && hasta === undefined) {
      ordersRef.current = []
      setOrders([])
      setStats({
        todayTotal: 0,
        todayRevenue: 0,
        activeCount: 0,
        deliveredCount: 0,
      })
      setInitialLoad(false)
      return
    }
    const supabase = createClient()
    const fromDate = desde
      ? new Date(desde)
      : (() => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return today
        })()

    let query = supabase
      .from('pedidos')
      .select('id, numero_pedido, total, created_at, tipo, estado_pedido')
      .eq('tenant_id', tenantId)
      .eq('estado_pedido', 'FACT')
      .gte('created_at', fromDate.toISOString())

    if (hasta) {
      query = query.lte('created_at', new Date(hasta).toISOString())
    }

    const { data } = await query.order('created_at', { ascending: false })

    if (data) {
      const processed = processRawOrders(data)

      // Marcar como ya explotadas todas las entregas existentes en el snapshot inicial
      const initialDelivered = processed.filter((o) => o.stage === 'entregado')
      explodedRef.current = new Set(initialDelivered.map((o) => o.id))
      ordersRef.current = processed
      setNewDeliveryIds([])
      setOrders(processed)
      setStats(computeStats(processed))
    }
    setInitialLoad(false)
  }, [tenantId, desde, hasta, processRawOrders, computeStats])

  const requestFetchOrders = useCallback(async () => {
    if (fetchInFlightRef.current) {
      fetchQueuedRef.current = true
      return
    }

    do {
      fetchQueuedRef.current = false
      fetchInFlightRef.current = true
      try {
        await fetchOrders()
      } finally {
        fetchInFlightRef.current = false
      }
    } while (fetchQueuedRef.current)
  }, [fetchOrders])

  // Mantener ref en sync con orders para el intervalo (evitar setState dentro de setState)
  useEffect(() => {
    ordersRef.current = orders
  }, [orders])

  // Initial fetch
  useEffect(() => {
    void requestFetchOrders()
  }, [requestFetchOrders])

  // Refresh stages each 5 s & detect new deliveries (sin setState dentro del updater de setOrders)
  useEffect(() => {
    const interval = setInterval(() => {
      const prev = ordersRef.current
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

      ordersRef.current = updated
      setOrders(updated)
      setStats(computeStats(updated))
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
          void requestFetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, requestFetchOrders])

  const clearDelivery = useCallback((id: string) => {
    setNewDeliveryIds((prev) => prev.filter((d) => d !== id))
  }, [])

  return { orders, stats, newDeliveryIds, clearDelivery, initialLoad }
}
