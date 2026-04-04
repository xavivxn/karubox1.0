/**
 * Admin Module - Inventory Grid Section
 * Insumos controlados: búsqueda, filtros Crítico | Auto, paginación y vista compacta en móvil.
 * Si hay ítems críticos se lista con foco en críticos; si no hay, se muestran todas las materias primas en orden aleatorio (hasta que cambie el inventario).
 * Filtro Auto: orden alfabético (no se priorizan críticos arriba).
 */

'use client'

import { useMemo, useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { calculateStockProgress } from '../utils/admin.utils'
import type { InventoryRecord } from '../types/admin.types'
import { InventoryItemDetailModal } from './InventoryItemDetailModal'

export type InventoryFilter = 'critical' | 'auto'

interface InventoryGridProps {
  inventory: InventoryRecord[]
  /** Total de ítems (mismo que inventario.length si viene del mismo fetch) */
  totalInventoryItems?: number
  /** Cantidad en alerta (stock <= mínimo), alineado con KPI / alertas */
  lowStockCount?: number
  onOpenIngredienteModal: () => void
  onOpenStockDrawer: () => void
  onOpenProductModal?: () => void
}

const DEFAULT_PAGE_SIZE = 12

function displayName(item: InventoryRecord): string {
  return item.nombre ?? item.productos?.nombre ?? 'Insumo sin nombre'
}

function isCritical(item: InventoryRecord): boolean {
  const progress = calculateStockProgress(item.stock_actual, item.stock_minimo)
  return item.stock_actual <= item.stock_minimo || progress < 30
}

/** Ratio actual/mínimo (mayor = más holgura). Mínimo 1 para evitar división por cero. */
function stockRatio(item: InventoryRecord): number {
  const min = Math.max(item.stock_minimo || 0, 1)
  return item.stock_actual / min
}

/** Críticos primero (peor ratio dentro de críticos); luego estables (más holgura primero). */
function sortByCriticalityThenStable(items: InventoryRecord[]): InventoryRecord[] {
  return [...items].sort((a, b) => {
    const ca = isCritical(a)
    const cb = isCritical(b)
    if (ca !== cb) return ca ? -1 : 1
    const ra = stockRatio(a)
    const rb = stockRatio(b)
    if (ca) return ra - rb
    const byRatio = rb - ra
    if (byRatio !== 0) return byRatio
    return displayName(a).localeCompare(displayName(b), 'es')
  })
}

/** Filtro Auto: sin priorizar críticos — orden alfabético para revisar todo el control automático. */
function sortByNameAsc(items: InventoryRecord[]): InventoryRecord[] {
  return [...items].sort((a, b) => displayName(a).localeCompare(displayName(b), 'es'))
}

const rowCriticalClass =
  'border-l-[3px] border-l-amber-500 bg-amber-50/95 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-950/40 dark:border-l-amber-400 dark:ring-amber-800/50'
const cardCriticalClass =
  'border-amber-400/90 shadow-md shadow-amber-500/15 bg-amber-50/95 dark:bg-amber-950/45 dark:border-amber-600/70'

/** Orden aleatorio estable de índices (Fisher–Yates). */
function shuffleIndices(length: number): number[] {
  const idx = Array.from({ length }, (_, i) => i)
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

export const InventoryGrid = ({
  inventory,
  totalInventoryItems,
  lowStockCount,
  onOpenIngredienteModal,
  onOpenStockDrawer,
  onOpenProductModal,
}: InventoryGridProps) => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<InventoryFilter>('critical')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [detailItem, setDetailItem] = useState<InventoryRecord | null>(null)

  const totalLabel = totalInventoryItems ?? inventory.length
  const alertLabel = lowStockCount ?? inventory.filter((i) => i.stock_actual <= i.stock_minimo).length

  const hasCritical = useMemo(() => inventory.some(isCritical), [inventory])
  /** Lista aleatoria (sin críticos a nivel global): no resaltar ni priorizar estados críticos en UI */
  const randomBrowseMode = !hasCritical

  const inventoryKey = useMemo(
    () =>
      [...inventory]
        .map((i) => String(i.id))
        .sort((a, b) => a.localeCompare(b))
        .join('|'),
    [inventory]
  )

  /** Sin críticos: recorrer el inventario en orden aleatorio hasta que cambie el set de ítems. */
  const shuffleOrder = useMemo(() => {
    if (hasCritical) return null
    return shuffleIndices(inventory.length)
  }, [hasCritical, inventoryKey, inventory.length])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    const passes = (item: InventoryRecord) => {
      const name = displayName(item).toLowerCase()
      if (q && !name.includes(q)) return false
      if (filter === 'auto' && !item.controlar_stock) return false
      if (filter === 'critical' && hasCritical && !isCritical(item)) return false
      return true
    }

    if (!hasCritical && shuffleOrder) {
      const out: InventoryRecord[] = []
      for (const i of shuffleOrder) {
        const item = inventory[i]
        if (item && passes(item)) out.push(item)
      }
      return out
    }

    const list = inventory.filter(passes)
    if (filter === 'auto') {
      return sortByNameAsc(list)
    }
    return sortByCriticalityThenStable(list)
  }, [inventory, search, filter, hasCritical, shuffleOrder])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, filter, pageSize])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const rangeFrom = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeTo = Math.min(safePage * pageSize, filtered.length)

  const filterChip = (id: InventoryFilter, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        filter === id
          ? 'bg-orange-500 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <section className="rounded-3xl border border-white/60 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-4 sm:p-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500">
            Inventario detallado
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="text-2xl font-bold">Insumos controlados</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalLabel} insumos
              {alertLabel > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">
                  {' '}
                  · {alertLabel} en alerta (≤ mín.)
                </span>
              ) : (
                <span> · sin alertas de mínimo</span>
              )}
            </p>
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {onOpenProductModal && (
            <button
              type="button"
              onClick={onOpenProductModal}
              className="shrink-0 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:border-orange-400 transition"
            >
              Gestionar productos
            </button>
          )}
          <button
            type="button"
            onClick={onOpenStockDrawer}
            className="shrink-0 rounded-2xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition"
          >
            Cargar stock
          </button>
          <button
            type="button"
            onClick={onOpenIngredienteModal}
            className="shrink-0 rounded-2xl border border-orange-500 text-orange-500 dark:border-orange-400 dark:text-orange-400 px-4 py-2 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-500/10 transition"
          >
            Registrar materia prima
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-900/80 dark:text-white"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filterChip('critical', 'Crítico')}
            {filterChip('auto', 'Auto')}
          </div>
        </div>
        {!hasCritical && filter === 'critical' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No hay insumos críticos ahora; se muestran todas las materias primas en orden aleatorio.
          </p>
        )}
      </div>

      {/* Vista compacta: móvil */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {paginated.map((item) => {
          const progress = calculateStockProgress(item.stock_actual, item.stock_minimo)
          const showCriticalVisual = !randomBrowseMode && isCritical(item)
          const barLow = !randomBrowseMode && progress < 30
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setDetailItem(item)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                showCriticalVisual ? rowCriticalClass : 'bg-white/40 dark:bg-gray-900/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {showCriticalVisual && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-600/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      Crítico
                    </span>
                  )}
                  <p className="font-medium text-sm leading-tight truncate">{displayName(item)}</p>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Min {item.stock_minimo} {item.unidad} ·{' '}
                  <span className={barLow ? 'text-orange-600 dark:text-orange-400' : ''}>
                    {progress.toFixed(0)}%
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-bold tabular-nums">
                  {item.stock_actual.toLocaleString()} {item.unidad}
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    item.controlar_stock
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                  }`}
                >
                  {item.controlar_stock ? 'Auto' : 'Manual'}
                </span>
              </div>
              <div className="w-14 shrink-0">
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      randomBrowseMode
                        ? 'bg-gradient-to-r from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500'
                        : progress < 30
                          ? 'bg-gradient-to-r from-red-500 to-orange-500'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </button>
          )
        })}
        {!filtered.length && (
          <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {inventory.length === 0
              ? 'Aún no tenés insumos cargados. Usá «Registrar materia prima» y «Cargar stock».'
              : 'Ningún insumo coincide con la búsqueda o el filtro.'}
          </div>
        )}
      </div>

      {/* Vista tarjetas: tablet+ */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {paginated.map((item) => {
          const progress = calculateStockProgress(item.stock_actual, item.stock_minimo)
          const showCriticalVisual = !randomBrowseMode && isCritical(item)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setDetailItem(item)}
              className={`rounded-2xl border p-3 sm:p-4 text-left transition hover:brightness-[1.02] dark:hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                showCriticalVisual
                  ? cardCriticalClass
                  : 'border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {showCriticalVisual && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        Crítico
                      </span>
                    )}
                    <p className="font-semibold truncate">{displayName(item)}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Min {item.stock_minimo} {item.unidad}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${
                    item.controlar_stock
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                  }`}
                >
                  {item.controlar_stock ? 'Auto' : 'Manual'}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-bold tabular-nums">
                    {item.stock_actual.toLocaleString()} {item.unidad}
                  </span>
                  <span className="text-gray-500">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      randomBrowseMode
                        ? 'bg-gradient-to-r from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500'
                        : progress < 30
                          ? 'bg-gradient-to-r from-red-500 to-orange-500'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </button>
          )
        })}
        {!filtered.length && (
          <div className="col-span-full text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
            {inventory.length === 0
              ? 'Aún no tenés insumos cargados. Usá «Registrar materia prima» para el primero y «Cargar stock» para agregar cantidades.'
              : 'Ningún insumo coincide con la búsqueda o el filtro.'}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 dark:border-gray-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400 order-2 sm:order-1">
            Mostrando {rangeFrom}–{rangeTo} de {filtered.length}
            {pageSize !== DEFAULT_PAGE_SIZE && ` · ${pageSize} por página`}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 order-1 sm:order-2 sm:justify-end">
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="hidden sm:inline">Por página</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-900"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[4.5rem] text-center text-xs font-medium text-gray-600 dark:text-gray-300">
                {safePage} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]" aria-hidden />

      <InventoryItemDetailModal
        open={detailItem !== null}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        deemphasizeCritical={randomBrowseMode}
      />
    </section>
  )
}
