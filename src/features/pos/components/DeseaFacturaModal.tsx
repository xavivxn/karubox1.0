'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  darkMode?: boolean
  onClose: () => void
  /**
   * Sí → factura a nombre del cliente (RUC o nombre+CI según datos).
   * No → comprobante genérico (Nombre: Cliente, RUC: 0). Segundo argumento reservado (siempre false desde este modal).
   */
  onConfirm: (facturaALNombreDelCliente: boolean, comprobanteNombreYCI: boolean) => void
  isProcessing?: boolean
}

const safeTop = 'pt-[max(0.75rem,env(safe-area-inset-top))]'
const safeBottom = 'pb-[max(1rem,env(safe-area-inset-bottom))]'
const safeX = 'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]'

/**
 * Tras “Confirmar pedido”: una sola pregunta; al tocar Sí o No se confirma el pedido y se emite la factura (vía backend).
 */
export function DeseaFacturaModal({ open, darkMode, onClose, onConfirm, isProcessing }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!open || !mounted) return null

  const busy = Boolean(isProcessing)

  const handleSi = () => {
    if (busy) return
    onConfirm(true, false)
  }

  const handleNo = () => {
    if (busy) return
    onConfirm(false, false)
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[75] flex items-end justify-center sm:items-center ${safeTop} sm:pt-4 ${safeBottom} sm:pb-4 ${safeX} sm:px-4 backdrop-blur-sm ${
        darkMode ? 'bg-black/60' : 'bg-black/50'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="desea-factura-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar"
        disabled={busy}
        onClick={busy ? undefined : onClose}
      />
      <div
        className={`relative z-10 w-full max-w-md sm:max-w-md rounded-t-[1.35rem] sm:rounded-2xl border shadow-2xl sm:border-x sm:border-t sm:border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 sm:py-3.5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <h2
            id="desea-factura-title"
            className={`text-lg font-bold tracking-tight sm:text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            ¿Desea factura?
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl transition disabled:opacity-50 ${
              darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-4 pt-4 sm:px-5 sm:pt-5">
          {busy ? (
            <p className={`text-center text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Procesando pedido…
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={handleSi}
              className={`min-h-[52px] rounded-2xl border-2 px-4 py-3.5 text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[56px] sm:text-lg ${
                darkMode
                  ? 'border-emerald-500/80 bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              Sí
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleNo}
              className={`min-h-[52px] rounded-2xl border-2 px-4 py-3.5 text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[56px] sm:text-lg ${
                darkMode
                  ? 'border-gray-500 bg-gray-600 text-white hover:bg-gray-500'
                  : 'border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              No
            </button>
          </div>

          <p className={`pb-1 text-center text-xs leading-relaxed sm:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Los puntos del cliente se registran igual en ambos casos.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
