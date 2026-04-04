'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Droplets, Loader2, Minus, Plus, Search, X } from 'lucide-react'
import { formatGuaranies } from '@/lib/utils/format'
import { posService } from '../services/posService'
import { getCachedCatalog, setCachedSalsas } from '../lib/catalogCache'
import type { SauceProduct } from '../types/pos.types'

const MAX_QTY = 20

interface SaucesDrawerProps {
  open: boolean
  onClose: () => void
  tenantId: string
  darkMode?: boolean
  initialQuantities: Record<string, number>
  onConfirm: (nextQuantities: Record<string, number>, saucesById: Record<string, SauceProduct>) => void
}

export function SaucesDrawer({
  open,
  onClose,
  tenantId,
  darkMode,
  initialQuantities,
  onConfirm,
}: SaucesDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sauces, setSauces] = useState<SauceProduct[]>([])
  const [qtyById, setQtyById] = useState<Record<string, number>>({})

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    setQtyById(initialQuantities ?? {})
  }, [open, initialQuantities])

  /** Antes del paint: caché caliente = lista lista sin parpadeo ni “vacío” un frame */
  useLayoutEffect(() => {
    if (!open) return
    const entry = getCachedCatalog(tenantId)
    const hasCached = Boolean(entry && Array.isArray(entry.salsas))
    if (hasCached && entry) {
      setSauces(entry.salsas)
      setLoading(false)
      setErrorMessage(null)
    } else {
      setLoading(true)
      setErrorMessage(null)
    }
  }, [open, tenantId])

  useEffect(() => {
    if (!open) return

    let active = true
    const entry = getCachedCatalog(tenantId)
    const hasCached = Boolean(entry && Array.isArray(entry.salsas))

    void posService
      .loadSauceProducts(tenantId)
      .then((list) => {
        if (!active) return
        setSauces(list)
        setErrorMessage(null)
        if (getCachedCatalog(tenantId)) {
          setCachedSalsas(tenantId, list)
        }
      })
      .catch((err: unknown) => {
        console.error('Error cargando salsas', err)
        if (!active) return
        if (!hasCached) {
          setSauces([])
          setErrorMessage(err instanceof Error ? err.message : 'No se pudieron cargar las salsas.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, tenantId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sauces
    return sauces.filter((s) => (s.nombre ?? '').toLowerCase().includes(q))
  }, [sauces, search])

  const saucesById = useMemo(() => {
    const map: Record<string, SauceProduct> = {}
    sauces.forEach((s) => {
      map[s.id] = s
    })
    return map
  }, [sauces])

  const totalSelected = useMemo(() => {
    return Object.values(qtyById).reduce((sum, v) => sum + (v || 0), 0)
  }, [qtyById])

  const changeQty = (id: string, delta: number) => {
    setQtyById((prev) => {
      const current = prev[id] ?? 0
      const next = Math.max(0, Math.min(MAX_QTY, current + delta))
      return { ...prev, [id]: next }
    })
  }

  const handleConfirm = () => {
    // limpiar ceros para no ensuciar estado
    const next: Record<string, number> = {}
    for (const [id, v] of Object.entries(qtyById)) {
      const n = Math.max(0, Math.floor(v || 0))
      if (n > 0) next[id] = n
    }
    onConfirm(next, saucesById)
    onClose()
  }

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[130]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Droplets className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">Salsas</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                Elegí cuántos vasitos agregar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar salsa…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando salsas…
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-700/40 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-200">
              {errorMessage}
            </div>
          ) : filtered.length === 0 ? (
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No hay salsas disponibles (categoría “Salsas” vacía o inexistente).
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => {
                const qty = qtyById[s.id] ?? 0
                const priceLabel = s.precio > 0 ? formatGuaranies(s.precio) : 'Gratis'
                return (
                  <div
                    key={s.id}
                    className={`rounded-2xl border p-3 flex items-center gap-3 ${
                      darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {s.nombre}
                      </div>
                      <div className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {priceLabel}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => changeQty(s.id, -1)}
                        disabled={qty <= 0}
                        className={`p-2 rounded-xl transition ${
                          qty <= 0
                            ? darkMode
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-white text-gray-300 cursor-not-allowed'
                            : darkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-white'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                        aria-label="Quitar vasito"
                      >
                        <Minus size={14} />
                      </button>
                      <span className={`w-8 text-center font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQty(s.id, +1)}
                        className="p-2 rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
                        aria-label="Agregar vasito"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          className="p-5 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Seleccionadas: <span className="font-bold">{totalSelected}</span>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition"
          >
            Aplicar
          </button>
        </div>
      </aside>
    </div>,
    document.body
  )
}
