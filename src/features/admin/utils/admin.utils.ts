/**
 * Admin Module - Utility Functions
 * Funciones puras y helpers para el módulo de administración
 */

export const ESTIMATED_COST_RATIO = 0.48

/**
 * Normaliza un valor numérico, manejando null y undefined
 */
export const normalizeNumber = (value: number | null | undefined): number => {
  return Number(value ?? 0)
}

/**
 * Estima el costo a partir de un monto usando el ratio estándar
 */
export const estimateCostFromAmount = (value: number): number => {
  return Math.round(normalizeNumber(value) * ESTIMATED_COST_RATIO)
}

/**
 * Construye las etiquetas de los últimos 7 días para el gráfico de tendencia semanal
 */
export const buildWeekLabels = (): Array<{ label: string; date: string }> => {
  const labels: { label: string; date: string }[] = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    labels.push({
      label: date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
      date: date.toISOString()
    })
  }
  
  return labels
}

/**
 * Formatea la fecha de hoy en formato legible
 */
export const getTodayLabel = (): string => {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date())
}

/**
 * Calcula el progreso porcentual del stock
 */
export const calculateStockProgress = (
  stockActual: number,
  stockMinimo: number
): number => {
  return Math.min(100, (stockActual / Math.max(stockMinimo || 1, 1)) * 100)
}
