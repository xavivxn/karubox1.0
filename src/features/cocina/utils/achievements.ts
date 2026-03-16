import type { KitchenOrder, KitchenStats, KitchenStage } from './cocina.utils'

/* ═══════════════ TYPES ═══════════════ */

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond'
export type AchievementType = 'daily' | 'global'

export interface Achievement {
  id: string
  name: string
  description: string
  tier: AchievementTier
  emoji: string
  type: AchievementType
}

export interface AchievementEvalContext {
  stats: KitchenStats
  orders: KitchenOrder[]
  streak: number
  stageCounts: Record<KitchenStage, number>
  deliveryCount: number
  store: AchievementStore
}

export interface AchievementStore {
  unlocked: Record<string, number>
  dailyDate: string
  dailyUnlocked: string[]
  lifetimeStats: {
    totalDaysActive: number
    bestDailyRevenue: number
    bestDailyOrders: number
    totalCombo5: number
    totalCombo10: number
    recordsBroken: number
  }
}

/* ═══════════════ TIER COLORS ═══════════════ */

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#a78bfa',
}

export const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
  diamond: 'Diamante',
}

export const TIER_BG: Record<AchievementTier, string> = {
  bronze: 'from-amber-700/20 to-amber-900/10',
  silver: 'from-gray-300/30 to-gray-400/10',
  gold: 'from-yellow-300/30 to-amber-400/10',
  diamond: 'from-cyan-200/30 to-blue-300/10',
}

/* ═══════════════ ACHIEVEMENT DEFINITIONS ═══════════════ */

export const DAILY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'primer-pedido',
    name: 'Primer Pedido',
    description: 'Recibir el primer pedido del día',
    tier: 'bronze',
    emoji: '🎯',
    type: 'daily',
  },
  {
    id: 'primer-delivery',
    name: 'Primer Delivery',
    description: 'El primer pedido delivery del día',
    tier: 'bronze',
    emoji: '🛵',
    type: 'daily',
  },
  {
    id: 'calentando',
    name: 'Calentando Motores',
    description: '3 pedidos en el día',
    tier: 'bronze',
    emoji: '🔥',
    type: 'daily',
  },
  {
    id: 'desayuno-listo',
    name: 'Desayuno Listo',
    description: '5 pedidos antes del mediodía',
    tier: 'bronze',
    emoji: '🌅',
    type: 'daily',
  },
  {
    id: 'en-ritmo',
    name: 'En Ritmo',
    description: '5 pedidos en el día',
    tier: 'bronze',
    emoji: '🎵',
    type: 'daily',
  },
  {
    id: 'manos-calientes',
    name: 'Manos Calientes',
    description: '10 pedidos en el día',
    tier: 'silver',
    emoji: '🙌',
    type: 'daily',
  },
  {
    id: 'delivery-king',
    name: 'Delivery King',
    description: '10 deliveries en el día',
    tier: 'silver',
    emoji: '🦁',
    type: 'daily',
  },
  {
    id: 'media-maquina',
    name: 'Media Máquina',
    description: '15 pedidos en el día',
    tier: 'silver',
    emoji: '⚙️',
    type: 'daily',
  },
  {
    id: 'tesoro',
    name: 'Tesoro',
    description: 'Facturar 500.000 Gs en el día',
    tier: 'silver',
    emoji: '💰',
    type: 'daily',
  },
  {
    id: 'velocista',
    name: 'Velocista',
    description: '20 pedidos en el día',
    tier: 'gold',
    emoji: '⚡',
    type: 'daily',
  },
  {
    id: 'la-maquina',
    name: 'La Máquina',
    description: '25 pedidos en el día',
    tier: 'gold',
    emoji: '⚙️',
    type: 'daily',
  },
  {
    id: 'hora-pico',
    name: 'Hora Pico',
    description: '10+ pedidos en una hora',
    tier: 'gold',
    emoji: '📈',
    type: 'daily',
  },
  {
    id: 'millonario',
    name: 'Millonario',
    description: 'Facturar más de 1.000.000 Gs',
    tier: 'gold',
    emoji: '💵',
    type: 'daily',
  },
  {
    id: 'double-million',
    name: 'Doble Millón',
    description: 'Facturar más de 2.000.000 Gs',
    tier: 'gold',
    emoji: '💸',
    type: 'daily',
  },
  {
    id: 'imparable',
    name: 'Imparable',
    description: '50 pedidos en el día',
    tier: 'diamond',
    emoji: '🚀',
    type: 'daily',
  },
  {
    id: 'multimillonario',
    name: 'Multimillonario',
    description: 'Facturar más de 5.000.000 Gs',
    tier: 'diamond',
    emoji: '💎',
    type: 'daily',
  },
  {
    id: 'cocina-llena',
    name: 'Cocina Llena',
    description: 'Las 4 estaciones activas a la vez',
    tier: 'diamond',
    emoji: '🏭',
    type: 'daily',
  },
  {
    id: 'combo-master',
    name: 'Combo Master',
    description: 'Alcanzar un combo x5',
    tier: 'diamond',
    emoji: '⚡',
    type: 'daily',
  },
  {
    id: 'leyenda-del-dia',
    name: 'Leyenda del Día',
    description: 'Alcanzar un combo x10',
    tier: 'diamond',
    emoji: '👑',
    type: 'daily',
  },
  {
    id: 'tren-bala',
    name: 'Tren Bala',
    description: '30 pedidos en 3 horas',
    tier: 'diamond',
    emoji: '🚄',
    type: 'daily',
  },
]

export const GLOBAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'bienvenido-chef',
    name: 'Bienvenido Chef',
    description: 'Ver tu primer pedido en la cocina',
    tier: 'bronze',
    emoji: '👨‍🍳',
    type: 'global',
  },
  {
    id: 'semana-1',
    name: 'Semana 1',
    description: '7 días de operación',
    tier: 'bronze',
    emoji: '📅',
    type: 'global',
  },
  {
    id: 'veterano',
    name: 'Veterano',
    description: '30 días de operación',
    tier: 'silver',
    emoji: '🎖️',
    type: 'global',
  },
  {
    id: 'cien-pedidos-dia',
    name: 'Centurión',
    description: '100 pedidos en un solo día',
    tier: 'silver',
    emoji: '💯',
    type: 'global',
  },
  {
    id: 'rompe-records',
    name: 'Rompe Récords',
    description: 'Superar tu récord de facturación',
    tier: 'gold',
    emoji: '🏆',
    type: 'global',
  },
  {
    id: 'combo-habitual',
    name: 'Combo Habitual',
    description: 'Alcanzar combo x5 diez veces',
    tier: 'gold',
    emoji: '🔥',
    type: 'global',
  },
  {
    id: 'centenario',
    name: 'Centenario',
    description: '100 días de operación',
    tier: 'diamond',
    emoji: '🌟',
    type: 'global',
  },
  {
    id: 'leyenda-global',
    name: 'Leyenda Global',
    description: 'Alcanzar combo x10 cinco veces',
    tier: 'diamond',
    emoji: '🐉',
    type: 'global',
  },
  {
    id: 'dia-perfecto',
    name: 'Día Perfecto',
    description: 'Ganar las 12 medallas diarias',
    tier: 'diamond',
    emoji: '✨',
    type: 'global',
  },
]

export const ALL_ACHIEVEMENTS = [...DAILY_ACHIEVEMENTS, ...GLOBAL_ACHIEVEMENTS]

/* ═══════════════ LOCALSTORAGE HELPERS ═══════════════ */

function storageKey(tenantId: string): string {
  return `cocina-achievements-${tenantId}`
}

function defaultStore(): AchievementStore {
  return {
    unlocked: {},
    dailyDate: '',
    dailyUnlocked: [],
    lifetimeStats: {
      totalDaysActive: 0,
      bestDailyRevenue: 0,
      bestDailyOrders: 0,
      totalCombo5: 0,
      totalCombo10: 0,
      recordsBroken: 0,
    },
  }
}

export function loadStore(tenantId: string): AchievementStore {
  if (typeof window === 'undefined') return defaultStore()
  try {
    const raw = localStorage.getItem(storageKey(tenantId))
    if (!raw) return defaultStore()
    const parsed = JSON.parse(raw) as Partial<AchievementStore>
    const def = defaultStore()
    return {
      unlocked: parsed.unlocked ?? def.unlocked,
      dailyDate: parsed.dailyDate ?? def.dailyDate,
      dailyUnlocked: parsed.dailyUnlocked ?? def.dailyUnlocked,
      lifetimeStats: { ...def.lifetimeStats, ...parsed.lifetimeStats },
    }
  } catch {
    return defaultStore()
  }
}

export function saveStore(tenantId: string, store: AchievementStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(tenantId), JSON.stringify(store))
  } catch {
    // localStorage full or unavailable
  }
}

/* ═══════════════ DAILY RESET ═══════════════ */

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ensureDailyReset(store: AchievementStore): {
  store: AchievementStore
  didReset: boolean
} {
  const today = todayStr()
  if (store.dailyDate === today) return { store, didReset: false }

  const isNewDay = store.dailyDate !== '' && store.dailyDate !== today
  const newStore: AchievementStore = {
    ...store,
    dailyDate: today,
    dailyUnlocked: [],
    lifetimeStats: {
      ...store.lifetimeStats,
      totalDaysActive: isNewDay
        ? store.lifetimeStats.totalDaysActive + 1
        : store.lifetimeStats.totalDaysActive,
    },
  }
  return { store: newStore, didReset: isNewDay }
}

/**
 * Reinicia solo los datos del día de Cocina 3D (logros diarios).
 * Se llama al confirmar cierre de caja. No toca logros globales ni lifetimeStats.
 */
export function resetCocinaDailyData(tenantId: string): void {
  if (typeof window === 'undefined') return
  try {
    const store = loadStore(tenantId)
    const newStore: AchievementStore = {
      ...store,
      dailyDate: todayStr(),
      dailyUnlocked: [],
    }
    saveStore(tenantId, newStore)
  } catch {
    // ignore
  }
}

/* ═══════════════ EVALUATION ═══════════════ */

function isDailyUnlocked(store: AchievementStore, id: string): boolean {
  return store.dailyUnlocked.includes(id)
}

function isGlobalUnlocked(store: AchievementStore, id: string): boolean {
  return id in store.unlocked
}

type EvalFn = (ctx: AchievementEvalContext) => boolean

const DAILY_EVAL: Record<string, EvalFn> = {
  'primer-pedido': (ctx) => ctx.stats.todayTotal >= 1,
  'primer-delivery': (ctx) => ctx.deliveryCount >= 1,
  'calentando': (ctx) => ctx.stats.todayTotal >= 3,
  'desayuno-listo': (ctx) => {
    const hour = new Date().getHours()
    return hour < 12 && ctx.stats.todayTotal >= 5
  },
  'en-ritmo': (ctx) => ctx.stats.todayTotal >= 5,
  'manos-calientes': (ctx) => ctx.stats.todayTotal >= 10,
  'delivery-king': (ctx) => ctx.deliveryCount >= 10,
  'media-maquina': (ctx) => ctx.stats.todayTotal >= 15,
  'tesoro': (ctx) => ctx.stats.todayRevenue >= 500_000,
  'velocista': (ctx) => ctx.stats.todayTotal >= 20,
  'la-maquina': (ctx) => ctx.stats.todayTotal >= 25,
  'hora-pico': (ctx) => {
    const now = new Date()
    const hourMs = 60 * 60 * 1000
    const oneHourAgo = now.getTime() - hourMs
    const recentOrders = ctx.orders.filter(
      (o) => new Date(o.created_at).getTime() >= oneHourAgo
    )
    return recentOrders.length >= 10
  },
  'millonario': (ctx) => ctx.stats.todayRevenue >= 1_000_000,
  'double-million': (ctx) => ctx.stats.todayRevenue >= 2_000_000,
  'imparable': (ctx) => ctx.stats.todayTotal >= 50,
  'multimillonario': (ctx) => ctx.stats.todayRevenue >= 5_000_000,
  'cocina-llena': (ctx) => {
    const stages: KitchenStage[] = ['nuevo', 'cocinando', 'empacando', 'entregado']
    return stages.every((s) => ctx.stageCounts[s] > 0)
  },
  'combo-master': (ctx) => ctx.streak >= 5,
  'leyenda-del-dia': (ctx) => ctx.streak >= 10,
  'tren-bala': (ctx) => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000
    const recentOrders = ctx.orders.filter(
      (o) => new Date(o.created_at).getTime() >= threeHoursAgo
    )
    return recentOrders.length >= 30
  },
}

const GLOBAL_EVAL: Record<string, EvalFn> = {
  'bienvenido-chef': (ctx) => ctx.stats.todayTotal >= 1,
  'semana-1': (ctx) => ctx.store.lifetimeStats.totalDaysActive >= 7,
  'veterano': (ctx) => ctx.store.lifetimeStats.totalDaysActive >= 30,
  'cien-pedidos-dia': (ctx) => ctx.stats.todayTotal >= 100,
  'rompe-records': (ctx) => ctx.store.lifetimeStats.recordsBroken >= 1,
  'combo-habitual': (ctx) => ctx.store.lifetimeStats.totalCombo5 >= 10,
  'centenario': (ctx) => ctx.store.lifetimeStats.totalDaysActive >= 100,
  'leyenda-global': (ctx) => ctx.store.lifetimeStats.totalCombo10 >= 5,
  'dia-perfecto': (ctx) =>
    ctx.store.dailyUnlocked.length >= DAILY_ACHIEVEMENTS.length,
}

export interface EvaluationResult {
  newlyUnlocked: Achievement[]
  updatedStore: AchievementStore
}

export function evaluateAchievements(
  ctx: AchievementEvalContext
): EvaluationResult {
  const newlyUnlocked: Achievement[] = []
  let store = { ...ctx.store, dailyUnlocked: [...ctx.store.dailyUnlocked] }

  for (const ach of DAILY_ACHIEVEMENTS) {
    if (isDailyUnlocked(store, ach.id)) continue
    const evalFn = DAILY_EVAL[ach.id]
    if (evalFn && evalFn({ ...ctx, store })) {
      store.dailyUnlocked.push(ach.id)
      newlyUnlocked.push(ach)
    }
  }

  const unlocked = { ...store.unlocked }
  for (const ach of GLOBAL_ACHIEVEMENTS) {
    if (isGlobalUnlocked(store, ach.id)) continue
    const evalFn = GLOBAL_EVAL[ach.id]
    if (evalFn && evalFn({ ...ctx, store })) {
      unlocked[ach.id] = Date.now()
      newlyUnlocked.push(ach)
    }
  }

  return {
    newlyUnlocked,
    updatedStore: { ...store, unlocked },
  }
}

/* ═══════════════ PROGRESS HELPERS ═══════════════ */

export function getGlobalProgress(
  achievement: Achievement,
  store: AchievementStore
): { current: number; target: number } | null {
  switch (achievement.id) {
    case 'semana-1':
      return { current: Math.min(store.lifetimeStats.totalDaysActive, 7), target: 7 }
    case 'veterano':
      return { current: Math.min(store.lifetimeStats.totalDaysActive, 30), target: 30 }
    case 'centenario':
      return { current: Math.min(store.lifetimeStats.totalDaysActive, 100), target: 100 }
    case 'combo-habitual':
      return { current: Math.min(store.lifetimeStats.totalCombo5, 10), target: 10 }
    case 'leyenda-global':
      return { current: Math.min(store.lifetimeStats.totalCombo10, 5), target: 5 }
    default:
      return null
  }
}

/* ═══════════════ NEXT TARGET PROGRESS ═══════════════ */

type ProgressFn = (ctx: AchievementEvalContext) => { current: number; target: number } | null

const DAILY_PROGRESS: Record<string, ProgressFn> = {
  'primer-pedido':   (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 1), target: 1 }),
  'primer-delivery': (ctx) => ({ current: Math.min(ctx.deliveryCount, 1), target: 1 }),
  'calentando':      (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 3), target: 3 }),
  'desayuno-listo':  (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 5), target: 5 }),
  'en-ritmo':        (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 5), target: 5 }),
  'manos-calientes': (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 10), target: 10 }),
  'delivery-king':   (ctx) => ({ current: Math.min(ctx.deliveryCount, 10), target: 10 }),
  'media-maquina':   (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 15), target: 15 }),
  'tesoro':          (ctx) => ({ current: Math.min(ctx.stats.todayRevenue, 500_000), target: 500_000 }),
  'velocista':       (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 20), target: 20 }),
  'la-maquina':      (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 25), target: 25 }),
  'hora-pico': (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const recent = ctx.orders.filter((o) => new Date(o.created_at).getTime() >= oneHourAgo)
    return { current: Math.min(recent.length, 10), target: 10 }
  },
  'millonario':      (ctx) => ({ current: Math.min(ctx.stats.todayRevenue, 1_000_000), target: 1_000_000 }),
  'double-million':  (ctx) => ({ current: Math.min(ctx.stats.todayRevenue, 2_000_000), target: 2_000_000 }),
  'imparable':       (ctx) => ({ current: Math.min(ctx.stats.todayTotal, 50), target: 50 }),
  'multimillonario': (ctx) => ({ current: Math.min(ctx.stats.todayRevenue, 5_000_000), target: 5_000_000 }),
  'cocina-llena': (ctx) => {
    const stages: KitchenStage[] = ['nuevo', 'cocinando', 'empacando', 'entregado']
    return { current: stages.filter((s) => ctx.stageCounts[s] > 0).length, target: 4 }
  },
  'combo-master':    (ctx) => ({ current: Math.min(ctx.streak, 5), target: 5 }),
  'leyenda-del-dia': (ctx) => ({ current: Math.min(ctx.streak, 10), target: 10 }),
  'tren-bala': (ctx) => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000
    const recent = ctx.orders.filter((o) => new Date(o.created_at).getTime() >= threeHoursAgo)
    return { current: Math.min(recent.length, 30), target: 30 }
  },
}

export interface NextTarget {
  achievement: Achievement
  current: number
  target: number
  isRevenue: boolean
}

export function getNextTarget(ctx: AchievementEvalContext): NextTarget | null {
  let best: NextTarget | null = null
  let bestRatio = -1

  for (const ach of DAILY_ACHIEVEMENTS) {
    if (isDailyUnlocked(ctx.store, ach.id)) continue
    const progressFn = DAILY_PROGRESS[ach.id]
    if (!progressFn) continue
    const progress = progressFn(ctx)
    if (!progress) continue
    const ratio = progress.current / progress.target
    if (ratio >= 1) continue
    if (ratio > bestRatio) {
      bestRatio = ratio
      const isRevenue = ['tesoro', 'millonario', 'double-million', 'multimillonario'].includes(ach.id)
      best = { achievement: ach, current: progress.current, target: progress.target, isRevenue }
    }
  }

  return best
}
