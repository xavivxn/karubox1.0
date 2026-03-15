/**
 * Panel de Clientes - Drawer de detalle
 * Panel deslizante derecho con info completa del cliente:
 * datos, puntos, última visita, historial de transacciones, regalo de puntos
 */

'use client'

import { useState, useEffect } from 'react'
import {
  X, Phone, Mail, CreditCard, Hash, MapPin, FileText,
  Star, ShoppingBag, Banknote, CalendarDays, Gift, Edit2, Loader2, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ClienteConVisita } from '../types/clientes.types'
import { formatearFecha } from '../utils/clientes.utils'
import { formatGuaranies } from '@/lib/utils/format'

interface TransaccionRow {
  id: string
  tipo: 'ganado' | 'canjeado' | 'ajuste' | 'expiracion'
  puntos: number
  saldo_anterior: number
  saldo_nuevo: number
  descripcion: string | null
  created_at: string
}

interface ClienteDetailDrawerProps {
  cliente: ClienteConVisita | null
  isOpen: boolean
  onClose: () => void
  onEdit: (cliente: ClienteConVisita) => void
  onRegalarPuntos: (clienteId: string, puntos: number, descripcion: string) => Promise<void>
}

const TIPO_TRANSACCION: Record<string, { label: string; color: string; sign: string }> = {
  ganado:    { label: 'Ganado',  color: 'text-green-600',  sign: '+' },
  canjeado:  { label: 'Canje',   color: 'text-red-500',    sign: '-' },
  ajuste:    { label: 'Ajuste',  color: 'text-blue-600',   sign: '+' },
  expiracion:{ label: 'Venció',  color: 'text-gray-400',   sign: '-' },
}

export const ClienteDetailDrawer = ({
  cliente,
  isOpen,
  onClose,
  onEdit,
  onRegalarPuntos,
}: ClienteDetailDrawerProps) => {
  const [historial, setHistorial] = useState<TransaccionRow[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  // Gift points form
  const [mostrarRegalo, setMostrarRegalo] = useState(false)
  const [puntosInput, setPuntosInput] = useState('')
  const [motivoInput, setMotivoInput] = useState('')
  const [regalando, setRegalando] = useState(false)

  useEffect(() => {
    if (isOpen && cliente) {
      fetchHistorial(cliente.id)
      setMostrarRegalo(false)
      setPuntosInput('')
      setMotivoInput('')
    }
  }, [isOpen, cliente?.id])

  const fetchHistorial = async (clienteId: string) => {
    setLoadingHistorial(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('transacciones_puntos')
        .select('id, tipo, puntos, saldo_anterior, saldo_nuevo, descripcion, created_at')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(10)
      setHistorial((data as TransaccionRow[]) ?? [])
    } catch (e) {
      console.error('Error cargando historial de puntos:', e)
    } finally {
      setLoadingHistorial(false)
    }
  }

  const handleRegalar = async () => {
    if (!cliente) return
    const puntos = parseInt(puntosInput, 10)
    if (!puntos || puntos <= 0) {
      alert('Ingresá una cantidad válida de puntos.')
      return
    }
    setRegalando(true)
    try {
      await onRegalarPuntos(
        cliente.id,
        puntos,
        motivoInput.trim() || 'Regalo manual desde panel admin'
      )
      // Refresh historial
      await fetchHistorial(cliente.id)
      setPuntosInput('')
      setMotivoInput('')
      setMostrarRegalo(false)
      alert(`✅ Se acreditaron ${puntos} puntos a ${cliente.nombre}.`)
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    } finally {
      setRegalando(false)
    }
  }

  const diasLabel = (dias: number | null) => {
    if (dias === null) return { text: 'Sin visitas', color: 'text-gray-400' }
    if (dias === 0) return { text: 'Hoy', color: 'text-green-600' }
    if (dias === 1) return { text: 'Ayer', color: 'text-green-600' }
    if (dias < 15) return { text: `Hace ${dias} días`, color: 'text-green-600' }
    if (dias < 30) return { text: `Hace ${dias} días`, color: 'text-amber-600' }
    return { text: `Hace ${dias} días`, color: 'text-red-600' }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen && cliente ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen && cliente ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {!cliente ? null : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{cliente.nombre}</h2>
                <p className="text-sm text-gray-500">Cliente desde {formatearFecha(cliente.created_at!)}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Datos de contacto */}
              <section className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Datos de contacto
                </h3>
                <div className="space-y-2.5">
                  <InfoRow icon={<Phone size={15} />} label="Teléfono" value={cliente.telefono} />
                  <InfoRow icon={<Mail size={15} />} label="Email" value={cliente.email} />
                  <InfoRow icon={<CreditCard size={15} />} label="CI" value={cliente.ci} />
                  <InfoRow icon={<Hash size={15} />} label="RUC" value={(cliente as any).ruc} />
                  <InfoRow icon={<MapPin size={15} />} label="Dirección" value={(cliente as any).direccion} />
                  {(cliente as any).notas && (
                    <InfoRow icon={<FileText size={15} />} label="Notas" value={(cliente as any).notas} />
                  )}
                </div>
              </section>

              {/* Métricas */}
              <section className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Actividad y puntos
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    icon={<Star size={16} className="text-yellow-500" />}
                    label="Puntos actuales"
                    value={`⭐ ${cliente.puntos_totales.toLocaleString()}`}
                    big
                  />
                  <MetricCard
                    icon={<CalendarDays size={16} className="text-blue-500" />}
                    label="Última visita"
                    value={
                      cliente.ultima_visita
                        ? formatearFecha(cliente.ultima_visita)
                        : 'Sin visitas'
                    }
                  />
                  <MetricCard
                    icon={<ShoppingBag size={16} className="text-purple-500" />}
                    label="Total pedidos"
                    value={`${cliente.total_pedidos}`}
                  />
                  <MetricCard
                    icon={<Banknote size={16} className="text-green-600" />}
                    label="Total gastado"
                    value={formatGuaranies(cliente.total_gastado)}
                  />
                </div>

                {/* Días sin visita badge */}
                {(() => {
                  const d = diasLabel(cliente.dias_sin_visita)
                  return (
                    <div className={`mt-3 text-sm font-semibold ${d.color}`}>
                      {d.text}
                    </div>
                  )
                })()}
              </section>

              {/* Regalar puntos */}
              <section className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Regalar puntos
                  </h3>
                  {!mostrarRegalo && (
                    <button
                      onClick={() => setMostrarRegalo(true)}
                      className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      <Gift size={15} />
                      Regalar
                    </button>
                  )}
                </div>

                {mostrarRegalo && (
                  <div className="bg-orange-50 rounded-xl p-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">
                        Puntos a regalar
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={puntosInput}
                        onChange={(e) => setPuntosInput(e.target.value)}
                        placeholder="Ej: 50"
                        className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        disabled={regalando}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">
                        Motivo (opcional)
                      </label>
                      <input
                        type="text"
                        value={motivoInput}
                        onChange={(e) => setMotivoInput(e.target.value)}
                        placeholder="Ej: Cumpleaños, bienvenida..."
                        className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        disabled={regalando}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMostrarRegalo(false)}
                        disabled={regalando}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleRegalar}
                        disabled={regalando || !puntosInput}
                        className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {regalando ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Gift size={15} />
                        )}
                        Acreditar
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Historial de puntos */}
              <section className="px-6 py-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Últimas transacciones de puntos
                </h3>
                {loadingHistorial ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : historial.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Sin transacciones registradas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {historial.map((t) => {
                      const meta = TIPO_TRANSACCION[t.tipo] ?? TIPO_TRANSACCION.ajuste
                      const positivo = t.puntos > 0
                      return (
                        <div
                          key={t.id}
                          className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">
                              {t.descripcion || meta.label}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(t.created_at).toLocaleDateString('es-PY', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                              })}
                              {' · '}Saldo: {t.saldo_nuevo.toLocaleString()} pts
                            </p>
                          </div>
                          <span
                            className={`ml-3 text-sm font-bold flex-shrink-0 ${
                              positivo ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {positivo ? '+' : ''}{t.puntos.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { onEdit(cliente); onClose() }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                <Edit2 size={16} />
                Editar cliente
                <ChevronRight size={16} className="ml-auto" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <span className="text-gray-500 font-medium min-w-[70px] flex-shrink-0">{label}:</span>
      <span className="text-gray-800 break-all">{value}</span>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  big,
}: {
  icon: React.ReactNode
  label: string
  value: string
  big?: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-bold text-gray-800 ${big ? 'text-base' : 'text-sm'} break-all`}>
          {value}
        </p>
      </div>
    </div>
  )
}
