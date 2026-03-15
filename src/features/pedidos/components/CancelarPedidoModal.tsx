'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { PedidoParaHistorial } from '../types/pedidos.types'
import { cancelOrderAction } from '@/app/actions/pedidos'
import { formatGuaranies } from '@/lib/utils/format'

interface Props {
  pedido: PedidoParaHistorial | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
  darkMode: boolean
}

export function CancelarPedidoModal({ pedido, open, onClose, onSuccess, darkMode }: Props) {
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!pedido) return
    setSubmitting(true)
    setError(null)
    const result = await cancelOrderAction(pedido.id, motivo.trim() || null)
    setSubmitting(false)
    if (result.success) {
      setMotivo('')
      onSuccess()
      onClose()
    } else {
      setError(result.error)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setMotivo('')
      setError(null)
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={handleClose}
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-xl ${
          darkMode
            ? 'bg-gray-900 border-gray-700 text-gray-100'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Anular pedido</h3>
              {pedido && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pedido #{pedido.numero_pedido} · {formatGuaranies(pedido.total)}
                </p>
              )}
            </div>
          </div>
          <p className="text-sm">
            Se revertirán los puntos al cliente, el stock de ingredientes e inventario, y la factura (si existe) quedará anulada. Esta acción no se puede deshacer.
          </p>
          <div>
            <label
              htmlFor="motivo-cancel"
              className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Motivo (opcional)
            </label>
            <input
              id="motivo-cancel"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: error de carga, cliente se arrepintió"
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                darkMode
                  ? 'border-gray-600 bg-gray-800 text-gray-100 placeholder:text-gray-500'
                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400'
              }`}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              darkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Anulando...' : 'Anular pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
