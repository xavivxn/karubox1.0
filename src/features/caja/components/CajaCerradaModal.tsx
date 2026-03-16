'use client'

import { Wallet } from 'lucide-react'

interface CajaCerradaModalProps {
  open: boolean
  onClose: () => void
  darkMode?: boolean
}

/**
 * Modal que se muestra cuando el usuario intenta agregar un ítem o confirmar pedido con la caja cerrada.
 */
export function CajaCerradaModal({ open, onClose, darkMode = false }: CajaCerradaModalProps) {
  if (!open) return null

  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const bg = darkMode ? 'bg-gray-900' : 'bg-white'
  const text = darkMode ? 'text-gray-100' : 'text-gray-900'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="caja-cerrada-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border ${border} ${bg} shadow-xl p-6 text-center`}
      >
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400">
            <Wallet className="h-7 w-7" />
          </div>
        </div>
        <h2 id="caja-cerrada-title" className={`text-lg font-bold ${text} mb-2`}>
          Caja cerrada
        </h2>
        <p className={`text-sm ${muted} mb-6`}>
          Un administrador debe iniciar el día desde el panel de Administración para poder registrar ventas.
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition`}
        >
          Entendido
        </button>
      </div>
    </div>
  )
}
