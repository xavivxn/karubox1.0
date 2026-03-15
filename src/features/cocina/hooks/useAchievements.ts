'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { playAchievementSound } from '../utils/cocina.utils'
import type { KitchenOrder, KitchenStats, KitchenStage } from '../utils/cocina.utils'
import {
  type Achievement,
  type AchievementStore,
  ALL_ACHIEVEMENTS,
  DAILY_ACHIEVEMENTS,
  GLOBAL_ACHIEVEMENTS,
  loadStore,
  saveStore,
  ensureDailyReset,
  evaluateAchievements,
} from '../utils/achievements'

interface UseAchievementsParams {
  tenantId: string | undefined
  stats: KitchenStats
  orders: KitchenOrder[]
  streak: number
}

export function useAchievements({ tenantId, stats, orders, streak }: UseAchievementsParams) {
  const [store, setStore] = useState<AchievementStore | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])
  const prevStreak = useRef(0)
  const initialized = useRef(false)

  // Load store on mount
  useEffect(() => {
    if (!tenantId) return
    const loaded = loadStore(tenantId)
    const { store: resetStore } = ensureDailyReset(loaded)
    setStore(resetStore)
    saveStore(tenantId, resetStore)
    initialized.current = true
  }, [tenantId])

  // Track combo milestones for lifetime stats
  useEffect(() => {
    if (!tenantId || !store) return

    let updated = false
    const ls = { ...store.lifetimeStats }

    if (streak >= 5 && prevStreak.current < 5) {
      ls.totalCombo5 += 1
      updated = true
    }
    if (streak >= 10 && prevStreak.current < 10) {
      ls.totalCombo10 += 1
      updated = true
    }

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
      const newStore = {
        ...store,
        lifetimeStats: {
          ...store.lifetimeStats,
          bestDailyRevenue: stats.todayRevenue,
          recordsBroken: store.lifetimeStats.recordsBroken + 1,
        },
      }
      setStore(newStore)
      saveStore(tenantId, newStore)
    } else if (store.lifetimeStats.bestDailyRevenue === 0 && stats.todayRevenue > 0) {
      const newStore = {
        ...store,
        lifetimeStats: {
          ...store.lifetimeStats,
          bestDailyRevenue: stats.todayRevenue,
        },
      }
      setStore(newStore)
      saveStore(tenantId, newStore)
    }
  }, [stats.todayRevenue, tenantId, store])

  // Track best daily orders
  useEffect(() => {
    if (!tenantId || !store) return
    if (stats.todayTotal > store.lifetimeStats.bestDailyOrders) {
      const newStore = {
        ...store,
        lifetimeStats: {
          ...store.lifetimeStats,
          bestDailyOrders: stats.todayTotal,
        },
      }
      setStore(newStore)
      saveStore(tenantId, newStore)
    }
  }, [stats.todayTotal, tenantId, store])

  // Evaluate achievements periodically
  useEffect(() => {
    if (!tenantId || !store || !initialized.current) return

    const stageCounts: Record<KitchenStage, number> = {
      nuevo: 0,
      cocinando: 0,
      empacando: 0,
      entregado: 0,
    }
    orders.forEach((o) => { stageCounts[o.stage] += 1 })

    const deliveryCount = orders.filter((o) => o.tipo === 'delivery').length

    const { newlyUnlocked: fresh, updatedStore } = evaluateAchievements({
      stats,
      orders,
      streak,
      stageCounts,
      deliveryCount,
      store,
    })

    if (fresh.length > 0) {
      setNewlyUnlocked((prev) => [...prev, ...fresh])
      setStore(updatedStore)
      saveStore(tenantId, updatedStore)
      playAchievementSound()
    }
  }, [tenantId, store, stats, orders, streak])

  // Daily reset check (runs every minute)
  useEffect(() => {
    if (!tenantId || !store) return
    const interval = setInterval(() => {
      const { store: resetStore, didReset } = ensureDailyReset(store)
      if (didReset) {
        setStore(resetStore)
        saveStore(tenantId, resetStore)
      }
    }, 60_000)
    return () => clearInterval(interval)
  }, [tenantId, store])

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([])
  }, [])

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
  }
}
