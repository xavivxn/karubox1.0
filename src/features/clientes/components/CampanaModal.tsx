/**
 * Panel de Clientes - Modal de Campaña
 * Configura y lanza una campaña de fidelización (mensaje + puntos regalo)
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Send, Gift, Users, MessageSquare, Info, Loader2 } from 'lucide-react'
import type { ClienteConVisita, TipoCampana, CampanaConfig } from '../types/clientes.types'
import { TIPO_LABELS } from '../services/campanasService'

interface CampanaModalProps {
  isOpen: boolean
  tipo: TipoCampana
  destinatarios: ClienteConVisita[]
  campanaConfig: CampanaConfig | null
  tenantNombre: string
  ejecutando: boolean
  onClose: () => void
  onConfirm: (mensaje: string, puntosRegalo: number) => Promise<void>
}

const TIPO_DESCRIPCION: Record<TipoCampana, string> = {
  inactivos_15: 'clientes que no vienen hace 15 días o más',
  inactivos_30: 'clientes que no vienen hace 30 días o más',
  personalizado: 'todos los clientes registrados',
}

const TIPO_ICON: Record<TipoCampana, string> = {
  inactivos_15: '⏰',
  inactivos_30: '😴',
  personalizado: '📣',
}

const CONFIG_TEMPLATE_KEY: Record<TipoCampana, keyof CampanaConfig> = {
  inactivos_15: 'template_wa_15dias',
  inactivos_30: 'template_wa_30dias',
  personalizado: 'template_wa_personalizado',
}

const CONFIG_PUNTOS_KEY: Record<TipoCampana, keyof CampanaConfig> = {
  inactivos_15: 'puntos_regalo_15dias',
  inactivos_30: 'puntos_regalo_30dias',
  personalizado: 'puntos_regalo_personalizado',
}

export const CampanaModal = ({
  isOpen,
  tipo,
  destinatarios,
  campanaConfig,
  tenantNombre,
  ejecutando,
  onClose,
  onConfirm,
}: CampanaModalProps) => {
  const [mensaje, setMensaje] = useState('')
  const [puntosRegalo, setPuntosRegalo] = useState(0)

  useEffect(() => {
    if (!isOpen || !campanaConfig) return
    const templateKey = CONFIG_TEMPLATE_KEY[tipo]
    const puntosKey = CONFIG_PUNTOS_KEY[tipo]
    setMensaje((campanaConfig[templateKey] as string) || '')
    setPuntosRegalo((campanaConfig[puntosKey] as number) || 0)
  }, [isOpen, tipo, campanaConfig])

  if (!isOpen) return null

  const conEmail = destinatarios.filter((c) => c.email).length
  const conTelefono = destinatarios.filter((c) => c.telefono).length
  const totalPuntos = puntosRegalo * destinatarios.length

  const VARIABLES = [
    '{{nombre_cliente}}',
    '{{nombre_lomiteria}}',
    '{{puntos}}',
    '{{puntos_regalo}}',
    '{{dias_inactivo}}',
    '{{mensaje_personalizado}}',
  ]

  const handleConfirm = async () => {
    if (destinatarios.length === 0) {
      alert('No hay destinatarios para esta campaña.')
      return
    }
    if (!mensaje.trim()) {
      alert('El mensaje no puede estar vacío.')
      return
    }
    await onConfirm(mensaje, puntosRegalo)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{TIPO_ICON[tipo]}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {TIPO_LABELS[tipo]}
              </h2>
              <p className="text-sm text-gray-500">
                Dirigido a {TIPO_DESCRIPCION[tipo]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={ejecutando}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Destinatarios */}
          <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <span className="font-semibold text-gray-800">
                {destinatarios.length}
              </span>
              <span className="text-gray-500 text-sm">destinatarios</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📱</span>
              <span className="font-semibold text-gray-800">{conTelefono}</span>
              <span className="text-gray-500 text-sm">con WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📧</span>
              <span className="font-semibold text-gray-800">{conEmail}</span>
              <span className="text-gray-500 text-sm">con email</span>
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 font-semibold text-gray-800">
                <MessageSquare size={16} className="text-green-600" />
                Mensaje WhatsApp
              </label>
              <span className="text-xs text-gray-400">{mensaje.length} caracteres</span>
            </div>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={8}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
              placeholder="Escribí el mensaje..."
              disabled={ejecutando}
            />
            {/* Variables disponibles */}
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Variables disponibles (hacé click para insertar):</p>
              <div className="flex flex-wrap gap-1">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMensaje((prev) => prev + v)}
                    className="text-xs px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors font-mono"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Puntos regalo */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <label className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
              <Gift size={18} className="text-yellow-600" />
              Regalar puntos por cliente
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={puntosRegalo}
                  onChange={(e) => setPuntosRegalo(Math.max(0, Number(e.target.value)))}
                  className="w-24 border border-yellow-300 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={ejecutando}
                />
                <span className="text-gray-600 font-medium">puntos / cliente</span>
              </div>
              {destinatarios.length > 0 && puntosRegalo > 0 && (
                <div className="text-sm text-yellow-700 font-medium">
                  = {totalPuntos.toLocaleString()} puntos en total
                </div>
              )}
            </div>
            {puntosRegalo > 0 && (
              <p className="text-xs text-yellow-700 mt-2">
                Los puntos se acreditarán inmediatamente al registrar la campaña.
              </p>
            )}
          </div>

          {/* Nota de envío */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Los mensajes de WhatsApp y Email se enviarán
              automáticamente cuando el canal esté configurado.
              Los puntos regalo se acreditan ahora.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={ejecutando}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={ejecutando || destinatarios.length === 0}
            className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {ejecutando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Send size={18} />
                Registrar campaña ({destinatarios.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
