'use client'

import { X, Loader2, Sun, AlertTriangle, ShieldAlert } from 'lucide-react'

export type ConfirmVariant = 'primary' | 'warning' | 'danger'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  /** Mensaje de error a mostrar debajo del mensaje (ej. fallo al ejecutar la acción) */
  errorMessage?: string | null
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: ConfirmVariant
  /** Mientras es true, el botón confirmar muestra spinner y está deshabilitado */
  loading?: boolean
  darkMode?: boolean
}

const variantStyles: Record<ConfirmVariant, { btn: string; icon: string; Icon: React.ComponentType<{ className?: string }> }> = {
  primary: {
    btn: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white',
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    Icon: Sun
  },
  warning: {
    btn: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white',
    icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    Icon: AlertTriangle
  },
  danger: {
    btn: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    Icon: ShieldAlert
  }
}

export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  errorMessage,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  variant = 'primary',
  loading = false,
  darkMode = false
}: ConfirmModalProps) {
  if (!open) return null

  const styles = variantStyles[variant]
  const Icon = styles.Icon
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const bg = darkMode ? 'bg-gray-900' : 'bg-white'
  const text = darkMode ? 'text-gray-100' : 'text-gray-900'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border ${border} ${bg} shadow-xl`}
      >
        <div className={`flex items-start justify-between border-b ${border} px-5 py-4`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="confirm-modal-title" className={`text-lg font-bold ${text}`}>
                {title}
              </h2>
              <p className={`text-sm ${muted} mt-0.5`}>
                {message}
              </p>
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium" role="alert">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`rounded-lg p-2 ${muted} hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex gap-3 border-t ${border} px-5 py-4`}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`flex-1 rounded-xl border ${border} px-4 py-2.5 text-sm font-semibold ${text} hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-2 ${styles.btn}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
