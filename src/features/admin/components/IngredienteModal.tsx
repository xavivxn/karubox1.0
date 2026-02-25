'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Loader2 } from 'lucide-react'
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
  const [tipoItem, setTipoItem] = useState<'materia_prima' | 'producto_sin_receta'>('materia_prima')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipoInventario, setTipoInventario] = useState<'discreto' | 'fraccionable'>('fraccionable')
  const [unidad, setUnidad] = useState('g')
  const [stockActual, setStockActual] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [precioPublico, setPrecioPublico] = useState('')
  const [controlarStock, setControlarStock] = useState(true)
  const [icono, setIcono] = useState('')

  // Detectar cuando el componente está montado en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      // Reset form
      setTipoItem('materia_prima')
      setNombre('')
      setDescripcion('')
      setTipoInventario('fraccionable')
      setUnidad('g')
      setStockActual('')
      setStockMinimo('')
      setPrecioPublico('')
      setControlarStock(true)
      setIcono('')
      setSuccessMessage(null)
      setErrorMessage(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    // Validaciones
    if (!nombre.trim()) {
      setErrorMessage('El nombre es obligatorio')
      return
    }

    if (parseFloat(precioPublico) < 0) {
      setErrorMessage('El precio no puede ser negativo')
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

      // Generar slug a partir del nombre
      const generateSlug = (text: string): string => {
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remover acentos
          .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
          .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
          .substring(0, 50) // Limitar longitud
      }

      if (tipoItem === 'materia_prima') {
        // Crear ingrediente (materia prima)
        const slug = generateSlug(nombre)
        
        const ingredienteData: Partial<Ingrediente> = {
          tenant_id: tenantId,
          slug,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          tipo_inventario: tipoInventario,
          unidad,
          stock_actual: parseFloat(stockActual) || 0,
          stock_minimo: parseFloat(stockMinimo) || 0,
          precio_publico: parseFloat(precioPublico) || 0,
          controlar_stock: controlarStock,
          icono: icono.trim() || undefined,
          activo: true
        }

        const { data: ingrediente, error } = await supabase
          .from('ingredientes')
          .insert(ingredienteData)
          .select()
          .single()

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

        setSuccessMessage(`Materia prima "${nombre}" registrada exitosamente`)
      } else {
        // Crear producto sin receta (registrar en inventario)
        const { data: producto, error: productoError } = await supabase
          .from('productos')
          .insert({
            tenant_id: tenantId,
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            precio: parseFloat(precioPublico) || 0,
            disponible: true,
            tiene_receta: false,
            is_deleted: false,
            imagen_url: icono.trim() || undefined
          })
          .select()
          .single()

        if (productoError) throw productoError

        // Registrar en tabla inventario
        const { error: inventarioError } = await supabase
          .from('inventario')
          .insert({
            tenant_id: tenantId,
            producto_id: producto.id,
            cantidad_actual: parseFloat(stockActual) || 0,
            cantidad_minima: parseFloat(stockMinimo) || 0,
            unidad: unidad
          })

        if (inventarioError) throw inventarioError

        // Si hay stock inicial, registrar movimiento
        if (parseFloat(stockActual) > 0) {
          const { error: movimientoError } = await supabase
            .from('movimientos_inventario')
            .insert({
              inventario_id: producto.id,
              tenant_id: tenantId,
              tipo: 'entrada',
              cantidad: parseFloat(stockActual),
              cantidad_anterior: 0,
              cantidad_nueva: parseFloat(stockActual),
              motivo: 'Stock inicial al crear producto'
            })

          if (movimientoError) {
            console.error('Error registrando movimiento inicial:', movimientoError)
          }
        }

        setSuccessMessage(`Producto "${nombre}" registrado exitosamente`)
      }
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

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2.5">
              <Package className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Registrar Inventario
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Materias primas y productos sin receta (bebidas, extras)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Messages */}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  {errorMessage}
                </p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Tipo de item */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                ¿Qué vas a registrar?
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="relative flex cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-orange-500 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
                  <input
                    type="radio"
                    value="materia_prima"
                    checked={tipoItem === 'materia_prima'}
                    onChange={(e) => setTipoItem(e.target.value as 'materia_prima')}
                    disabled={isSaving}
                    className="peer sr-only"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      🥩 Materia Prima
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Ingredientes para fabricar productos
                    </p>
                  </div>
                </label>

                <label className="relative flex cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-orange-500 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
                  <input
                    type="radio"
                    value="producto_sin_receta"
                    checked={tipoItem === 'producto_sin_receta'}
                    onChange={(e) => setTipoItem(e.target.value as 'producto_sin_receta')}
                    disabled={isSaving}
                    className="peer sr-only"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      🥤 Producto sin receta
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Bebidas, extras (comprados listos)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Información básica
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tipoItem === 'materia_prima' ? 'Nombre del ingrediente' : 'Nombre del producto'} *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={tipoItem === 'materia_prima' ? 'Ej: Carne Vacuna 120g' : 'Ej: Coca Cola 1.5L'}
                    required
                    disabled={isSaving}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción adicional del ingrediente"
                    rows={2}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Icono (emoji opcional)
                  </label>
                  <input
                    type="text"
                    value={icono}
                    onChange={(e) => setIcono(e.target.value)}
                    placeholder="🥩"
                    maxLength={2}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Precio público
                  </label>
                  <input
                    type="number"
                    value={precioPublico}
                    onChange={(e) => setPrecioPublico(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="100"
                    disabled={isSaving}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Tipo de inventario */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Tipo de inventario
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="relative flex cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-orange-500 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
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
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Discreto (unidades)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Productos contables: pan, huevos, nuggets
                    </p>
                  </div>
                </label>

                <label className="relative flex cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-orange-500 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
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
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Fraccionable (peso/volumen)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Medibles: carne, queso, salsas
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unidad de medida *
                </label>
                <select
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  disabled={isSaving}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tipoInventario === 'discreto' ? (
                    <option value="unidad">Unidad</option>
                  ) : (
                    <>
                      <option value="g">Gramos (g)</option>
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="l">Litros (l)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Control de stock */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Control de stock
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    placeholder="0"
                    min="0"
                    step={tipoInventario === 'discreto' ? '1' : '0.01'}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stock mínimo (alerta)
                  </label>
                  <input
                    type="number"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    placeholder="0"
                    min="0"
                    step={tipoInventario === 'discreto' ? '1' : '0.01'}
                    disabled={isSaving}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <input
                  type="checkbox"
                  checked={controlarStock}
                  onChange={(e) => setControlarStock(e.target.checked)}
                  disabled={isSaving}
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Controlar stock automáticamente
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Descuenta stock cuando se confirman pedidos
                  </p>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                tipoItem === 'materia_prima' ? 'Registrar materia prima' : 'Registrar producto'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
