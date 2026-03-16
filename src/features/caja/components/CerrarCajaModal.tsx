'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Wallet, CheckCircle2, FileDown, Plus, Trash2 } from 'lucide-react'
import { formatGuaranies, formatNumber } from '@/lib/utils/format'
import { getTotalesTurnoAction, cerrarCajaAction } from '@/app/actions/caja'
import { generarPdfCierreCaja } from '../utils/generarPdfCierreCaja'
import type { GastoExtra, SesionCaja } from '../types/caja.types'

interface CerrarCajaModalProps {
  open: boolean
  onClose: () => void
  sesion: SesionCaja
  tenantId: string
  tenantNombre?: string
  onCerrarExitoso: () => void
  darkMode?: boolean
}

export function CerrarCajaModal({
  open,
  onClose,
  sesion,
  tenantId,
  tenantNombre,
  onCerrarExitoso,
  darkMode = false
}: CerrarCajaModalProps) {
  const [totales, setTotales] = useState<{
    total_ventas: number
    total_costo_estimado: number
    cantidad_pedidos: number
  } | null>(null)
  const [loadingTotales, setLoadingTotales] = useState(false)
  const [montoPagado, setMontoPagado] = useState<string>('0')
  const [gastosExtraEnabled, setGastosExtraEnabled] = useState(false)
  const [gastosExtra, setGastosExtra] = useState<{ descripcion: string; monto: string }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Cuando está seteada, mostramos la vista de cierre exitoso con opción de descargar PDF */
  const [sesionCerrada, setSesionCerrada] = useState<SesionCaja | null>(null)

  useEffect(() => {
    if (!open) {
      setSesionCerrada(null)
      return
    }
    if (!sesion?.apertura_at) return
    setError(null)
    setMontoPagado('0')
    setGastosExtraEnabled(false)
    setGastosExtra([])
    setLoadingTotales(true)
    getTotalesTurnoAction(tenantId, sesion.apertura_at).then((result) => {
      setLoadingTotales(false)
      if (result.success) setTotales(result.data)
      else setError(result.error)
    })
  }, [open, tenantId, sesion?.apertura_at])

  const montoNum = parseFloat(String(montoPagado).replace(/\D/g, '')) || 0
  const gastosExtraSum = gastosExtra.reduce(
    (sum, g) => sum + (parseFloat(String(g.monto).replace(/\D/g, '')) || 0),
    0
  )
  const gananciaNeta = totales
    ? totales.total_ventas - totales.total_costo_estimado - montoNum - gastosExtraSum
    : 0

  const handleAddGastoExtra = () => {
    if (!gastosExtraEnabled) {
      setGastosExtraEnabled(true)
      setGastosExtra([{ descripcion: '', monto: '' }])
    } else {
      setGastosExtra((prev) => [...prev, { descripcion: '', monto: '' }])
    }
  }

  const handleRemoveGastoExtra = (index: number) => {
    setGastosExtra((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) setGastosExtraEnabled(false)
      return next
    })
  }

  const handleGastoChange = (index: number, field: 'descripcion' | 'monto', value: string) => {
    setGastosExtra((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    )
  }

  const handleConfirmar = async () => {
    setIsSaving(true)
    setError(null)
    const gastos: GastoExtra[] = gastosExtra
      .filter((g) => (g.descripcion || '').trim() || (parseFloat(String(g.monto).replace(/\D/g, '')) || 0) > 0)
      .map((g) => ({
        descripcion: (g.descripcion || '').trim() || 'Gasto extra',
        monto: parseFloat(String(g.monto).replace(/\D/g, '')) || 0
      }))
      .filter((g) => g.monto > 0)
    const result = await cerrarCajaAction(sesion.id, montoNum, gastos)
    setIsSaving(false)
    if (result.success) {
      setSesionCerrada(result.data)
    } else {
      setError(result.error)
    }
  }

  const handleCerrarYSalir = () => {
    setSesionCerrada(null)
    onCerrarExitoso()
    onClose()
  }

  const handleDescargarPdf = () => {
    if (sesionCerrada) generarPdfCierreCaja(sesionCerrada, { tenantNombre })
  }

  if (!open) return null

  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const bg = darkMode ? 'bg-gray-900' : 'bg-white'
  const text = darkMode ? 'text-gray-100' : 'text-gray-900'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inputClass = `w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'} px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50`

  /** Confirmar cierre solo si se proporcionó monto pagado a empleados (puede ser 0) */
  const montoPagadoProporcionado = montoPagado !== ''

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={sesionCerrada ? 'cerrar-caja-success-title' : 'cerrar-caja-title'}
    >
      {/* Overlay a pantalla completa para que el blur cubra todo (header incluido) */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={sesionCerrada ? handleCerrarYSalir : () => !isSaving && onClose()}
        aria-hidden="true"
      />
  {sesionCerrada ? (
        <div className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border ${border} ${bg} shadow-xl`}>
          <div className={`flex items-center justify-between border-b ${border} px-5 py-4`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 id="cerrar-caja-success-title" className={`text-lg font-bold ${text}`}>
                  Cierre registrado
                </h2>
                <p className={`text-xs ${textMuted}`}>
                  Podés descargar el reporte en PDF o cerrar.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCerrarYSalir}
              className={`rounded-lg p-2 ${textMuted} hover:bg-gray-100 dark:hover:bg-gray-800 transition`}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl border ${border} p-3`}>
                <p className={`text-xs uppercase ${textMuted}`}>Total ventas</p>
                <p className={`text-lg font-bold ${text}`}>{formatGuaranies(sesionCerrada.total_ventas)}</p>
              </div>
              <div className={`rounded-xl border ${border} p-3`}>
                <p className={`text-xs uppercase ${textMuted}`}>Costo estimado</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {formatGuaranies(sesionCerrada.total_costo_estimado)}
                </p>
              </div>
              <div className={`rounded-xl border ${border} p-3`}>
                <p className={`text-xs uppercase ${textMuted}`}>Pagado a empleados</p>
                <p className={`text-lg font-bold ${text}`}>{formatGuaranies(sesionCerrada.monto_pagado_empleados)}</p>
              </div>
              <div className={`rounded-xl border ${border} p-3`}>
                <p className={`text-xs uppercase ${textMuted}`}>Ganancia neta</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatGuaranies(sesionCerrada.ganancia_neta)}
                </p>
              </div>
            </div>
            {sesionCerrada.gastos_extra && sesionCerrada.gastos_extra.length > 0 && (
              <div className={`rounded-xl border ${border} p-3 space-y-2`}>
                <p className={`text-xs uppercase ${textMuted}`}>Gastos extra</p>
                <ul className="space-y-1 text-sm">
                  {sesionCerrada.gastos_extra.map((g, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className={text}>{g.descripcion || 'Gasto extra'}</span>
                      <span className={`font-medium ${text}`}>{formatGuaranies(g.monto)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className={`text-sm ${textMuted}`}>
              {sesionCerrada.cantidad_pedidos} pedido{sesionCerrada.cantidad_pedidos !== 1 ? 's' : ''} en el turno
            </p>
          </div>

          <div className={`flex flex-col gap-2 border-t ${border} px-5 py-4`}>
            <button
              type="button"
              onClick={handleDescargarPdf}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/30 px-4 py-2.5 text-sm font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition"
            >
              <FileDown className="h-4 w-4" />
              Descargar reporte PDF
            </button>
            <button
              type="button"
              onClick={handleCerrarYSalir}
              className={`rounded-xl border ${border} px-4 py-2.5 text-sm font-semibold ${text} hover:bg-gray-100 dark:hover:bg-gray-800 transition`}
            >
              Cerrar
            </button>
          </div>
        </div>
  ) : (
      <div className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border ${border} ${bg} shadow-xl`}>
        <div className={`flex items-center justify-between border-b ${border} px-5 py-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 id="cerrar-caja-title" className={`text-lg font-bold ${text}`}>
                Cerrar caja
              </h2>
              <p className={`text-xs ${textMuted}`}>
                Resumen del turno y monto pagado a empleados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`rounded-lg p-2 ${textMuted} hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {loadingTotales ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : totales ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl border ${border} p-3`}>
                  <p className={`text-xs uppercase ${textMuted}`}>Total ventas</p>
                  <p className={`text-lg font-bold ${text}`}>
                    {formatGuaranies(totales.total_ventas)}
                  </p>
                </div>
                <div className={`rounded-xl border ${border} p-3`}>
                  <p className={`text-xs uppercase ${textMuted}`}>Costo estimado</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {formatGuaranies(totales.total_costo_estimado)}
                  </p>
                </div>
              </div>
              <p className={`text-sm ${textMuted}`}>
                {totales.cantidad_pedidos} pedido{totales.cantidad_pedidos !== 1 ? 's' : ''} en el turno
              </p>

                <div>
                  <label htmlFor="monto-pagado" className={`mb-1.5 block text-sm font-medium ${text}`}>
                    Monto pagado a empleados (hoy) <span className="text-orange-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} px-3 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20`}>
                    <span className={`text-sm font-medium ${textMuted}`}>Gs.</span>
                    <input
                      id="monto-pagado"
                      type="text"
                      inputMode="numeric"
                      value={montoPagado === '' ? '' : formatNumber(montoPagado)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '')
                        setMontoPagado(digits)
                      }}
                      placeholder="0"
                      disabled={isSaving}
                      className={`flex-1 min-w-0 border-0 bg-transparent py-2.5 text-sm ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'} focus:outline-none focus:ring-0 disabled:opacity-50`}
                    />
                  </div>
                  {!montoPagadoProporcionado && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Indicá el monto pagado a empleados (puede ser 0) para confirmar el cierre.
                    </p>
                  )}
                </div>

                {/* Gastos extra (opcional): deshabilitado por defecto, se habilita con "+" */}
                <div className={`rounded-xl border ${border} overflow-hidden ${!gastosExtraEnabled ? 'opacity-75' : ''}`}>
                  <div
                    className={`flex items-center justify-between px-3 py-2.5 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                  >
                    <span className={`text-sm font-medium ${textMuted}`}>
                      Gastos extra (opcional)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddGastoExtra}
                      className={`flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${darkMode ? 'text-orange-400 hover:bg-orange-900/40' : 'text-orange-600 hover:bg-orange-100'}`}
                      aria-label="Agregar gasto extra"
                    >
                      <Plus className="h-4 w-4" />
                      {gastosExtraEnabled ? 'Otro' : 'Agregar'}
                    </button>
                  </div>
                  {gastosExtraEnabled && gastosExtra.length > 0 && (
                    <div className="space-y-2 p-3 border-t border-gray-200 dark:border-gray-600">
                      {gastosExtra.map((g, index) => (
                        <div
                          key={index}
                          className={`flex flex-col sm:flex-row gap-2 rounded-lg border ${border} p-2.5 ${darkMode ? 'bg-gray-800/30' : 'bg-white'}`}
                        >
                          <input
                            type="text"
                            value={g.descripcion}
                            onChange={(e) => handleGastoChange(index, 'descripcion', e.target.value)}
                            placeholder="Descripción del gasto"
                            disabled={isSaving}
                            className={`flex-1 min-w-0 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400'} px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20 disabled:opacity-50`}
                          />
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`flex items-center gap-1.5 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'} px-2 py-2 min-w-[100px] focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/20`}>
                              <span className={`text-xs ${textMuted}`}>Gs.</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={g.monto === '' ? '' : formatNumber(g.monto)}
                                onChange={(e) => handleGastoChange(index, 'monto', e.target.value.replace(/\D/g, ''))}
                                placeholder="0"
                                disabled={isSaving}
                                className={`w-full min-w-0 border-0 bg-transparent py-0.5 text-sm ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'} focus:outline-none focus:ring-0 disabled:opacity-50`}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGastoExtra(index)}
                              disabled={isSaving}
                              className={`p-2 rounded-lg transition ${textMuted} hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50`}
                              aria-label="Quitar gasto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {gastosExtraSum > 0 && (
                        <p className={`text-xs ${textMuted}`}>
                          Total gastos extra: {formatGuaranies(gastosExtraSum)} (se restan de la ganancia neta)
                        </p>
                      )}
                    </div>
                  )}
                </div>

              <div className={`rounded-xl border-2 ${darkMode ? 'border-emerald-800 bg-emerald-950/30' : 'border-emerald-200 bg-emerald-50'} p-4`}>
                <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                  Ganancia neta
                </p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatGuaranies(gananciaNeta)}
                </p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                  Ventas − costo − pagado empleados{gastosExtraSum > 0 ? ' − gastos extra' : ''}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <div className={`flex gap-3 border-t ${border} px-5 py-4`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`flex-1 rounded-xl border ${border} px-4 py-2.5 text-sm font-semibold ${text} hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isSaving || loadingTotales || !montoPagadoProporcionado}
            className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cerrando…
              </>
            ) : (
              'Confirmar cierre'
            )}
          </button>
        </div>
      </div>
    )}
    </div>
  )

  return createPortal(modalContent, document.body)
}
