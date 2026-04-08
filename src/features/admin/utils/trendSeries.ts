/**
 * Series de ingresos por hora o por día según el preset del dashboard admin.
 * Velas: OHLC por bucket (primer pedido, último, máx., mín. por ticket) + volumen = suma.
 */

import type {
  AdminDateRange,
  AdminDatePreset,
  CandlestickTrendItem,
  PedidoRecord,
  TrendBucketItem,
  WeeklyTrendItem,
} from '../types/admin.types'
import { normalizeNumber } from './admin.utils'

const HISTORICO_MAX_DIAS = 60
const MAX_HOUR_SLOTS = 72

function dayStart(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function dayKeyFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function hourSlotKey(d: Date): string {
  return `${dayKeyFromDate(d)}-${String(d.getHours()).padStart(2, '0')}`
}

function sumByPedidoHour(pedidos: PedidoRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const p of pedidos) {
    const d = new Date(p.created_at)
    const k = hourSlotKey(d)
    map.set(k, (map.get(k) ?? 0) + normalizeNumber(p.total))
  }
  return map
}

function sumByPedidoDay(pedidos: PedidoRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const p of pedidos) {
    const d = new Date(p.created_at)
    const k = dayKeyFromDate(d)
    map.set(k, (map.get(k) ?? 0) + normalizeNumber(p.total))
  }
  return map
}

export function getTrendGranularity(preset: AdminDatePreset): 'hour' | 'day' {
  if (preset === 'turno_actual' || preset === 'hoy' || preset === 'ayer') return 'hour'
  return 'day'
}

function buildUltimos7DiasLabels(now: Date): Array<{ key: string; label: string }> {
  const end = dayStart(now)
  const out: Array<{ key: string; label: string }> = []
  for (let i = 6; i >= 0; i--) {
    const d = addDays(end, -i)
    out.push({
      key: dayKeyFromDate(d),
      label: d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
    })
  }
  return out
}

function buildHourSlots(dateRange: AdminDateRange, now: Date): Array<{ key: string; label: string }> {
  const preset = dateRange.preset
  let rangeStart: Date
  let rangeEnd: Date

  if (preset === 'ayer') {
    const todayStart = dayStart(now)
    rangeStart = addDays(todayStart, -1)
    rangeEnd = new Date(todayStart.getTime() - 1)
  } else if (preset === 'hoy') {
    rangeStart = dayStart(now)
    rangeEnd = new Date(now)
  } else {
    rangeStart = dateRange.from ? new Date(dateRange.from) : dayStart(now)
    // Para turno cerrado, `to` es límite exclusivo; lo convertimos a inclusivo
    // para no mostrar horas posteriores al cierre.
    if (preset === 'turno_actual' && dateRange.to) {
      rangeEnd = new Date(new Date(dateRange.to).getTime() - 1)
    } else {
      rangeEnd = new Date(now)
    }
  }

  let cursor = new Date(rangeStart)
  cursor.setMinutes(0, 0, 0)
  if (cursor < rangeStart) {
    cursor.setHours(cursor.getHours() + 1)
  }

  const spanMultiDay = rangeEnd.getTime() - rangeStart.getTime() > 24 * 60 * 60 * 1000

  const slots: Array<{ key: string; label: string }> = []
  const endCap = new Date(rangeEnd)

  while (cursor <= endCap && slots.length < MAX_HOUR_SLOTS) {
    const key = hourSlotKey(cursor)
    const label = spanMultiDay
      ? cursor.toLocaleString('es-PY', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : cursor.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    slots.push({ key, label })
    cursor.setHours(cursor.getHours() + 1)
  }

  return slots
}

function buildDaySlots(
  dateRange: AdminDateRange,
  now: Date,
  pedidos: PedidoRecord[]
): Array<{ key: string; label: string }> {
  const preset = dateRange.preset

  if (preset === 'ultimos_7_dias') {
    return buildUltimos7DiasLabels(now)
  }

  if (preset === 'este_mes') {
    const start = dateRange.from ? dateRange.from : dayStart(now).toISOString()
    let cursor = dayStart(new Date(start))
    const end = dayStart(now)
    const slots: Array<{ key: string; label: string }> = []
    while (cursor <= end) {
      slots.push({
        key: dayKeyFromDate(cursor),
        label: cursor.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
      })
      cursor = addDays(cursor, 1)
    }
    return slots
  }

  if (preset === 'mes_pasado') {
    if (!dateRange.from || !dateRange.to) return []
    let cursor = dayStart(new Date(dateRange.from))
    const endEx = new Date(dateRange.to)
    const slots: Array<{ key: string; label: string }> = []
    while (cursor < endEx) {
      slots.push({
        key: dayKeyFromDate(cursor),
        label: cursor.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
      })
      cursor = addDays(cursor, 1)
    }
    return slots
  }

  if (preset === 'historico') {
    const sums = sumByPedidoDay(pedidos)
    const keys = [...sums.keys()].sort().slice(-HISTORICO_MAX_DIAS)
    return keys.map((dayKey) => {
      const [y, m, d] = dayKey.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      return {
        key: dayKey,
        label: dt.toLocaleDateString('es-PY', { day: '2-digit', month: 'short' }),
      }
    })
  }

  return buildUltimos7DiasLabels(now)
}

function candleFromOrders(orders: PedidoRecord[]): Omit<CandlestickTrendItem, 'label'> {
  if (orders.length === 0) {
    return { open: 0, high: 0, low: 0, close: 0, volume: 0 }
  }
  const sorted = [...orders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const totals = sorted.map((p) => normalizeNumber(p.total))
  const volume = totals.reduce((a, b) => a + b, 0)
  return {
    open: totals[0],
    close: totals[totals.length - 1],
    high: Math.max(...totals),
    low: Math.min(...totals),
    volume,
  }
}

function ordersInHourSlot(pedidos: PedidoRecord[], slotKey: string): PedidoRecord[] {
  return pedidos.filter((p) => hourSlotKey(new Date(p.created_at)) === slotKey)
}

function ordersInDaySlot(pedidos: PedidoRecord[], dayKey: string): PedidoRecord[] {
  return pedidos.filter((p) => dayKeyFromDate(new Date(p.created_at)) === dayKey)
}

/**
 * Serie de ingresos (suma por bucket) para KPIs compatibles.
 */
export function processTrendSeries(
  pedidos: PedidoRecord[],
  dateRange: AdminDateRange,
  options?: { now?: Date }
): WeeklyTrendItem[] {
  return processTrendBuckets(pedidos, dateRange, options).map((bucket) => ({
    label: bucket.label,
    value: bucket.revenue,
  }))
}

/**
 * Serie normalizada por bucket temporal para múltiples métricas del gráfico.
 */
export function processTrendBuckets(
  pedidos: PedidoRecord[],
  dateRange: AdminDateRange,
  options?: { now?: Date }
): TrendBucketItem[] {
  const now = options?.now ? new Date(options.now) : new Date()
  const g = getTrendGranularity(dateRange.preset)

  const slots =
    g === 'hour' ? buildHourSlots(dateRange, now) : buildDaySlots(dateRange, now, pedidos)

  return slots.map((slot) => {
    const bucket =
      g === 'hour' ? ordersInHourSlot(pedidos, slot.key) : ordersInDaySlot(pedidos, slot.key)
    const revenue = bucket.reduce((sum, order) => sum + normalizeNumber(order.total), 0)
    const orders = bucket.length
    return {
      label: slot.label,
      timestamp: slot.key,
      revenue,
      orders,
      avgTicket: orders > 0 ? Math.round(revenue / orders) : 0,
    }
  })
}

/**
 * Velas OHLC + volumen por bucket (misma rejilla que processTrendSeries).
 */
export function processCandleSeries(
  pedidos: PedidoRecord[],
  dateRange: AdminDateRange,
  options?: { now?: Date }
): CandlestickTrendItem[] {
  const now = options?.now ? new Date(options.now) : new Date()
  const g = getTrendGranularity(dateRange.preset)

  if (g === 'hour') {
    const slots = buildHourSlots(dateRange, now)
    return slots.map((s) => {
      const bucket = ordersInHourSlot(pedidos, s.key)
      const c = candleFromOrders(bucket)
      return { label: s.label, ...c }
    })
  }

  const slots = buildDaySlots(dateRange, now, pedidos)
  return slots.map((s) => {
    const bucket = ordersInDaySlot(pedidos, s.key)
    const c = candleFromOrders(bucket)
    return { label: s.label, ...c }
  })
}
