/**
 * Admin Module - Date Utilities
 * Funciones para manejo de fechas en el dashboard
 */

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
