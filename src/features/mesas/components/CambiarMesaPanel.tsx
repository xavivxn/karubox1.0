'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRightLeft, Loader2, RefreshCw, Users } from 'lucide-react'
import type { Mesa } from '../types/mesas.types'
import { mensajeErrorCambioMesa, mesasDestinoDisponibles } from '../services/cambiarMesa'

export interface CambiarMesaPanelProps {
  mesaOrigen: Mesa
  /** Total de la cuenta abierta (solo para el texto de confirmación). */
  totalCuenta?: number | null
  /** Trae las mesas al abrir el panel: el estado "libre" tiene que estar fresco. */
  cargarMesas: () => Promise<Mesa[]>
  mesasEnUnion?: ReadonlySet<string>
  onConfirmar: (destino: Mesa) => Promise<void>
  onCancelar: () => void
}

const formatGs = (n: number) => `Gs. ${Math.round(n).toLocaleString('es-PY')}`

export function CambiarMesaPanel({
  mesaOrigen,
  totalCuenta,
  cargarMesas,
  mesasEnUnion,
  onConfirmar,
  onCancelar,
}: CambiarMesaPanelProps) {
  const [mesas, setMesas] = useState<Mesa[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [destinoId, setDestinoId] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const enviandoRef = useRef(false)
  const montadoRef = useRef(true)

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const data = await cargarMesas()
      if (!montadoRef.current) return
      setMesas(data)
    } catch (e) {
      if (!montadoRef.current) return
      setErrorCarga(mensajeErrorCambioMesa(e) || 'No se pudieron cargar las mesas.')
    } finally {
      if (montadoRef.current) setCargando(false)
    }
  }, [cargarMesas])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const disponibles = useMemo(
    () => (mesas ? mesasDestinoDisponibles(mesas, mesaOrigen.id, { mesasEnUnion }) : []),
    [mesas, mesaOrigen.id, mesasEnUnion]
  )

  // Si la mesa elegida dejó de estar libre (recarga), se deselecciona.
  useEffect(() => {
    if (destinoId && !disponibles.some((m) => m.id === destinoId)) setDestinoId(null)
  }, [disponibles, destinoId])

  const destino = disponibles.find((m) => m.id === destinoId) ?? null

  const confirmar = async () => {
    if (!destino || enviandoRef.current) return
    enviandoRef.current = true
    setEnviando(true)
    setErrorEnvio(null)
    try {
      await onConfirmar(destino)
    } catch (e) {
      if (montadoRef.current) {
        setErrorEnvio(mensajeErrorCambioMesa(e))
        // Lo más común es que otra persona ocupó la mesa: refrescamos la lista.
        void cargar()
      }
    } finally {
      enviandoRef.current = false
      if (montadoRef.current) setEnviando(false)
    }
  }

  return (
    <section
      aria-label="Cambiar mesa"
      className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-3 dark:border-amber-800/60 dark:bg-amber-900/20"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold inline-flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
          <ArrowRightLeft className="w-4 h-4" />
          Mover la cuenta de la mesa #{mesaOrigen.numero} a…
        </h3>
        <button
          type="button"
          onClick={() => void cargar()}
          disabled={cargando || enviando}
          aria-label="Actualizar mesas libres"
          className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-100 disabled:opacity-40 dark:text-amber-200 dark:hover:bg-amber-900/40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {cargando && !mesas && (
        <p className="text-xs text-gray-500 inline-flex items-center gap-1.5" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando mesas libres…
        </p>
      )}

      {errorCarga && (
        <div role="alert" className="text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
          <span>{errorCarga}</span>
          <button type="button" onClick={() => void cargar()} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {mesas && !errorCarga && disponibles.length === 0 && (
        <p className="text-xs text-gray-600 dark:text-gray-300">
          No hay mesas libres en este momento. Liberá una mesa y tocá actualizar.
        </p>
      )}

      {disponibles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2" role="radiogroup" aria-label="Mesa destino">
          {disponibles.map((m) => {
            const activa = m.id === destinoId
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={activa}
                disabled={enviando}
                onClick={() => {
                  setDestinoId(m.id)
                  setErrorEnvio(null)
                }}
                className={`rounded-lg border px-2 py-2 text-left transition disabled:opacity-50 ${
                  activa
                    ? 'border-amber-500 bg-amber-500 text-white shadow'
                    : 'border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-gray-900 dark:text-emerald-200'
                }`}
              >
                <span className="block text-sm font-black leading-tight">Mesa #{m.numero}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] opacity-80">
                  <Users className="w-3 h-3" /> {m.capacidad}
                  {m.nombre ? ` · ${m.nombre}` : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {destino && (
        <p className="text-xs text-gray-700 dark:text-gray-200">
          Se mueven todos los pedidos abiertos de la mesa #{mesaOrigen.numero}
          {typeof totalCuenta === 'number' && totalCuenta > 0 ? ` (${formatGs(totalCuenta)})` : ''} a la mesa #
          {destino.numero}. La mesa #{mesaOrigen.numero} queda libre. No se reimprime nada en cocina.
        </p>
      )}

      {errorEnvio && (
        <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">
          {errorEnvio}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void confirmar()}
          disabled={!destino || enviando}
          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
          {enviando ? 'Moviendo…' : destino ? `Mover a mesa #${destino.numero}` : 'Elegí una mesa'}
        </button>
      </div>
    </section>
  )
}
