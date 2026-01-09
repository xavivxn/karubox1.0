'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Image as ImageIcon, Loader2 } from 'lucide-react'
import { getCategorias } from '@/lib/db/categorias'
import { crearProducto } from '@/lib/db/productos'
import type { Categoria } from '@/types/database'

interface ProductModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  onSaved?: () => void
}

export function ProductModal({ open, onClose, tenantId, onSaved }: ProductModalProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Form fields
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [disponible, setDisponible] = useState(true)
  const [imagenUrl, setImagenUrl] = useState('')

  // Detectar cuando el componente está montado en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const loadCategorias = async () => {
      setLoadingCategorias(true)
      try {
        const data = await getCategorias()
        setCategorias(data)
        if (data.length > 0 && !categoriaId) {
          setCategoriaId(data[0].id)
        }
      } catch (error) {
        console.error('Error cargando categorías:', error)
        setErrorMessage('No se pudieron cargar las categorías')
      } finally {
        setLoadingCategorias(false)
      }
    }

    loadCategorias()
  }, [open])

  useEffect(() => {
    if (!open) {
      // Reset form
      setNombre('')
      setDescripcion('')
      setPrecio('')
      setCategoriaId('')
      setDisponible(true)
      setImagenUrl('')
      setSuccessMessage(null)
      setErrorMessage(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validaciones básicas
    if (!nombre.trim()) {
      setErrorMessage('El nombre del producto es obligatorio')
      return
    }

    if (!precio || parseFloat(precio) <= 0) {
      setErrorMessage('El precio debe ser mayor a cero')
      return
    }

    if (!categoriaId) {
      setErrorMessage('Debes seleccionar una categoría')
      return
    }

    setIsSaving(true)

    try {
      // Crear el producto en la BD
      const nuevoProducto = await crearProducto({
        tenant_id: tenantId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio: parseFloat(precio),
        categoria_id: categoriaId || undefined,
        disponible: disponible,
        imagen_url: imagenUrl.trim() || undefined,
        is_deleted: false
      } as any)

      console.log('Producto creado exitosamente:', nuevoProducto)
      setSuccessMessage(`¡Producto "${nuevoProducto.nombre}" creado exitosamente!`)

      // Esperar un momento para mostrar el mensaje de éxito
      setTimeout(() => {
        onSaved?.()
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error guardando producto:', error)
      setErrorMessage('No se pudo guardar el producto. Inténtalo de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Nuevo Producto</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Registra un producto en el sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{successMessage}</p>
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre del producto */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold mb-2">
                Nombre del producto <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Hamburguesa clásica"
                disabled={isSaving}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:opacity-50"
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-semibold mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción del producto (opcional)"
                rows={3}
                disabled={isSaving}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Precio */}
              <div>
                <label htmlFor="precio" className="block text-sm font-semibold mb-2">
                  Precio (Gs.) <span className="text-red-500">*</span>
                </label>
                <input
                  id="precio"
                  type="number"
                  step="100"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0"
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:opacity-50"
                />
              </div>

              {/* Categoría */}
              <div>
                <label htmlFor="categoria" className="block text-sm font-semibold mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                {loadingCategorias ? (
                  <div className="flex items-center justify-center h-12 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <select
                    id="categoria"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:opacity-50"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* URL de imagen */}
            <div>
              <label htmlFor="imagen" className="block text-sm font-semibold mb-2">
                URL de imagen
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="imagen"
                  type="url"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  disabled={isSaving}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:opacity-50"
                />
              </div>
            </div>

            {/* Disponibilidad */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <input
                id="disponible"
                type="checkbox"
                checked={disponible}
                onChange={(e) => setDisponible(e.target.checked)}
                disabled={isSaving}
                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 disabled:opacity-50"
              />
              <label htmlFor="disponible" className="text-sm font-semibold cursor-pointer select-none">
                Producto disponible para la venta
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Package className="w-5 h-5" />
                Guardar producto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
