'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Loader2 } from 'lucide-react'
import { listCategoriasOwner, updateProductoOwner } from '@/app/actions/owner'

interface Producto {
  id: string
  nombre: string
  descripcion?: string | null
  precio: number
  disponible: boolean
  imagen_url?: string | null
  categoria_id?: string | null
  puntos_extra?: number | null
}

interface EditProductoModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  producto: Producto | null
  onSaved?: () => void
}

const formatGuaranies = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const parseGuaranies = (value: string): number =>
  parseInt(value.replace(/\./g, ''), 10) || 0

export function EditProductoModal({ open, onClose, tenantId, producto, onSaved }: EditProductoModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [disponible, setDisponible] = useState(true)
  const [imagenUrl, setImagenUrl] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [puntosExtra, setPuntosExtra] = useState<number>(0)

  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Populate fields when producto changes or modal opens
  useEffect(() => {
    if (!open || !producto) return

    setNombre(producto.nombre)
    setDescripcion(producto.descripcion ?? '')
    setPrecio(formatGuaranies(String(producto.precio)))
    setDisponible(producto.disponible)
    setImagenUrl(producto.imagen_url ?? '')
    setCategoriaId(producto.categoria_id ?? '')
    setPuntosExtra(producto.puntos_extra ?? 0)
    setErrorMessage(null)
    setSuccessMessage(null)
  }, [open, producto])

  // Load categorias when modal opens
  useEffect(() => {
    if (!open) return
    setLoadingCategorias(true)
    listCategoriasOwner(tenantId)
      .then((res) => setCategorias(res.categorias))
      .catch(() => {})
      .finally(() => setLoadingCategorias(false))
  }, [open, tenantId])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producto) return
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!nombre.trim()) {
      setErrorMessage('El nombre del producto es obligatorio')
      return
    }

    const precioNum = parseGuaranies(precio)
    if (precioNum < 0) {
      setErrorMessage('El precio no puede ser negativo')
      return
    }

    setIsSaving(true)
    const result = await updateProductoOwner(producto.id, tenantId, {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: precioNum,
      disponible,
      imagen_url: imagenUrl.trim() || null,
      categoria_id: categoriaId || null,
      puntos_extra: puntosExtra,
    })
    setIsSaving(false)

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    setSuccessMessage(`"${nombre.trim()}" actualizado correctamente`)
    setTimeout(() => {
      onSaved?.()
      onClose()
    }, 1200)
  }

  if (!mounted || !open || !producto) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white dark:bg-gray-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2.5">
              <Package className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar producto</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[220px]">
                {producto.nombre}
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
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-6 space-y-5">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{successMessage}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isSaving}
              required
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              disabled={isSaving}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 resize-none"
            />
          </div>

          {/* Precio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Precio (Gs.) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 select-none">
                Gs.
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={precio}
                onChange={(e) => setPrecio(formatGuaranies(e.target.value))}
                disabled={isSaving}
                required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-11 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categoría
            </label>
            {loadingCategorias ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            ) : (
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                disabled={isSaving}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
              >
                <option value="">Sin categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Puntos extra bonus */}
          <div className="rounded-xl border border-yellow-200 dark:border-yellow-700/40 bg-yellow-50 dark:bg-yellow-900/10 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">⭐</span>
              <label className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                Puntos bonus por unidad
              </label>
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">(opcional)</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Puntos adicionales sobre la fórmula automática (1 pto / 100 Gs).
            </p>
            <div className="flex rounded-xl border border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-400/20 transition">
              <span className="flex items-center px-3.5 text-sm font-semibold text-yellow-600 border-r border-yellow-200 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 select-none">pts</span>
              <input
                type="number"
                min={0}
                step={1}
                value={puntosExtra}
                onChange={(e) => setPuntosExtra(Math.max(0, parseInt(e.target.value, 10) || 0))}
                disabled={isSaving}
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none disabled:opacity-50"
              />
            </div>
            {puntosExtra > 0 && (
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                Bonus activo: +{puntosExtra} pts extra por unidad vendida
              </p>
            )}
          </div>

          {/* Disponible */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Disponible en el menú</p>
              <p className="text-xs text-gray-400 mt-0.5">Los clientes podrán verlo y pedirlo</p>
            </div>
            <button
              type="button"
              onClick={() => setDisponible((v) => !v)}
              disabled={isSaving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                disponible ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  disponible ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* URL imagen */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              URL de imagen (opcional)
            </label>
            <input
              type="url"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              placeholder="https://..."
              disabled={isSaving}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
            />
            {imagenUrl && (
              <img
                src={imagenUrl}
                alt="Preview"
                className="mt-2 h-24 w-full rounded-xl object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-1">
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
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
