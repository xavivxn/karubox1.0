/**
 * Admin Module - Productos List Modal
 * Modal para ver y gestionar los productos creados (listado con editar/eliminar)
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Loader2, Plus, Pencil, Trash2, CheckCircle, XCircle, ChefHat, AlertTriangle } from 'lucide-react'
import { listProductosOwner, deleteProductoOwner } from '@/app/actions/owner'
import { EditProductoModal } from '@/features/owner/components/EditProductoModal'

interface Producto {
  id: string
  nombre: string
  descripcion?: string | null
  precio: number
  disponible: boolean
  tiene_receta: boolean
  imagen_url?: string | null
  categoria_id?: string | null
}

interface ProductosListModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  onOpenCreate?: () => void
  onRefresh?: () => void
}

export function ProductosListModal({
  open,
  onClose,
  tenantId,
  onOpenCreate,
  onRefresh
}: ProductosListModalProps) {
  const [mounted, setMounted] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productoToEdit, setProductoToEdit] = useState<Producto | null>(null)
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadProductos = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    const result = await listProductosOwner(tenantId)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      setProductos([])
      return
    }
    setProductos(result.productos ?? [])
  }, [tenantId])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open && tenantId) {
      loadProductos()
    }
  }, [open, tenantId, loadProductos])

  useEffect(() => {
    if (!open) {
      setProductoToEdit(null)
      setProductoToDelete(null)
      setDeleteError(null)
    }
  }, [open])

  const handleDeleteConfirm = async () => {
    if (!productoToDelete) return
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteProductoOwner(productoToDelete.id, tenantId)
    setDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      return
    }
    setProductoToDelete(null)
    loadProductos()
    onRefresh?.()
  }

  const handleEditSaved = () => {
    setProductoToEdit(null)
    loadProductos()
    onRefresh?.()
  }

  const handleNewProduct = () => {
    onClose()
    onOpenCreate?.()
  }

  if (!mounted) return null

  const modalContent = (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="productos-list-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 id="productos-list-title" className="text-xl font-bold text-gray-900 dark:text-white">
                Productos creados
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {productos.length} producto{productos.length !== 1 ? 's' : ''} en el menú
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenCreate && (
              <button
                type="button"
                onClick={handleNewProduct}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition"
              >
                <Plus className="w-4 h-4" />
                Nuevo producto
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando productos...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-orange-500 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Sin productos</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                Aún no hay productos cargados. Creá el primero desde el panel o usando el botón de arriba.
              </p>
              {onOpenCreate && (
                <button
                  type="button"
                  onClick={handleNewProduct}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo producto
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-4 flex flex-col gap-3"
                >
                  {producto.imagen_url && (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-full h-28 object-cover rounded-xl"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug truncate">
                        {producto.nombre}
                      </h3>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          producto.disponible
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {producto.disponible ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {producto.disponible ? 'Disponible' : 'Oculto'}
                      </span>
                    </div>
                    <p className="text-base font-bold text-orange-600 dark:text-orange-400 mt-1">
                      Gs. {producto.precio.toLocaleString('es-PY')}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <ChefHat className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {producto.tiene_receta ? 'Con receta' : 'Sin receta / Combo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setProductoToEdit(producto)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null)
                        setProductoToDelete(producto)
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                      aria-label={`Eliminar ${producto.nombre}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation - overlay sobre todo el modal */}
      {productoToDelete && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Eliminar producto</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              ¿Eliminar <span className="font-semibold">&quot;{productoToDelete.nombre}&quot;</span>?
            </p>
            {deleteError && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setProductoToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    <EditProductoModal
      open={productoToEdit !== null}
      onClose={() => setProductoToEdit(null)}
      tenantId={tenantId}
      producto={productoToEdit}
      onSaved={handleEditSaved}
    />
    </>
  )

  return open ? createPortal(modalContent, document.body) : null
}
