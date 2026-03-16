/**
 * Panel de Clientes - Modal de Campaña
 * Configura y lanza una campaña de fidelización (mensaje + puntos regalo)
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Send, Gift, Users, MessageSquare, Info, Loader2, Lightbulb } from 'lucide-react'
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

// Placeholders amigables en el texto; se convierten a {{variable}} al enviar
const PLACEHOLDERS: { amigable: string; tecnico: string }[] = [
  { amigable: '[Nombre del cliente]', tecnico: '{{nombre_cliente}}' },
  { amigable: '[Nombre del negocio]', tecnico: '{{nombre_lomiteria}}' },
  { amigable: '[Puntos actuales]', tecnico: '{{puntos}}' },
  { amigable: '[Puntos de regalo]', tecnico: '{{puntos_regalo}}' },
  { amigable: '[Días sin visitar]', tecnico: '{{dias_inactivo}}' },
  { amigable: '[Mensaje extra]', tecnico: '{{mensaje_personalizado}}' },
]

function mensajeATecnico(texto: string): string {
  let r = texto
  for (const { amigable, tecnico } of PLACEHOLDERS) {
    r = r.split(amigable).join(tecnico)
  }
  return r
}

function mensajeAAmigable(texto: string): string {
  let r = texto
  for (const { amigable, tecnico } of PLACEHOLDERS) {
    r = r.split(tecnico).join(amigable)
  }
  return r
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
    const raw = (campanaConfig[templateKey] as string) || ''
    setMensaje(mensajeAAmigable(raw))
    setPuntosRegalo((campanaConfig[puntosKey] as number) || 0)
  }, [isOpen, tipo, campanaConfig])

  if (!isOpen) return null

  const conEmail = destinatarios.filter((c) => c.email).length
  const conTelefono = destinatarios.filter((c) => c.telefono).length
  const totalPuntos = puntosRegalo * destinatarios.length

  const VARIABLES: { insertar: string; label: string; desc: string }[] = [
    { insertar: '[Nombre del cliente]', label: 'Nombre del cliente', desc: 'Ej: Juan' },
    { insertar: '[Nombre del negocio]', label: 'Nombre de tu negocio', desc: tenantNombre || 'Tu lomitería' },
    { insertar: '[Puntos actuales]', label: 'Puntos que tiene hoy', desc: 'Saldo actual' },
    { insertar: '[Puntos de regalo]', label: 'Puntos que le regalás', desc: 'Los de esta campaña' },
    { insertar: '[Días sin visitar]', label: 'Días sin visitar', desc: 'Solo inactivos' },
    { insertar: '[Mensaje extra]', label: 'Mensaje extra', desc: 'Opcional' },
  ]

  const mensajeEjemplo =
    tipo === 'personalizado'
      ? `Hola [Nombre del cliente], desde [Nombre del negocio] te saludamos. Te regalamos [Puntos de regalo] puntos. ¡Gracias por ser parte!`
      : `Hola [Nombre del cliente], hace [Días sin visitar] días que no te vemos en [Nombre del negocio]. Te regalamos [Puntos de regalo] puntos para que vuelvas. ¡Te esperamos!`

  const handleConfirm = async () => {
    if (destinatarios.length === 0) {
      alert('No hay destinatarios para esta campaña.')
      return
    }
    if (!mensaje.trim()) {
      alert('El mensaje no puede estar vacío.')
      return
    }
    const mensajeParaEnviar = mensajeATecnico(mensaje)
    await onConfirm(mensajeParaEnviar, puntosRegalo)
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-black/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 text-2xl">
              {TIPO_ICON[tipo]}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {TIPO_LABELS[tipo]}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Dirigido a {TIPO_DESCRIPCION[tipo]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={ejecutando}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Destinatarios - cards en fila */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Destinatarios
            </h3>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Users size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-white text-lg tabular-nums">{destinatarios.length}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">destinatarios</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40 text-lg">
                  📱
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-white tabular-nums">{conTelefono}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">con WhatsApp</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/40 text-lg">
                  📧
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-white tabular-nums">{conEmail}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">con email</span>
                </div>
              </div>
            </div>
          </section>

          {/* Mensaje */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
                <MessageSquare size={16} className="text-green-600 dark:text-green-400" />
                Mensaje que recibirá cada cliente
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{mensaje.length} caracteres</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Escribí el texto como si le hablaras a un cliente. Abajo podés insertar atajos (nombre, puntos, etc.) que se reemplazan solos por cada persona.
            </p>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 focus:border-transparent resize-y transition-colors placeholder:font-normal"
              placeholder="Ej: Hola, te extrañamos. Te regalamos puntos para que vuelvas..."
              disabled={ejecutando}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMensaje(mensajeEjemplo)}
                disabled={ejecutando}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
              >
                <Lightbulb size={14} />
                Usar mensaje de ejemplo
              </button>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Atajos (clic para agregar al mensaje):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VARIABLES.map((v) => (
                  <button
                    key={v.insertar}
                    type="button"
                    onClick={() => setMensaje((prev) => prev + v.insertar)}
                    disabled={ejecutando}
                    className="flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-colors group"
                  >
                    <span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block">{v.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{v.desc}</span>
                    </span>
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50">
                      {v.insertar}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Puntos regalo */}
          <section className="rounded-xl border border-yellow-200 dark:border-yellow-800/60 bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <label className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200 mb-3">
              <Gift size={18} className="text-yellow-600 dark:text-yellow-400" />
              Regalar puntos por cliente
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={puntosRegalo}
                  onChange={(e) => setPuntosRegalo(Math.max(0, Number(e.target.value)))}
                  className="w-24 border border-yellow-300 dark:border-yellow-700 rounded-lg px-3 py-2 text-center text-lg font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500"
                  disabled={ejecutando}
                />
                <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">puntos / cliente</span>
              </div>
              {destinatarios.length > 0 && puntosRegalo > 0 && (
                <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  = {totalPuntos.toLocaleString()} puntos en total
                </div>
              )}
            </div>
            {puntosRegalo > 0 && (
              <p className="text-xs text-yellow-700 dark:text-yellow-400/90 mt-2">
                Los puntos se acreditarán al registrar la campaña.
              </p>
            )}
          </section>

          {/* Nota de envío */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 p-3">
            <Info size={18} className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-200">
              <strong className="font-semibold">Nota:</strong> Los mensajes de WhatsApp y Email se enviarán
              cuando el canal esté configurado. Los puntos regalo se acreditan al confirmar.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-2xl shrink-0">
          <button
            onClick={onClose}
            disabled={ejecutando}
            className="flex-1 px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={ejecutando || destinatarios.length === 0}
            className="flex-1 px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-orange-500 dark:bg-orange-600 text-white hover:bg-orange-600 dark:hover:bg-orange-500"
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
