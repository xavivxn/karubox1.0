'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Droplets, Loader2, Search, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { IngredientDefinition } from '@/types/ingredients'

const SAUCES_CATEGORY_NAME = 'Salsas'

/** Materia prima del envase (50 ml); debe existir por tenant para descontar stock del vasito. */
const VASITO_CONTAINER_SLUG = 'vasito-para-salsa'

function formatGsInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseGsInput(value: string): number {
  const digits = value.replace(/\./g, '').replace(/\D/g, '')
  return parseInt(digits || '0', 10) || 0
}

function toTitleCase(str: string): string {
  return str.replace(/\S+/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

interface SalsasDrawerProps {
  open: boolean
  onClose: () => void
  tenantId: string
  onSaved?: () => void
}

export function SalsasDrawer({ open, onClose, tenantId, onSaved }: SalsasDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [ingredients, setIngredients] = useState<IngredientDefinition[]>([])
  const [search, setSearch] = useState('')
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('')

  const [vasitoQty, setVasitoQty] = useState<string>('50')
  const [vasitoUnit, setVasitoUnit] = useState<string>('ml')
  const [customName, setCustomName] = useState<string>('')
  const [isFree, setIsFree] = useState(true)
  const [priceGs, setPriceGs] = useState<string>('0')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    let active = true
    const loadIngredients = async () => {
      setLoadingIngredients(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('ingredientes')
          .select('id, tenant_id, slug, nombre, unidad, tipo_inventario, icono, precio_publico, tipo_recargo_extra, stock_actual, stock_minimo, stock_minimo_sugerido, controlar_stock, descripcion, activo, permite_extra_en_carrito')
          .eq('tenant_id', tenantId)
          .eq('activo', true)
          .order('nombre')

        if (!active) return
        if (error) {
          console.error('Error cargando ingredientes para salsas', error)
          setIngredients([])
          return
        }
        setIngredients((data ?? []) as IngredientDefinition[])
      } finally {
        if (active) setLoadingIngredients(false)
      }
    }

    loadIngredients()
    return () => {
      active = false
    }
  }, [open, tenantId])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedIngredientId('')
      setVasitoQty('50')
      setVasitoUnit('ml')
      setCustomName('')
      setIsFree(true)
      setPriceGs('0')
      setIsSaving(false)
      setErrorMessage(null)
      setSuccessMessage(null)
      return
    }
  }, [open])

  const selectedIngredient = useMemo(
    () => ingredients.find((i) => i.id === selectedIngredientId) ?? null,
    [ingredients, selectedIngredientId]
  )

  useEffect(() => {
    if (!open) return
    if (!selectedIngredientId && ingredients.length > 0) {
      setSelectedIngredientId(ingredients[0].id)
    }
  }, [open, selectedIngredientId, ingredients])

  useEffect(() => {
    if (!selectedIngredient) return
    // Default: usar unidad del ingrediente si es volumen; caso contrario, mantener ml por UX.
    const u = (selectedIngredient.unidad ?? '').toLowerCase()
    if (u === 'ml' || u === 'l') setVasitoUnit(u)
  }, [selectedIngredient])

  useEffect(() => {
    if (isFree) setPriceGs('0')
  }, [isFree])

  const suggestedName = useMemo(() => {
    const ingName = selectedIngredient?.nombre ? toTitleCase(selectedIngredient.nombre.trim()) : 'Salsa'
    const qty = Math.max(0, parseFloat(String(vasitoQty).replace(',', '.')) || 0)
    const unit = (vasitoUnit || 'ml').trim()
    const qtyLabel = qty > 0 ? `${qty} ${unit}` : unit
    return `Vasito de ${ingName} - ${qtyLabel}`
  }, [selectedIngredient?.nombre, vasitoQty, vasitoUnit])

  const finalName = (customName.trim() || suggestedName).trim()

  const filteredIngredients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ingredients
    return ingredients.filter((i) => (i.nombre ?? '').toLowerCase().includes(q))
  }, [ingredients, search])

  const unitWarning = useMemo(() => {
    if (!selectedIngredient) return null
    const ingUnit = (selectedIngredient.unidad ?? '').toLowerCase()
    const unit = (vasitoUnit ?? '').toLowerCase()
    if (!ingUnit) return null
    if (ingUnit !== unit) {
      return `Aviso: la materia prima está en “${selectedIngredient.unidad}” pero el vasito está en “${vasitoUnit}”. Para que el descuento de stock sea consistente, conviene usar la misma unidad.`
    }
    return null
  }, [selectedIngredient, vasitoUnit])

  const ensureSaucesCategoryId = async (): Promise<string> => {
    const supabase = createClient()
    const { data: existing, error: findError } = await supabase
      .from('categorias')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('nombre', SAUCES_CATEGORY_NAME)
      .maybeSingle()

    if (findError) throw findError
    if (existing?.id) return existing.id

    const { data: inserted, error: insertError } = await supabase
      .from('categorias')
      .insert({
        tenant_id: tenantId,
        nombre: SAUCES_CATEGORY_NAME,
        descripcion: 'Salsas por vasitos (extras)',
        orden: 98,
        activa: true,
        mostrar_en_pos: false,
      })
      .select('id')
      .single()

    if (insertError) throw insertError
    return inserted.id
  }

  const handleCreate = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!selectedIngredient) {
      setErrorMessage('Seleccioná una materia prima (ingrediente).')
      return
    }

    const qty = parseFloat(String(vasitoQty).replace(',', '.'))
    if (!Number.isFinite(qty) || qty <= 0) {
      setErrorMessage('La cantidad por vasito debe ser mayor a 0.')
      return
    }

    const unit = (vasitoUnit || selectedIngredient.unidad || 'ml').trim()
    if (!unit) {
      setErrorMessage('La unidad es requerida.')
      return
    }

    const precio = isFree ? 0 : parseGsInput(priceGs)
    if (!isFree && precio <= 0) {
      setErrorMessage('Si no es gratis, el precio debe ser mayor a 0.')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()

      const { data: vasitoContainer, error: vasitoLookupError } = await supabase
        .from('ingredientes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('slug', VASITO_CONTAINER_SLUG)
        .eq('activo', true)
        .maybeSingle()

      if (vasitoLookupError) throw vasitoLookupError
      if (!vasitoContainer?.id) {
        setErrorMessage(
          'Falta la materia prima del vasito. Creá un ingrediente con slug «vasito-para-salsa» (ej. "Vasito para salsa", unidad) en Ingredientes; el POS descontará 1 por cada vasito vendido.'
        )
        setIsSaving(false)
        return
      }

      const categoriaId = await ensureSaucesCategoryId()

      // 1) Crear producto (salsa)
      const { data: producto, error: prodError } = await supabase
        .from('productos')
        .insert({
          tenant_id: tenantId,
          categoria_id: categoriaId,
          nombre: finalName,
          descripcion: `Salsa ligada a ${selectedIngredient.nombre} (${qty} ${unit} por vasito).`,
          precio,
          disponible: true,
          tiene_receta: true,
          is_deleted: false,
        } as any)
        .select('id,nombre')
        .single()

      if (prodError) throw prodError

      // 2) Crear receta 1 ingrediente
      const { error: recetaError } = await supabase
        .from('recetas_producto')
        .insert({
          tenant_id: tenantId,
          producto_id: producto.id,
          ingrediente_id: selectedIngredient.id,
          cantidad: qty,
          unidad: unit,
          obligatorio: true,
        } as any)

      if (recetaError) throw recetaError

      // 3) Receta: 1 vasito desechable por unidad vendida (salsa + envase)
      const { error: recetaVasitoError } = await supabase
        .from('recetas_producto')
        .insert({
          tenant_id: tenantId,
          producto_id: producto.id,
          ingrediente_id: vasitoContainer.id,
          cantidad: 1,
          unidad: 'unidad',
          obligatorio: true,
        } as any)

      if (recetaVasitoError) {
        await supabase.from('recetas_producto').delete().eq('producto_id', producto.id)
        await supabase.from('productos').delete().eq('id', producto.id)
        throw recetaVasitoError
      }

      setSuccessMessage(`Salsa creada: "${producto.nombre}"`)
      onSaved?.()
      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err: any) {
      console.error('Error creando salsa', err)
      setErrorMessage(err?.message || 'No se pudo crear la salsa. Intentalo de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted || !open) return null

  const content = (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Droplets className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                Crear salsas por vasitos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                Se guardan como productos; la receta incluye la salsa y 1 vasito (envase)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Ingrediente */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500 mb-3">
              Materia prima vinculada
            </p>

            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar materia prima…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              {loadingIngredients ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando materias primas…
                </div>
              ) : filteredIngredients.length === 0 ? (
                <div className="text-sm text-gray-500">No hay materias primas activas.</div>
              ) : (
                <select
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  {filteredIngredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.nombre} ({ing.unidad})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </section>

          {/* Config vasito */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              Definición del vasito
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Cantidad por vasito
                </label>
                <input
                  value={vasitoQty}
                  onChange={(e) => setVasitoQty(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  placeholder="Ej: 50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Unidad
                </label>
                <select
                  value={vasitoUnit}
                  onChange={(e) => setVasitoUnit(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  {selectedIngredient?.unidad && !['ml', 'l'].includes(String(selectedIngredient.unidad).toLowerCase()) && (
                    <option value={selectedIngredient.unidad}>{selectedIngredient.unidad}</option>
                  )}
                </select>
              </div>
            </div>

            {unitWarning && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-200">
                {unitWarning}
              </div>
            )}
          </section>

          {/* Precio */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              Cobro
            </p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
              />
              Gratis (precio 0)
            </label>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Precio (Gs)
              </label>
              <input
                value={isFree ? '0' : priceGs}
                onChange={(e) => setPriceGs(formatGsInput(e.target.value))}
                disabled={isFree}
                inputMode="numeric"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm disabled:opacity-60"
                placeholder="Ej: 2.000"
              />
            </div>
          </section>

          {/* Nombre */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              Nombre (impresión)
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Sugerido: <span className="font-semibold">{suggestedName}</span>
            </div>
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              placeholder="Dejá vacío para usar el sugerido"
            />
          </section>

          {/* Feedback */}
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 dark:border-red-700/40 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-200 flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}
          {successMessage && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-sm text-emerald-800 dark:text-emerald-200 flex gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSaving || !selectedIngredient}
            className="flex-1 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Crear salsa
          </button>
        </div>
      </aside>
    </div>
  )

  return createPortal(content, document.body)
}

