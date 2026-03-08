'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Plus, CheckCircle, XCircle, ChefHat, ClipboardList, Tag, Trash2, AlertTriangle } from 'lucide-react'
import { OwnerProductModal } from '../components/OwnerProductModal'
import { IngredienteModal } from '@/features/admin/components/IngredienteModal'
import { CategoriaModal } from '@/features/admin/components/CategoriaModal'
import { listProductosOwner, deleteProductoOwner } from '@/app/actions/owner'
import { ROUTES } from '@/config/routes'

interface Producto {
  id: string
  nombre: string
  precio: number
  disponible: boolean
  tiene_receta: boolean
  imagen_url?: string | null
  categoria_id?: string | null
}

interface Tenant {
  id: string
  nombre: string
  slug: string
}

interface ProductManagementViewProps {
  tenant: Tenant
  initialProductos: Producto[]
  productosError: string | null
}

export function ProductManagementView({ tenant, initialProductos, productosError }: ProductManagementViewProps) {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>(initialProductos)
  const [showModal, setShowModal] = useState(false)
  const [showIngredienteModal, setShowIngredienteModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const refreshProductos = useCallback(async () => {
    const result = await listProductosOwner(tenant.id)
    if (!result.error) {
      setProductos(result.productos)
    }
  }, [tenant.id])

  const handleSaved = () => {
    setShowModal(false)
    refreshProductos()
  }

  const handleDeleteConfirm = async () => {
    if (!productoToDelete) return
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteProductoOwner(productoToDelete.id, tenant.id)
    setDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      return
    }
    setProductoToDelete(null)
    refreshProductos()
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(ROUTES.PROTECTED.OWNER)}
              className="p-2 rounded-xl hover:bg-gray-200 transition"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-widest text-orange-500 font-medium">
                Gestión de productos
              </p>
              <h1 className="text-2xl font-black text-gray-900">{tenant.nombre}</h1>
              <p className="text-sm text-gray-400 font-mono">/{tenant.slug}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowIngredienteModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-orange-300 bg-white px-5 py-3 font-semibold text-orange-600 hover:bg-orange-50 transition"
            >
              <ClipboardList className="w-5 h-5" />
              Registrar inventario
            </button>
            <button
              onClick={() => setShowCategoriaModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-orange-300 bg-white px-5 py-3 font-semibold text-orange-600 hover:bg-orange-50 transition"
            >
              <Tag className="w-5 h-5" />
              Nueva categoría
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition"
            >
              <Plus className="w-5 h-5" />
              Nuevo producto
            </button>
          </div>
        </div>

        {/* Banner de error al cargar productos */}
        {productosError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-700">Error al cargar productos</p>
            <p className="text-xs text-red-500 font-mono mt-1">{productosError}</p>
          </div>
        )}

        {/* Contenido */}
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Sin productos cargados</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Esta lomitería aún no tiene productos. Presiona "Nuevo producto" para comenzar a cargar el menú.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((producto) => (
              <div
                key={producto.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3"
              >
                {/* Imagen solo si existe */}
                {producto.imagen_url && (
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{producto.nombre}</h3>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        producto.disponible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
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

                  <p className="text-base font-bold text-orange-600 mt-1">
                    Gs. {producto.precio.toLocaleString('es-PY')}
                  </p>

                  <div className="flex items-center gap-1 mt-2">
                    <ChefHat className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {producto.tiene_receta ? 'Con receta' : 'Sin receta / Combo'}
                    </span>
                  </div>
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={() => {
                    setDeleteError(null)
                    setProductoToDelete(producto)
                  }}
                  className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {productos.length > 0 && (
          <p className="text-sm text-gray-400 text-center">
            {productos.length} producto{productos.length !== 1 ? 's' : ''} cargado{productos.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Modal confirmación de eliminación */}
      {productoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setProductoToDelete(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Eliminar producto</h3>
                <p className="text-sm text-gray-500 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm text-gray-700">
              ¿Estás seguro que querés eliminar{' '}
              <span className="font-semibold text-gray-900">"{productoToDelete.nombre}"</span>?
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setProductoToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <OwnerProductModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tenantId={tenant.id}
        onSaved={handleSaved}
      />
      <IngredienteModal
        open={showIngredienteModal}
        onClose={() => setShowIngredienteModal(false)}
        tenantId={tenant.id}
        onSaved={() => setShowIngredienteModal(false)}
      />
      <CategoriaModal
        open={showCategoriaModal}
        onClose={() => setShowCategoriaModal(false)}
        tenantId={tenant.id}
        onSaved={() => setShowCategoriaModal(false)}
      />
    </>
  )
}
