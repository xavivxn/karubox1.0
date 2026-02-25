'use client'

import { useEffect, useState, useMemo } from 'react'
import { X, Loader2, Minus, Plus, Check } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { fetchProductRecipe, fetchTenantIngredients } from '@/lib/api/ingredients'
import type { IngredientDefinition, IngredientRequirement } from '@/types/ingredients'
import { formatGuaranies } from '@/lib/utils/format'
import { useTenant } from '@/contexts/TenantContext'

interface ItemCustomizationDrawerProps {
  open: boolean
  itemId: string | null
  onClose: () => void
  darkMode?: boolean
}

const MAX_QUANTITY = 9

export function ItemCustomizationDrawer({ open, itemId, onClose, darkMode }: ItemCustomizationDrawerProps) {
  const { tenant } = useTenant()
  const item = useCartStore((state) => state.items.find((it) => it.id === itemId))
  const updateCustomization = useCartStore((state) => state.updateItemCustomization)

  const [baseRecipe, setBaseRecipe] = useState<IngredientRequirement[]>([])
  const [catalog, setCatalog] = useState<IngredientDefinition[]>([])
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(false)
  /** Por cada slug de la receta: 0 = quitado, 1 = base, 2+ = base + extras (se cobra precio unitario por cada extra) */
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) {
      setQuantities({})
      setNotes('')
    }
  }, [open])

  useEffect(() => {
    if (!open || !tenant) return
    let active = true
    const load = async () => {
      setCatalogLoading(true)
      try {
        const data = await fetchTenantIngredients(tenant.id)
        if (active) setCatalog(data)
      } catch (e) {
        if (active) setCatalog([])
      } finally {
        if (active) setCatalogLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [open, tenant?.id])

  useEffect(() => {
    if (!open || !tenant || !item?.producto_id) {
      setBaseRecipe([])
      return
    }
    let active = true
    const loadRecipe = async () => {
      setRecipeLoading(true)
      try {
        const recipe = await fetchProductRecipe(tenant.id, item.producto_id)
        if (active) setBaseRecipe(recipe)
      } catch (e) {
        if (active) setBaseRecipe([])
      } finally {
        if (active) setRecipeLoading(false)
      }
    }
    loadRecipe()
    return () => { active = false }
  }, [open, tenant?.id, item?.producto_id])

  useEffect(() => {
    if (!open || !item || baseRecipe.length === 0) return
    const cust = item.customization
    const next: Record<string, number> = {}
    baseRecipe.forEach((ing) => {
      const removed = cust?.removedIngredients.some((r) => r.slug === ing.slug)
      if (removed) {
        next[ing.slug] = 0
        return
      }
      const extra = cust?.extras.find((e) => e.slug === ing.slug)
      const extraUnits = extra ? extra.quantityPerItem : 0
      next[ing.slug] = Math.min(MAX_QUANTITY, 1 + extraUnits)
    })
    setQuantities(next)
    setNotes(cust?.notes ?? '')
  }, [open, item, baseRecipe])

  const priceBySlug = useMemo(() => {
    const map: Record<string, number> = {}
    catalog.forEach((ing) => { map[ing.slug] = ing.precio_publico ?? 0 })
    return map
  }, [catalog])

  const extraCostPerUnit = useMemo(() => {
    let sum = 0
    baseRecipe.forEach((ing) => {
      const qty = quantities[ing.slug] ?? 1
      if (qty > 1) {
        const unitPrice = priceBySlug[ing.slug] ?? 0
        sum += (qty - 1) * unitPrice
      }
    })
    return sum
  }, [baseRecipe, quantities, priceBySlug])

  const changeQuantity = (slug: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[slug] ?? 1
      const next = Math.max(0, Math.min(MAX_QUANTITY, current + delta))
      return { ...prev, [slug]: next }
    })
  }

  if (!open || !item) return null

  const handleSave = () => {
    const removedIngredients = baseRecipe
      .filter((ing) => (quantities[ing.slug] ?? 1) === 0)
      .map((ing) => ({ slug: ing.slug, label: ing.label }))

    const extras = baseRecipe
      .filter((ing) => (quantities[ing.slug] ?? 1) > 1)
      .map((ing) => {
        const qty = quantities[ing.slug] ?? 1
        const unitPrice = priceBySlug[ing.slug] ?? 0
        return {
          slug: ing.slug,
          label: ing.label,
          unit: ing.unit,
          quantityPerItem: qty - 1,
          unitPrice
        }
      })

    const resolvedRecipe: IngredientRequirement[] = baseRecipe
      .filter((ing) => (quantities[ing.slug] ?? 1) > 0)
      .map((ing) => {
        const qty = quantities[ing.slug] ?? 1
        return {
          ...ing,
          quantityPerItem: ing.quantityPerItem * qty
        }
      })

    const hasCustomizations =
      removedIngredients.length > 0 || extras.length > 0 || notes.trim().length > 0

    if (!hasCustomizations) {
      updateCustomization(item.id, null, 0)
      onClose()
      return
    }

    updateCustomization(
      item.id,
      {
        removedIngredients,
        extras,
        resolvedRecipe,
        notes: notes.trim() || undefined
      },
      extraCostPerUnit
    )
    onClose()
  }

  const lineTotal = (item.precio + extraCostPerUnit) * item.cantidad
  const isReady = !recipeLoading && !catalogLoading

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative ml-auto h-full w-full max-w-md flex flex-col shadow-2xl ${
          darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            darkMode ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold truncate">{item.nombre}</h2>
            <p className="text-xs text-gray-500">Base {formatGuaranies(item.precio)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full shrink-0 hover:bg-black/10"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500 mb-2">
              Ingredientes — sumar o quitar (+ suma al total)
            </p>
            {recipeLoading ? (
              <div className="flex items-center gap-2 py-4 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
              </div>
            ) : baseRecipe.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Este producto no tiene receta.</p>
            ) : (
              <div className="space-y-2">
                {baseRecipe.map((ing) => {
                  const qty = quantities[ing.slug] ?? 1
                  const unitPrice = priceBySlug[ing.slug] ?? 0
                  const extraCost = qty > 1 ? (qty - 1) * unitPrice : 0
                  return (
                    <div
                      key={ing.slug}
                      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border ${
                        qty > 0
                          ? darkMode
                            ? 'border-green-500/40 bg-green-500/10'
                            : 'border-green-200 bg-green-50'
                          : darkMode
                            ? 'border-gray-700 bg-gray-800/50 opacity-80'
                            : 'border-gray-200 bg-gray-100'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{ing.label}</p>
                        <p className="text-xs text-gray-500">
                          {ing.quantityPerItem}{ing.unit}
                          {unitPrice > 0 && (
                            <span className="ml-1">· +{formatGuaranies(unitPrice)} c/u</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => changeQuantity(ing.slug, -1)}
                          disabled={qty <= 0}
                          className="p-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700"
                          aria-label="Quitar una"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 font-bold tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(ing.slug, 1)}
                          disabled={qty >= MAX_QUANTITY}
                          className="p-2.5 rounded-xl border-2 border-orange-500 bg-orange-500 text-white disabled:opacity-40 disabled:bg-gray-400 disabled:border-gray-400"
                          aria-label="Sumar una"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      {extraCost > 0 && (
                        <p className="text-xs font-semibold text-orange-500 shrink-0">
                          +{formatGuaranies(extraCost)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas (ej: sin cortar)"
              className={`w-full rounded-xl px-3 py-2.5 text-sm border ${
                darkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-orange-500`}
            />
          </div>
        </div>

        <div
          className={`px-4 py-4 border-t ${
            darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
          }`}
        >
          {extraCostPerUnit > 0 && (
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Extras ingredientes</span>
              <span>+{formatGuaranies(extraCostPerUnit)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline mb-3 text-sm">
            <span className="text-gray-500">Total</span>
            <span className="text-xl font-bold text-orange-500">
              {formatGuaranies(lineTotal)}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={!isReady}
            className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {!isReady ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check size={20} />
            )}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
