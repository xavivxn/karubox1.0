/**
 * Admin Module - Date Utilities
 * Funciones para manejo de fechas en el dashboard
 */

import type { AdminDatePreset, AdminDateRange } from '../types/admin.types'

/**
 * Obtiene el inicio del día actual
 */
export const getTodayStart = (): Date => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

/**
 * Obtiene el inicio del mes actual
 */
export const getMonthStart = (): Date => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

/**
 * Obtiene el inicio de la semana (7 días atrás)
 */
export const getWeekStart = (): Date => {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

const getDayStart = (date: Date): Date => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

const addDays = (date: Date, days: number): Date => {
  const value = new Date(date)
  value.setDate(value.getDate() + days)
  return value
}

const getMonthStartFromDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })
}

export const getDateRangeLabel = (preset: AdminDatePreset): string => {
  switch (preset) {
    case 'turno_actual':
      return 'Turno actual'
    case 'hoy':
      return 'Hoy'
    case 'ayer':
      return 'Ayer'
    case 'ultimos_7_dias':
      return 'Últimos 7 días'
    case 'este_mes':
      return 'Este mes'
    case 'mes_pasado':
      return 'Mes pasado'
    case 'historico':
      return 'Histórico completo'
    default:
      return 'Período'
  }
}

export const resolveAdminDateRange = (
  preset: AdminDatePreset,
  options?: {
    turnStartAt?: string | null
    /**
     * Sin sesión abierta: acotar consultas al último turno cerrado (mismos pedidos que el cierre de caja).
     * `cierre_at` se usa como límite exclusivo en queries (lt).
     */
    lastClosedTurn?: { apertura_at: string; cierre_at: string } | null
    now?: Date
  }
): AdminDateRange => {
  const now = options?.now ? new Date(options.now) : new Date()
  const todayStart = getDayStart(now)

  switch (preset) {
    case 'turno_actual': {
      const turnStartAt = options?.turnStartAt ?? null
      if (turnStartAt) {
        return {
          preset,
          label: getDateRangeLabel(preset),
          from: turnStartAt,
          to: null
        }
      }
      const last = options?.lastClosedTurn
      if (last?.apertura_at && last?.cierre_at) {
        return {
          preset,
          label: 'Último turno cerrado',
          from: last.apertura_at,
          to: last.cierre_at
        }
      }
      return {
        preset,
        label: getDateRangeLabel(preset),
        from: todayStart.toISOString(),
        to: null
      }
    }
    case 'hoy':
      return {
        preset,
        label: getDateRangeLabel(preset),
        from: todayStart.toISOString(),
        to: null
      }
    case 'ayer': {
      const yesterdayStart = addDays(todayStart, -1)
      return {
        preset,
        label: getDateRangeLabel(preset),
        from: yesterdayStart.toISOString(),
        to: todayStart.toISOString()
      }
    }
    case 'ultimos_7_dias': {
      const weekStart = addDays(todayStart, -6)
      return {
        preset,
        label: getDateRangeLabel(preset),
        from: weekStart.toISOString(),
        to: null
      }
    }
    case 'este_mes': {
      const monthStart = getMonthStartFromDate(now)
      return {
        preset,
        label: getDateRangeLabel(preset),
        from: monthStart.toISOString(),
        to: null
      }
    }
    case 'mes_pasado': {
      const currentMonthStart = getMonthStartFromDate(now)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return {
        preset,
        label: getDateRangeLabel(preset),
        from: previousMonthStart.toISOString(),
        to: currentMonthStart.toISOString()
      }
    }
    case 'historico':
      return {
        preset,
        label: getDateRangeLabel(preset),
        from: null,
        to: null
      }
    default:
      return {
        preset: 'hoy',
        label: getDateRangeLabel('hoy'),
        from: todayStart.toISOString(),
        to: null
      }
  }
}

export const buildTrendContextLabel = (
  range: AdminDateRange,
  options?: { now?: Date }
): string => {
  const now = options?.now ? new Date(options.now) : new Date()

  if (!range.from && !range.to) {
    return 'Muestra reciente del histórico'
  }
  if (range.from && !range.to) {
    return `Desde ${formatShortDate(new Date(range.from))} hasta hoy`
  }
  if (range.from && range.to) {
    if (range.preset === 'turno_actual') {
      const from = new Date(range.from)
      const toExclusive = new Date(range.to)
      const toInclusive = new Date(toExclusive.getTime() - 1)
      const dOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
      const tOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
      return `${from.toLocaleDateString('es-PY', dOpts)} · ${from.toLocaleTimeString('es-PY', tOpts)} – ${toInclusive.toLocaleTimeString('es-PY', tOpts)}`
    }
    const toDateExclusive = new Date(range.to)
    const toDateInclusive = addDays(getDayStart(toDateExclusive), -1)
    return `${formatShortDate(new Date(range.from))} - ${formatShortDate(toDateInclusive)}`
  }
  return `Actualizado al ${formatShortDate(now)}`
}
