/**
 * Mini modal con detalle de una materia prima / fila de inventario
 */

'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Package, X } from 'lucide-react'
import { calculateStockProgress } from '../utils/admin.utils'
import type { InventoryRecord } from '../types/admin.types'

function displayName(item: InventoryRecord): string {
  return item.nombre ?? item.productos?.nombre ?? 'Insumo sin nombre'
}

function isCritical(item: InventoryRecord): boolean {
  const progress = calculateStockProgress(item.stock_actual, item.stock_minimo)
  return item.stock_actual <= item.stock_minimo || progress < 30
}

interface InventoryItemDetailModalProps {
  open: boolean
  item: InventoryRecord | null
  onClose: () => void
  /** Modo listado aleatorio (sin foco en alertas): sin iconos ni textos de “crítico” */
  deemphasizeCritical?: boolean
}

export function InventoryItemDetailModal({
  open,
  item,
  onClose,
  deemphasizeCritical = false,
}: InventoryItemDetailModalProps) {
  const [mounted, setMounted] = useState(false)
  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !mounted || !item) return null

  const progress = calculateStockProgress(item.stock_actual, item.stock_minimo)
  const rawCritical = isCritical(item)
  const showAlarm = rawCritical && !deemphasizeCritical
  const name = displayName(item)
  const showNombreInventario =
    Boolean(item.nombre_inventario) && item.nombre_inventario !== name

  let estadoLabel = 'En buen nivel'
  if (deemphasizeCritical) {
    estadoLabel = progress >= 50 ? 'En buen nivel' : 'Nivel moderado'
  } else if (rawCritical) {
    estadoLabel = item.stock_actual <= item.stock_minimo ? 'Crítico (≤ mínimo)' : 'Crítico (nivel bajo)'
  } else if (progress < 50) {
    estadoLabel = 'Atención'
  }

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="inv-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              showAlarm
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
            }`}
          >
            {showAlarm ? <AlertTriangle className="h-5 w-5" aria-hidden /> : <Package className="h-5 w-5" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Materia prima</p>
            <h2 id="inv-detail-title" className="text-lg font-bold leading-snug text-gray-900 dark:text-white">
              {name}
            </h2>
            {item.producto_categoria && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.producto_categoria}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4">
          {showAlarm && (
            <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
              Este insumo requiere atención: stock bajo respecto al mínimo o al nivel configurado.
            </p>
          )}

          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
            <DetailRow label="Stock actual" value={`${item.stock_actual.toLocaleString()} ${item.unidad}`} emphasize />
            <DetailRow label="Stock mínimo" value={`${item.stock_minimo.toLocaleString()} ${item.unidad}`} />
            <DetailRow label="Nivel estimado" value={`${progress.toFixed(0)}%`} />
            <DetailRow label="Estado" value={estadoLabel} />
            <DetailRow
              label="Control"
              value={item.controlar_stock ? 'Automático (descuenta con ventas)' : 'Manual'}
            />
            {showNombreInventario && (
              <DetailRow label="Nombre en inventario" value={item.nombre_inventario ?? '—'} />
            )}
            <DetailRow label="ID" value={item.id} mono />
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Nivel visual</p>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full ${
                  deemphasizeCritical
                    ? 'bg-gradient-to-r from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500'
                    : progress < 30
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-orange-600 dark:hover:bg-orange-500"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function DetailRow({
  label,
  value,
  emphasize,
  mono,
}: {
  label: string
  value: string
  emphasize?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
      <span className="shrink-0 text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-right ${emphasize ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'} ${mono ? 'font-mono text-xs break-all' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
