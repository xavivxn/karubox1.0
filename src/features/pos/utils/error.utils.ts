import type { PostgrestError } from '@supabase/supabase-js'
import type { FeedbackState, FeedbackDetail } from '../types/pos.types'

export const buildUnexpectedErrorState = (title: string, rawError: unknown): FeedbackState => {
  const postgrestError = rawError as Partial<PostgrestError>
  const message =
    postgrestError?.message ||
    (rawError instanceof Error ? rawError.message : 'Ocurrió un error inesperado. Intenta nuevamente.')

  const details: FeedbackDetail[] = []
  if (postgrestError?.code) {
    details.push({ label: 'Código', value: postgrestError.code })
  }
  if (postgrestError?.details) {
    details.push({ label: 'Detalle', value: String(postgrestError.details) })
  }
  if (postgrestError?.hint) {
    details.push({ label: 'Hint', value: postgrestError.hint })
  }

  return {
    type: 'error',
    title,
    message,
    details: details.length ? details : undefined
  }
}
