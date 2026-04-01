import type { KitchenOrder, KitchenStats, KitchenStage } from './cocina.utils'

/* ═══════════════ TYPES ═══════════════ */

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond'
export type AchievementType = 'daily' | 'global'
/** Alto = toast + sonido; normal = solo panel (menos ruido). */
export type AchievementImpact = 'high' | 'normal'

export interface Achievement {
  id: string
  name: string
  description: string
  /** Pista corta para estado bloqueado (estilo misterio). */
  mysteryHint?: string
  tier: AchievementTier
  emoji: string
  type: AchievementType
  /** Si es 'high', se muestra toast y sonido al desbloquear; si 'normal', solo en panel. */
  impact?: AchievementImpact
}

export interface AchievementEvalContext {
  stats: KitchenStats
  orders: KitchenOrder[]
  streak: number
  stageCounts: Record<KitchenStage, number>
  deliveryCount: number
  store: AchievementStore
}

/** Registro de logros desbloqueados en un turno pasado */
export interface SessionRecord {
  achievementIds: string[]
  date: string          // YYYY-MM-DD (fecha de apertura)
  aperturaAt: string    // ISO timestamp de apertura
}

export interface AchievementStore {
  unlocked: Record<string, number>
  dailyDate: string
  /** Id de la sesión de caja actual; al cambiar (nuevo turno), se reinician los logros del día */
  dailySessionId: string
  dailyUnlocked: string[]
  /** Historial de logros por sesión de caja (hasta 60 entradas) */
  sessionHistory: Record<string, SessionRecord>
  lifetimeStats: {
    totalDaysActive: number
    bestDailyRevenue: number
    bestDailyOrders: number
    totalCombo5: number
    totalCombo10: number
    recordsBroken: number
    /** Mayor racha de combo (pedidos seguidos) jamás alcanzada en cocina */
    maxStreakEver: number
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
    mysteryHint: 'Se desbloquea con un comienzo simple del turno.',
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
    mysteryHint: 'Se activa cuando la caja empieza a pesar.',
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
    mysteryHint: 'Ritmo extremo sostenido durante el turno.',
    tier: 'diamond',
    emoji: '🚀',
    type: 'daily',
    impact: 'high',
  },
  {
    id: 'multimillonario',
    name: 'Multimillonario',
    description: 'Facturar más de 5.000.000 Gs',
    tier: 'diamond',
    emoji: '💎',
    type: 'daily',
    impact: 'high',
  },
  {
    id: 'cocina-llena',
    name: 'Cocina Llena',
    description: 'Las 4 estaciones activas a la vez',
    tier: 'diamond',
    emoji: '🏭',
    type: 'daily',
    impact: 'high',
  },
  {
    id: 'combo-master',
    name: 'Combo Master',
    description: 'Alcanzar un combo x5',
    tier: 'diamond',
    emoji: '⚡',
    type: 'daily',
    impact: 'high',
  },
  {
    id: 'leyenda-del-dia',
    name: 'Leyenda del Día',
    description: 'Alcanzar un combo x10',
    tier: 'diamond',
    emoji: '👑',
    type: 'daily',
    impact: 'high',
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
    mysteryHint: 'Un hito básico para quienes recién comienzan.',
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
    impact: 'high',
  },
  {
    id: 'rompe-records',
    name: 'Rompe Récords',
    description: 'Superar tu récord de facturación',
    mysteryHint: 'Solo aparece cuando superás una marca histórica.',
    tier: 'gold',
    emoji: '🏆',
    type: 'global',
    impact: 'high',
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
    impact: 'high',
  },
  {
    id: 'leyenda-global',
    name: 'Leyenda Global',
    description: 'Alcanzar combo x10 cinco veces',
    tier: 'diamond',
    emoji: '🐉',
    type: 'global',
    impact: 'high',
  },
  {
    id: 'dia-perfecto',
    name: 'Día Perfecto',
    description: 'Ganar las 12 medallas diarias',
    tier: 'diamond',
    emoji: '✨',
    type: 'global',
    impact: 'high',
  },
  {
    id: 'archivo-vivo',
    name: 'Archivo vivo',
    description: '10 turnos con logros guardados en el historial',
    tier: 'bronze',
    emoji: '📁',
    type: 'global',
  },
  {
    id: 'operacion-media',
    name: 'Operación media',
    description: '180 días de operación',
    tier: 'gold',
    emoji: '📊',
    type: 'global',
  },
  {
    id: 'pico-tres-millones',
    name: 'Día de tres millones',
    description: 'Tu mejor día facturó al menos 3.000.000 Gs',
    tier: 'silver',
    emoji: '💵',
    type: 'global',
  },
  {
    id: 'biblio-cocina',
    name: 'Biblioteca de cocina',
    description: '50 turnos con logros en el historial',
    tier: 'silver',
    emoji: '📚',
    type: 'global',
  },
  {
    id: 'hipercenturion',
    name: 'Hipercenturión',
    description: 'Tu mejor día tuvo 150 pedidos o más',
    tier: 'gold',
    emoji: '📈',
    type: 'global',
  },
  {
    id: 'cumbre-siete-m',
    name: 'Cumbre',
    description: 'Tu mejor día facturó al menos 7.000.000 Gs',
    tier: 'gold',
    emoji: '⛰️',
    type: 'global',
  },
  {
    id: 'ritmo-veinticinco',
    name: 'Ritmo sostenido',
    description: 'Alcanzar combo x5 veinticinco veces en total',
    tier: 'gold',
    emoji: '🥁',
    type: 'global',
  },
  {
    id: 'rompevidrios',
    name: 'Rompevidrios',
    description: 'Superar tu récord de facturación 5 veces',
    tier: 'gold',
    emoji: '💥',
    type: 'global',
  },
  {
    id: 'furia-quince-x10',
    name: 'Furia x10',
    description: 'Alcanzar combo x10 quince veces en total',
    tier: 'gold',
    emoji: '⚡',
    type: 'global',
  },
  {
    id: 'racha-historica',
    name: 'Racha histórica',
    description: 'Alcanzar una racha de 20 pedidos seguidos o más (máximo histórico)',
    tier: 'gold',
    emoji: '🔗',
    type: 'global',
  },
  {
    id: 'serial-rompe-records',
    name: 'Serial de récords',
    description: 'Superar tu récord de facturación 15 veces',
    tier: 'diamond',
    emoji: '📉',
    type: 'global',
    impact: 'high',
  },
  {
    id: 'infierno-combo',
    name: 'Infierno',
    description: 'Alcanzar combo x5 cincuenta veces en total',
    tier: 'diamond',
    emoji: '🔥',
    type: 'global',
  },
  {
    id: 'tsunami-pedidos',
    name: 'Tsunami',
    description: 'Tu mejor día tuvo 200 pedidos o más',
    tier: 'diamond',
    emoji: '🌊',
    type: 'global',
    impact: 'high',
  },
  {
    id: 'imparable-total',
    name: 'Imparable total',
    description: 'Alcanzar una racha de 35 pedidos seguidos o más (máximo histórico)',
    tier: 'diamond',
    emoji: '🏃',
    type: 'global',
    impact: 'high',
  },
  {
    id: 'ano-dorado',
    name: 'Año dorado',
    description: '365 días de operación',
    tier: 'diamond',
    emoji: '🗓️',
    type: 'global',
    impact: 'high',
  },
]

export const ALL_ACHIEVEMENTS = [...DAILY_ACHIEVEMENTS, ...GLOBAL_ACHIEVEMENTS]

function mysteryHintFallback(achievement: Achievement): string {
  if (achievement.id.includes('combo')) return 'Tiene que ver con mantener rachas.'
  if (achievement.id.includes('millon')) return 'Requiere una facturación muy alta.'
  if (achievement.id.includes('record')) return 'Exige superar una marca previa.'
  if (achievement.id.includes('delivery')) return 'Relacionado a pedidos de reparto.'
  if (achievement.id.includes('dia') || achievement.id.includes('semana') || achievement.id.includes('centenario')) {
    return 'Se desbloquea por constancia a lo largo del tiempo.'
  }
  if (achievement.type === 'daily') return 'Pista: depende del rendimiento del turno actual.'
  return 'Pista: depende de progreso acumulado.'
}

export function getAchievementMysteryHint(achievement: Achievement): string {
  return achievement.mysteryHint ?? mysteryHintFallback(achievement)
}

/* ═══════════════ LOCALSTORAGE HELPERS ═══════════════ */

function storageKey(tenantId: string): string {
  return `cocina-achievements-${tenantId}`
}

function defaultStore(): AchievementStore {
  return {
    unlocked: {},
    dailyDate: '',
    dailySessionId: '',
    dailyUnlocked: [],
    sessionHistory: {},
    lifetimeStats: {
      totalDaysActive: 0,
      bestDailyRevenue: 0,
      bestDailyOrders: 0,
      totalCombo5: 0,
      totalCombo10: 0,
      recordsBroken: 0,
      maxStreakEver: 0,
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
      dailySessionId: (parsed as AchievementStore).dailySessionId ?? def.dailySessionId,
      dailyUnlocked: parsed.dailyUnlocked ?? def.dailyUnlocked,
      sessionHistory: (parsed as AchievementStore).sessionHistory ?? def.sessionHistory,
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
 * Reinicia los logros del día cuando cambia la sesión de caja (nuevo turno).
 * - Si sessionId es undefined (caja cargando), no toca nada para evitar limpiezas falsas.
 * - Solo reinicia cuando hay un sessionId real y es distinto al actual.
 */
export function ensureSessionReset(
  store: AchievementStore,
  sessionId: string | undefined
): { store: AchievementStore; didReset: boolean } {
  // Sin sesión real todavía (cargando o caja cerrada): no tocar el store
  if (!sessionId) return { store, didReset: false }
  // Misma sesión: sin cambios
  if (store.dailySessionId === sessionId) return { store, didReset: false }

  // Nueva sesión de caja: archivar anterior y resetear logros del día
  const history = archiveCurrentSession(store)
  const trimmedHistory = trimHistory(history)

  return {
    store: {
      ...store,
      dailySessionId: sessionId,
      dailyUnlocked: [],
      sessionHistory: trimmedHistory,
    },
    didReset: true,
  }
}

function archiveCurrentSession(
  store: AchievementStore,
  /** Al cerrar caja conviene pasar la apertura real de `sesiones_caja` para ordenar el historial. */
  forcedAperturaAt?: string
): Record<string, SessionRecord> {
  const history = { ...store.sessionHistory }
  if (store.dailySessionId && store.dailyUnlocked.length > 0) {
    history[store.dailySessionId] = {
      achievementIds: [...store.dailyUnlocked],
      date: store.dailyDate || todayStr(),
      aperturaAt:
        forcedAperturaAt ??
        store.sessionHistory[store.dailySessionId]?.aperturaAt ??
        new Date().toISOString(),
    }
  }
  return history
}

function trimHistory(history: Record<string, SessionRecord>, max = 60): Record<string, SessionRecord> {
  const entries = Object.entries(history)
  if (entries.length <= max) return history
  // Ordenar por fecha descendente y quedarse con las max más recientes
  const sorted = entries.sort(([, a], [, b]) => b.aperturaAt.localeCompare(a.aperturaAt))
  return Object.fromEntries(sorted.slice(0, max))
}

/**
 * Fusiona estado remoto (BD) con localStorage: máximos en globales/historial; turno actual preferido desde local si hay actividad.
 */
export function mergeDbWithLocal(db: AchievementStore, local: AchievementStore): AchievementStore {
  const mergedUnlocked: Record<string, number> = { ...db.unlocked, ...local.unlocked }
  for (const k of Object.keys(mergedUnlocked)) {
    mergedUnlocked[k] = Math.max(db.unlocked[k] ?? 0, local.unlocked[k] ?? 0)
  }
  const mergedHistory: Record<string, SessionRecord> = { ...db.sessionHistory }
  for (const [k, loc] of Object.entries(local.sessionHistory)) {
    const prev = mergedHistory[k]
    const pick =
      !prev || loc.achievementIds.length > (prev.achievementIds?.length ?? 0) ? loc : prev
    mergedHistory[k] = pick
  }
  const defLs = defaultStore().lifetimeStats
  const dbLs = { ...defLs, ...db.lifetimeStats }
  const localLs = { ...defLs, ...local.lifetimeStats }
  const ls = { ...defLs }
  for (const key of Object.keys(defLs) as (keyof AchievementStore['lifetimeStats'])[]) {
    ls[key] = Math.max(dbLs[key], localLs[key])
  }
  const preferLocalDaily =
    local.dailyUnlocked.length > 0 || Boolean(local.dailySessionId && !db.dailySessionId)
  return {
    unlocked: mergedUnlocked,
    dailyDate: preferLocalDaily ? local.dailyDate : db.dailyDate || local.dailyDate,
    dailySessionId: preferLocalDaily ? local.dailySessionId : db.dailySessionId || local.dailySessionId,
    dailyUnlocked: preferLocalDaily ? local.dailyUnlocked : db.dailyUnlocked,
    sessionHistory: trimHistory(mergedHistory),
    lifetimeStats: ls,
  }
}

/**
 * Reinicia solo los datos del día de Cocina 3D (logros diarios).
 * Tras cerrar caja: pasar `closedSessionAperturaAt` = apertura_at de la sesión cerrada para el historial.
 * No toca logros globales ni lifetimeStats.
 */
export function resetCocinaDailyData(tenantId: string, closedSessionAperturaAt?: string): void {
  if (typeof window === 'undefined') return
  try {
    const store = loadStore(tenantId)
    // Antes de limpiar, archivar la sesión actual para que aparezca en Historial de turnos.
    const archivedHistory = trimHistory(archiveCurrentSession(store, closedSessionAperturaAt))
    const newStore: AchievementStore = {
      ...store,
      dailyDate: todayStr(),
      dailySessionId: '',
      dailyUnlocked: [],
      sessionHistory: archivedHistory,
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
  'archivo-vivo': (ctx) => Object.keys(ctx.store.sessionHistory).length >= 10,
  'operacion-media': (ctx) => ctx.store.lifetimeStats.totalDaysActive >= 180,
  'pico-tres-millones': (ctx) => ctx.store.lifetimeStats.bestDailyRevenue >= 3_000_000,
  'biblio-cocina': (ctx) => Object.keys(ctx.store.sessionHistory).length >= 50,
  'hipercenturion': (ctx) => ctx.store.lifetimeStats.bestDailyOrders >= 150,
  'cumbre-siete-m': (ctx) => ctx.store.lifetimeStats.bestDailyRevenue >= 7_000_000,
  'ritmo-veinticinco': (ctx) => ctx.store.lifetimeStats.totalCombo5 >= 25,
  'rompevidrios': (ctx) => ctx.store.lifetimeStats.recordsBroken >= 5,
  'furia-quince-x10': (ctx) => ctx.store.lifetimeStats.totalCombo10 >= 15,
  'racha-historica': (ctx) => (ctx.store.lifetimeStats.maxStreakEver ?? 0) >= 20,
  'serial-rompe-records': (ctx) => ctx.store.lifetimeStats.recordsBroken >= 15,
  'infierno-combo': (ctx) => ctx.store.lifetimeStats.totalCombo5 >= 50,
  'tsunami-pedidos': (ctx) => ctx.store.lifetimeStats.bestDailyOrders >= 200,
  'imparable-total': (ctx) => (ctx.store.lifetimeStats.maxStreakEver ?? 0) >= 35,
  'ano-dorado': (ctx) => ctx.store.lifetimeStats.totalDaysActive >= 365,
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
  const ls = store.lifetimeStats
  const sessions = Object.keys(store.sessionHistory).length
  const maxS = ls.maxStreakEver ?? 0
  switch (achievement.id) {
    case 'semana-1':
      return { current: Math.min(ls.totalDaysActive, 7), target: 7 }
    case 'veterano':
      return { current: Math.min(ls.totalDaysActive, 30), target: 30 }
    case 'centenario':
      return { current: Math.min(ls.totalDaysActive, 100), target: 100 }
    case 'operacion-media':
      return { current: Math.min(ls.totalDaysActive, 180), target: 180 }
    case 'ano-dorado':
      return { current: Math.min(ls.totalDaysActive, 365), target: 365 }
    case 'combo-habitual':
      return { current: Math.min(ls.totalCombo5, 10), target: 10 }
    case 'ritmo-veinticinco':
      return { current: Math.min(ls.totalCombo5, 25), target: 25 }
    case 'infierno-combo':
      return { current: Math.min(ls.totalCombo5, 50), target: 50 }
    case 'leyenda-global':
      return { current: Math.min(ls.totalCombo10, 5), target: 5 }
    case 'furia-quince-x10':
      return { current: Math.min(ls.totalCombo10, 15), target: 15 }
    case 'rompe-records':
      return { current: Math.min(ls.recordsBroken, 1), target: 1 }
    case 'rompevidrios':
      return { current: Math.min(ls.recordsBroken, 5), target: 5 }
    case 'serial-rompe-records':
      return { current: Math.min(ls.recordsBroken, 15), target: 15 }
    case 'pico-tres-millones':
      return { current: Math.min(ls.bestDailyRevenue, 3_000_000), target: 3_000_000 }
    case 'cumbre-siete-m':
      return { current: Math.min(ls.bestDailyRevenue, 7_000_000), target: 7_000_000 }
    case 'hipercenturion':
      return { current: Math.min(ls.bestDailyOrders, 150), target: 150 }
    case 'tsunami-pedidos':
      return { current: Math.min(ls.bestDailyOrders, 200), target: 200 }
    case 'archivo-vivo':
      return { current: Math.min(sessions, 10), target: 10 }
    case 'biblio-cocina':
      return { current: Math.min(sessions, 50), target: 50 }
    case 'racha-historica':
      return { current: Math.min(maxS, 20), target: 20 }
    case 'imparable-total':
      return { current: Math.min(maxS, 35), target: 35 }
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
