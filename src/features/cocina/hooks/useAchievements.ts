'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { playAchievementSound } from '../utils/cocina.utils'
import type { KitchenOrder, KitchenStats, KitchenStage } from '../utils/cocina.utils'
import {
  type Achievement,
  type AchievementStore,
  type NextTarget,
  ALL_ACHIEVEMENTS,
  DAILY_ACHIEVEMENTS,
  GLOBAL_ACHIEVEMENTS,
  loadStore,
  saveStore,
  ensureDailyReset,
  ensureSessionReset,
  evaluateAchievements,
  getNextTarget,
} from '../utils/achievements'

interface UseAchievementsParams {
  tenantId: string | undefined
  /** Id de la sesión de caja abierta; al cambiar (nuevo turno), se reinician los logros del día */
  sessionId?: string
  stats: KitchenStats
  orders: KitchenOrder[]
  streak: number
}

export function useAchievements({ tenantId, sessionId, stats, orders, streak }: UseAchievementsParams) {
  const [store, setStore] = useState<AchievementStore | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])
  const [nextTarget, setNextTarget] = useState<NextTarget | null>(null)
  const prevStreak = useRef(0)
  /**
   * IDs de logros que ya estaban desbloqueados en el store al inicializar.
   * La evaluación los omite para no re-disparar toasts al volver a la pantalla.
   */
  const preExistingIds = useRef<Set<string>>(new Set())
  const initialized = useRef(false)

  // Carga inicial: una sola vez por tenant
  useEffect(() => {
    if (!tenantId) return
    const loaded = loadStore(tenantId)
    const { store: afterDaily } = ensureDailyReset(loaded)
    // Recordar qué logros ya existían ANTES de esta sesión de React
    preExistingIds.current = new Set([
      ...afterDaily.dailyUnlocked,
      ...Object.keys(afterDaily.unlocked),
    ])
    setStore(afterDaily)
    saveStore(tenantId, afterDaily)
    initialized.current = true
  }, [tenantId])

  // Al cambiar de sesión de caja (nuevo turno), resetear logros del día
  useEffect(() => {
    if (!tenantId || !sessionId) return
    // Leer siempre desde localStorage para no trabajar con estado stale
    const loaded = loadStore(tenantId)
    const { store: afterSession, didReset } = ensureSessionReset(loaded, sessionId)
    if (didReset) {
      // Si hubo reset real de turno, los pre-existing ya no aplican (es una nueva sesión)
      preExistingIds.current = new Set(Object.keys(afterSession.unlocked))
      setStore(afterSession)
      saveStore(tenantId, afterSession)
    } else if (!store) {
      // Store todavía null (race con carga inicial), sincronizar
      setStore(afterSession)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, sessionId])

  // Track combo milestones for lifetime stats
  useEffect(() => {
    if (!tenantId || !store) return
    let updated = false
    const ls = { ...store.lifetimeStats }
    if (streak >= 5 && prevStreak.current < 5) { ls.totalCombo5 += 1; updated = true }
    if (streak >= 10 && prevStreak.current < 10) { ls.totalCombo10 += 1; updated = true }
    prevStreak.current = streak
    if (updated) {
      const newStore = { ...store, lifetimeStats: ls }
      setStore(newStore)
      saveStore(tenantId, newStore)
    }
  }, [streak, tenantId, store])

  // Track revenue records
  useEffect(() => {
    if (!tenantId || !store) return
    if (stats.todayRevenue > store.lifetimeStats.bestDailyRevenue && store.lifetimeStats.bestDailyRevenue > 0) {
      const newStore = { ...store, lifetimeStats: { ...store.lifetimeStats, bestDailyRevenue: stats.todayRevenue, recordsBroken: store.lifetimeStats.recordsBroken + 1 } }
      setStore(newStore); saveStore(tenantId, newStore)
    } else if (store.lifetimeStats.bestDailyRevenue === 0 && stats.todayRevenue > 0) {
      const newStore = { ...store, lifetimeStats: { ...store.lifetimeStats, bestDailyRevenue: stats.todayRevenue } }
      setStore(newStore); saveStore(tenantId, newStore)
    }
  }, [stats.todayRevenue, tenantId, store])

  // Track best daily orders
  useEffect(() => {
    if (!tenantId || !store) return
    if (stats.todayTotal > store.lifetimeStats.bestDailyOrders) {
      const newStore = { ...store, lifetimeStats: { ...store.lifetimeStats, bestDailyOrders: stats.todayTotal } }
      setStore(newStore); saveStore(tenantId, newStore)
    }
  }, [stats.todayTotal, tenantId, store])

  // Evaluate achievements
  useEffect(() => {
    if (!tenantId || !store || !initialized.current) return

    const stageCounts: Record<KitchenStage, number> = { nuevo: 0, cocinando: 0, empacando: 0, entregado: 0 }
    orders.forEach((o) => { stageCounts[o.stage] += 1 })
    const deliveryCount = orders.filter((o) => o.tipo === 'delivery').length

    const ctx = { stats, orders, streak, stageCounts, deliveryCount, store }
    const { newlyUnlocked: fresh, updatedStore } = evaluateAchievements(ctx)

    // Filtrar los que ya existían al cargar la pantalla (no re-disparar toasts)
    const reallyNew = fresh.filter((a) => !preExistingIds.current.has(a.id))
    // Solo toast + sonido para logros de alto impacto; el resto solo en panel
    const forToast = reallyNew.filter((a) => a.impact === 'high')

    if (forToast.length > 0) {
      setNewlyUnlocked((prev) => [...prev, ...forToast])
      playAchievementSound()
    }

    if (fresh.length > 0) {
      setStore(updatedStore)
      saveStore(tenantId, updatedStore)
    }

    setNextTarget(getNextTarget({ ...ctx, store: updatedStore }))
  }, [tenantId, store, stats, orders, streak])

  // Daily reset check (medianoche, runs every minute)
  useEffect(() => {
    if (!tenantId || !store) return
    const interval = setInterval(() => {
      const { store: resetStore, didReset } = ensureDailyReset(store)
      if (didReset) {
        preExistingIds.current = new Set(Object.keys(resetStore.unlocked))
        setStore(resetStore)
        saveStore(tenantId, resetStore)
      }
    }, 60_000)
    return () => clearInterval(interval)
  }, [tenantId, store])

  const clearNewlyUnlocked = useCallback(() => setNewlyUnlocked([]), [])
  const dismissAchievement = useCallback((id: string) => {
    setNewlyUnlocked((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const totalUnlocked = store
    ? Object.keys(store.unlocked).length + store.dailyUnlocked.length
    : 0

  const dailyProgress = store ? store.dailyUnlocked.length : 0

  const isUnlocked = useCallback(
    (id: string): boolean => {
      if (!store) return false
      return store.dailyUnlocked.includes(id) || id in store.unlocked
    },
    [store]
  )

  const getUnlockTime = useCallback(
    (id: string): number | null => {
      if (!store) return null
      return store.unlocked[id] ?? null
    },
    [store]
  )

  return {
    allAchievements: ALL_ACHIEVEMENTS,
    dailyAchievements: DAILY_ACHIEVEMENTS,
    globalAchievements: GLOBAL_ACHIEVEMENTS,
    newlyUnlocked,
    clearNewlyUnlocked,
    dismissAchievement,
    totalUnlocked,
    totalAchievements: ALL_ACHIEVEMENTS.length,
    dailyProgress,
    dailyTotal: DAILY_ACHIEVEMENTS.length,
    isUnlocked,
    getUnlockTime,
    store,
    nextTarget,
  }
}
