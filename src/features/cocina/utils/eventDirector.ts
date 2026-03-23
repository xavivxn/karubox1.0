/**
 * Puerta ligera de estímulos: evita ráfagas de audio / confetti que saturan.
 * Solo deja pasar un evento por canal si pasó el cooldown mínimo.
 */
export type StimulusChannel = 'coin' | 'newOrder' | 'comboSound' | 'confettiBurst'

const DEFAULT_COOLDOWN_MS: Record<StimulusChannel, number> = {
  /** Varias entregas seguidas: un solo “cling” cercano, el resto silencioso */
  coin: 450,
  /** Pedidos en ráfaga */
  newOrder: 180,
  /** Combo ya es raro; evitar doble hit si el streak salta rápido */
  comboSound: 2200,
  /** Confetti pesado: uno por ventana */
  confettiBurst: 3200,
}

export function createStimulusGate(cooldowns: Partial<Record<StimulusChannel, number>> = {}) {
  const ms = { ...DEFAULT_COOLDOWN_MS, ...cooldowns }
  const last = new Map<StimulusChannel, number>()

  return {
    tryFire(channel: StimulusChannel): boolean {
      const now = Date.now()
      const min = ms[channel]
      const prev = last.get(channel) ?? 0
      if (now - prev < min) return false
      last.set(channel, now)
      return true
    },
  }
}

export type StimulusGate = ReturnType<typeof createStimulusGate>
