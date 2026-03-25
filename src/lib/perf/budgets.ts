export const PERF_BUDGETS_MS: Record<string, number> = {
  'pos.confirm_order.total': 900,
  'pedidos.cancel_order.rpc': 800,
  'pedidos.cancel_order.legacy': 1800,
  'admin.dashboard.total': 1200,
  'kitchen.orders.snapshot': 700,
  'kitchen.orders.realtime_delta': 120
}

export function checkLatencyBudget(key: string, p95: number, samples: number): void {
  const budget = PERF_BUDGETS_MS[key]
  if (!budget) return
  if (samples < 5) return
  if (p95 > budget) {
    console.warn('[perf-budget]', key, {
      budget_ms: budget,
      p95_ms: p95,
      samples
    })
  }
}
