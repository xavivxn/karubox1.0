import { checkLatencyBudget } from './budgets'

type MetricSample = {
  value: number
  at: number
}

const MAX_SAMPLES_PER_KEY = 200
const store = new Map<string, MetricSample[]>()

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0
  const idx = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil((p / 100) * sortedValues.length) - 1))
  return sortedValues[idx] ?? 0
}

export function measureStart(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function registerLatencySample(key: string, elapsedMs: number): void {
  const samples = store.get(key) ?? []
  samples.push({ value: elapsedMs, at: Date.now() })
  if (samples.length > MAX_SAMPLES_PER_KEY) {
    samples.splice(0, samples.length - MAX_SAMPLES_PER_KEY)
  }
  store.set(key, samples)
}

export function measureEnd(
  key: string,
  startedAt: number,
  metadata?: Record<string, unknown>
): number {
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const elapsedMs = Math.max(0, end - startedAt)
  registerLatencySample(key, elapsedMs)
  console.info('[perf]', key, {
    elapsed_ms: Math.round(elapsedMs),
    ...metadata
  })
  const summary = getLatencySummary(key)
  checkLatencyBudget(key, summary.p95, summary.count)
  return elapsedMs
}

export function getLatencySummary(key: string): {
  count: number
  p50: number
  p95: number
  max: number
} {
  const values = (store.get(key) ?? []).map((s) => s.value).sort((a, b) => a - b)
  if (values.length === 0) {
    return { count: 0, p50: 0, p95: 0, max: 0 }
  }
  return {
    count: values.length,
    p50: Math.round(percentile(values, 50)),
    p95: Math.round(percentile(values, 95)),
    max: Math.round(values[values.length - 1] ?? 0)
  }
}

export function logLatencySummary(key: string): void {
  const summary = getLatencySummary(key)
  if (summary.count === 0) return
  console.info('[perf-summary]', key, summary)
}
