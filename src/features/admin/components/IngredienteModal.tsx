'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Loader2, Hash, Scale, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Ingrediente } from '@/types/database'

interface IngredienteModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  onSaved?: () => void
}

export function IngredienteModal({ open, onClose, tenantId, onSaved }: IngredienteModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Form fields
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipoInventario, setTipoInventario] = useState<'discreto' | 'fraccionable'>('fraccionable')
  const [unidad, setUnidad] = useState('g')
  const [stockActual, setStockActual] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [precioPublico, setPrecioPublico] = useState('')
  const [controlarStock, setControlarStock] = useState(true)
  const [permiteExtraEnCarrito, setPermiteExtraEnCarrito] = useState(false)
  const [icono, setIcono] = useState('')

  // Detectar cuando el componente está montado en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      // Reset form
      setNombre('')
      setDescripcion('')
      setTipoInventario('fraccionable')
      setUnidad('g')
      setStockActual('')
      setStockMinimo('')
      setPrecioPublico('')
      setControlarStock(true)
      setPermiteExtraEnCarrito(false)
      setIcono('')
      setSuccessMessage(null)
      setErrorMessage(null)
    }
  }, [open])

  const toTitleCase = (str: string): string =>
    str.replace(/\S+/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())

  const formatGuaranies = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validaciones
    if (!nombre.trim()) {
      setErrorMessage('El nombre es obligatorio')
      return
    }

    if (parseFloat(stockActual) < 0) {
      setErrorMessage('El stock actual no puede ser negativo')
      return
    }

    if (parseFloat(stockMinimo) < 0) {
      setErrorMessage('El stock mínimo no puede ser negativo')
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Crear ingrediente (materia prima)
      const nombreFinal = toTitleCase(nombre.trim())
      let slug = await generateUniqueIngredientSlug(supabase, tenantId, nombreFinal)

      const ingredienteData: Partial<Ingrediente> = {
        tenant_id: tenantId,
        slug,
        nombre: nombreFinal,
        descripcion: descripcion.trim() || undefined,
        tipo_inventario: tipoInventario,
        unidad,
        stock_actual: parseFloat(stockActual) || 0,
        stock_minimo: parseFloat(stockMinimo) || 0,
        precio_publico: parseInt(precioPublico.replace(/\./g, ''), 10) || 0,
        controlar_stock: controlarStock,
        permite_extra_en_carrito: permiteExtraEnCarrito,
        icono: icono.trim() || undefined,
        activo: true
      }

      let { data: ingrediente, error } = await supabase
        .from('ingredientes')
        .insert(ingredienteData)
        .select()
        .single()

      // Fallback defensivo: si existe un índice global por slug en BD, evitamos que reviente.
      if (error?.code === '23505' && /slug/i.test(error.message ?? '')) {
        slug = `${slug}-${tenantId.slice(0, 4)}-${Date.now().toString().slice(-4)}`
        const retry = await supabase
          .from('ingredientes')
          .insert({ ...ingredienteData, slug })
          .select()
          .single()
        ingrediente = retry.data
        error = retry.error
      }

      if (error) throw error

      // Si hay stock inicial, registrar movimiento
      if (parseFloat(stockActual) > 0) {
        const { error: movimientoError } = await supabase
          .from('movimientos_ingredientes')
          .insert({
            ingrediente_id: ingrediente.id,
            tenant_id: tenantId,
            tipo: 'inicial',
            cantidad: parseFloat(stockActual),
            stock_anterior: 0,
            stock_nuevo: parseFloat(stockActual),
            motivo: 'Stock inicial al crear ingrediente'
          })

        if (movimientoError) {
          console.error('Error registrando movimiento inicial:', movimientoError)
        }
      }

      setSuccessMessage(`Materia prima "${toTitleCase(nombre.trim())}" registrada exitosamente`)

      setTimeout(() => {
        onSaved?.()
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error('Error al crear ingrediente:', error)
      setErrorMessage(error.message || 'Error al crear el ingrediente')
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) return null
  if (!open) return null

  const unitLabel = tipoInventario === 'discreto' ? 'uds' : unidad

  const modalContent = (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Overlay: cubre todo el viewport, clic cierra */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default border-0 bg-black/70 backdrop-blur-sm focus:outline-none"
        onClick={() => !isSaving && onClose()}
        aria-label="Cerrar"
        tabIndex={-1}
      />
      {/* Contenedor de centrado */}
      <div className="relative z-10 flex h-full items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white dark:bg-gray-900 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ingrediente-modal-title"
        >

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/40">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="ingrediente-modal-title" className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Registrar Materias Primas
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ingredientes y materiales para elaborar productos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: scroll interno, footer queda fijo abajo */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">

          {/* Feedback messages */}
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/60 p-3.5">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/60 p-3.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{successMessage}</p>
            </div>
          )}

          {/* ── Sección 1: Identificación ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shrink-0">1</span>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Identificaci&oacute;n
              </h3>
            </div>

            {/* Nombre + emoji en una fila */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Carne vacuna"
                  required
                  disabled={isSaving}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>
              <div className="w-24 shrink-0">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Icono
                </label>
                <input
                  type="text"
                  value={icono}
                  onChange={(e) => setIcono(e.target.value)}
                  placeholder="🥩"
                  maxLength={2}
                  disabled={isSaving}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-center text-xl placeholder:text-gray-300 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripci&oacute;n <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Medallón de res 120 g, cocción punto medio"
                rows={2}
                disabled={isSaving}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition"
              />
            </div>

            {/* precio_publico: recargo POS por cada +1 de extra (no es costo de bolsa/kg) */}
            <div className="w-full sm:w-1/2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Precio extra en carrito
              </label>
              <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                Guaraníes que se suman al producto por cada incremento (+1) de este ingrediente como extra en el POS. No uses aquí el precio de un paquete entero (por ejemplo 1 kg).
              </p>
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition">
                <span className="flex items-center px-3.5 text-sm font-semibold text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60 select-none whitespace-nowrap">
                  Gs.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={precioPublico}
                  onChange={(e) => setPrecioPublico(formatGuaranies(e.target.value))}
                  placeholder="0"
                  disabled={isSaving}
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

          {/* ── Sección 2: Tipo de inventario ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shrink-0">2</span>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Tipo de inventario
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Discreto */}
              <label className="group relative flex cursor-pointer gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-orange-400 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
                <input
                  type="radio"
                  value="discreto"
                  checked={tipoInventario === 'discreto'}
                  onChange={(e) => {
                    setTipoInventario(e.target.value as 'discreto')
                    setUnidad('unidad')
                  }}
                  disabled={isSaving}
                  className="peer sr-only"
                />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 group-has-[:checked]:bg-orange-100 dark:group-has-[:checked]:bg-orange-900/40 transition">
                  <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400 group-has-[:checked]:text-orange-600 dark:group-has-[:checked]:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Discreto</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Contable por unidades — pan, huevos, nuggets</p>
                </div>
              </label>

              {/* Fraccionable */}
              <label className="group relative flex cursor-pointer gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-orange-400 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
                <input
                  type="radio"
                  value="fraccionable"
                  checked={tipoInventario === 'fraccionable'}
                  onChange={(e) => {
                    setTipoInventario(e.target.value as 'fraccionable')
                    setUnidad('g')
                  }}
                  disabled={isSaving}
                  className="peer sr-only"
                />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 group-has-[:checked]:bg-orange-100 dark:group-has-[:checked]:bg-orange-900/40 transition">
                  <Scale className="h-4 w-4 text-gray-500 dark:text-gray-400 group-has-[:checked]:text-orange-600 dark:group-has-[:checked]:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Fraccionable</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Medible en peso o volumen — carne, queso, salsas</p>
                </div>
              </label>
            </div>

            {/* Unidad — solo visible cuando es fraccionable */}
            {tipoInventario === 'fraccionable' && (
              <div className="flex items-center gap-3">
                <ChevronRight className="h-4 w-4 text-orange-400 shrink-0" />
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unidad de medida
                  </label>
                  <select
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="l">Litros (l)</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

          {/* ── Sección 3: Stock ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shrink-0">3</span>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Stock
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Stock inicial */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stock inicial
                </label>
                <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition">
                  <input
                    type="number"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    placeholder="0"
                    min="0"
                    step={tipoInventario === 'discreto' ? '1' : '0.01'}
                    disabled={isSaving}
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="flex items-center px-3.5 text-xs font-semibold text-gray-400 border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60 select-none">
                    {unitLabel}
                  </span>
                </div>
              </div>

              {/* Stock mínimo */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stock m&iacute;nimo <span className="text-gray-400 font-normal text-xs">(alerta)</span>
                </label>
                <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition">
                  <input
                    type="number"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    placeholder="0"
                    min="0"
                    step={tipoInventario === 'discreto' ? '1' : '0.01'}
                    disabled={isSaving}
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="flex items-center px-3.5 text-xs font-semibold text-gray-400 border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60 select-none">
                    {unitLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle controlar stock */}
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={controlarStock}
                  onChange={(e) => setControlarStock(e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="h-5 w-9 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-orange-500 peer-disabled:opacity-50 transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Descontar stock autom&aacute;ticamente
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Reduce el stock cada vez que se confirma un pedido
                </p>
              </div>
            </label>

            {/* Toggle habilitar como extra en carrito */}
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={permiteExtraEnCarrito}
                  onChange={(e) => setPermiteExtraEnCarrito(e.target.checked)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="h-5 w-9 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-orange-500 peer-disabled:opacity-50 transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Permitir como extra en carrito
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Si est&aacute; activo, este ingrediente podr&aacute; agregarse manualmente en la personalizaci&oacute;n del pedido.
                </p>
              </div>
            </label>
          </section>
        </div>

        {/* Footer: fijo abajo */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 px-6 py-4 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 active:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Registrar materia prima'
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

function buildIngredientSlugBase(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)

  return base || 'ingrediente'
}

async function generateUniqueIngredientSlug(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  nombre: string
): Promise<string> {
  const base = buildIngredientSlugBase(nombre)

  const { data, error } = await supabase
    .from('ingredientes')
    .select('slug')
    .eq('tenant_id', tenantId)
    .like('slug', `${base}%`)

  if (error) throw error

  const used = new Set((data ?? []).map((row) => row.slug))
  if (!used.has(base)) return base

  let n = 2
  while (used.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
