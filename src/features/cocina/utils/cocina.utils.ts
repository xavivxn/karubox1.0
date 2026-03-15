export const KITCHEN_STAGES = ['nuevo', 'cocinando', 'empacando', 'entregado'] as const
export type KitchenStage = (typeof KITCHEN_STAGES)[number]

export interface KitchenOrder {
  id: string
  numero_pedido: number
  total: number
  created_at: string
  tipo: string
  stage: KitchenStage
  elapsed: number
  progress: number
}

export interface KitchenStats {
  todayTotal: number
  todayRevenue: number
  activeCount: number
  deliveredCount: number
}

const STAGE_MS = {
  cocinando: 30_000,
  empacando: 8 * 60_000,
  entregado: 12 * 60_000,
}

export function getOrderStage(createdAt: string): {
  stage: KitchenStage
  elapsed: number
  progress: number
} {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  if (elapsed < STAGE_MS.cocinando)
    return { stage: 'nuevo', elapsed, progress: elapsed / STAGE_MS.cocinando }
  if (elapsed < STAGE_MS.empacando)
    return {
      stage: 'cocinando',
      elapsed,
      progress:
        (elapsed - STAGE_MS.cocinando) /
        (STAGE_MS.empacando - STAGE_MS.cocinando),
    }
  if (elapsed < STAGE_MS.entregado)
    return {
      stage: 'empacando',
      elapsed,
      progress:
        (elapsed - STAGE_MS.empacando) /
        (STAGE_MS.entregado - STAGE_MS.empacando),
    }
  return { stage: 'entregado', elapsed, progress: 1 }
}

export const STAGE_COLORS: Record<KitchenStage, string> = {
  nuevo: '#FF6B35',
  cocinando: '#FF3E3E',
  empacando: '#4CAF50',
  entregado: '#FFD700',
}

export const STAGE_LABELS: Record<KitchenStage, string> = {
  nuevo: 'Recibido',
  cocinando: 'Cocinando',
  empacando: 'Empacando',
  entregado: 'Entregado',
}

export const STAGE_EMOJIS: Record<KitchenStage, string> = {
  nuevo: '📋',
  cocinando: '🔥',
  empacando: '📦',
  entregado: '✅',
}

export const ORDER_COLORS: Record<string, string> = {
  delivery: '#4A90D9',
  local: '#50C878',
  para_llevar: '#FF8C42',
}

export function getOrderColor(tipo: string): string {
  return ORDER_COLORS[tipo] ?? '#999999'
}

function safeAudioContext(): AudioContext | null {
  try {
    return new AudioContext()
  } catch {
    return null
  }
}

export function playCoinSound() {
  const ctx = safeAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const osc1 = ctx.createOscillator()
  const g1 = ctx.createGain()
  osc1.connect(g1).connect(ctx.destination)
  osc1.frequency.setValueAtTime(2400, now)
  osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.08)
  g1.gain.setValueAtTime(0.15, now)
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  osc1.start(now)
  osc1.stop(now + 0.25)

  const osc2 = ctx.createOscillator()
  const g2 = ctx.createGain()
  osc2.connect(g2).connect(ctx.destination)
  osc2.frequency.setValueAtTime(3200, now + 0.1)
  osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.18)
  g2.gain.setValueAtTime(0.1, now + 0.1)
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
  osc2.start(now + 0.1)
  osc2.stop(now + 0.4)
}

export function playNewOrderSound() {
  const ctx = safeAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const notes = [523, 659, 784]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.connect(g).connect(ctx.destination)
    const t = now + i * 0.08
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0.12, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    osc.start(t)
    osc.stop(t + 0.2)
  })
}

export function playComboSound() {
  const ctx = safeAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const notes = [440, 554, 659, 880]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'square'
    osc.connect(g).connect(ctx.destination)
    const t = now + i * 0.06
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0.08, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    osc.start(t)
    osc.stop(t + 0.15)
  })
}

export function playAchievementSound() {
  const ctx = safeAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const chord = [523, 659, 784, 1047]
  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.connect(g).connect(ctx.destination)
    const t = now + i * 0.1
    osc.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0.1, t)
    g.gain.linearRampToValueAtTime(0.12, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.start(t)
    osc.stop(t + 0.5)
  })

  const shimmer = ctx.createOscillator()
  const sg = ctx.createGain()
  shimmer.type = 'triangle'
  shimmer.connect(sg).connect(ctx.destination)
  const st = now + 0.4
  shimmer.frequency.setValueAtTime(1568, st)
  shimmer.frequency.exponentialRampToValueAtTime(2093, st + 0.3)
  sg.gain.setValueAtTime(0.06, st)
  sg.gain.exponentialRampToValueAtTime(0.001, st + 0.4)
  shimmer.start(st)
  shimmer.stop(st + 0.4)
}
