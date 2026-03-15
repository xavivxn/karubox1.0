'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Plus, CheckCircle, XCircle, ChefHat, ClipboardList, Tag, Trash2, AlertTriangle, Users, Printer, Pencil } from 'lucide-react'
import { OwnerProductModal } from '../components/OwnerProductModal'
import { EditProductoModal } from '../components/EditProductoModal'
import { IngredienteModal } from '@/features/admin/components/IngredienteModal'
import { CategoriaModal } from '@/features/admin/components/CategoriaModal'
import { CajerosModal } from '../components/CajerosModal'
import { PrinterConfigModal } from '../components/PrinterConfigModal'
import { listProductosOwner, deleteProductoOwner, deleteTenantOwner } from '@/app/actions/owner'
import { ROUTES } from '@/config/routes'

interface Producto {
  id: string
  nombre: string
  descripcion?: string | null
  precio: number
  disponible: boolean
  tiene_receta: boolean
  imagen_url?: string | null
  categoria_id?: string | null
  puntos_extra?: number | null
}

interface Tenant {
  id: string
  nombre: string
  slug: string
  logo_url?: string | null
}

interface ProductManagementViewProps {
  tenant: Tenant
  initialProductos: Producto[]
  productosError: string | null
  userRole: string
}

export function ProductManagementView({ tenant, initialProductos, productosError, userRole }: ProductManagementViewProps) {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>(initialProductos)
  const [showModal, setShowModal] = useState(false)
  const [showIngredienteModal, setShowIngredienteModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false)
  const [deletingTenant, setDeletingTenant] = useState(false)
  const [deleteTenantError, setDeleteTenantError] = useState<string | null>(null)
  const [tenantNameConfirmation, setTenantNameConfirmation] = useState('')
  const [showCajerosModal, setShowCajerosModal] = useState(false)
  const [showPrinterModal, setShowPrinterModal] = useState(false)
  const [productoToEdit, setProductoToEdit] = useState<Producto | null>(null)


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

  const handleDeleteTenant = async () => {
    if (!tenant) return

    setDeletingTenant(true)
    setDeleteTenantError(null)

    const result = await deleteTenantOwner(tenant.id)

    if (result.error) {
      setDeleteTenantError(result.error)
      setDeletingTenant(false)
    } else {
      router.push(ROUTES.PROTECTED.OWNER)
    }
  }


  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(ROUTES.PROTECTED.OWNER)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30 overflow-hidden">
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} alt={tenant.nombre} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-orange-500 dark:text-orange-400 font-medium">
                  Gesti&oacute;n de productos
                </p>
                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight">{tenant.nombre}</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">/{tenant.slug}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {/* CTA principal */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              Nuevo producto
            </button>

            {/* Acciones secundarias */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setShowIngredienteModal(true)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition">
                  <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">Registrar inventario</span>
              </button>

              {userRole === 'owner' && (
                <button
                  onClick={() => setShowCategoriaModal(true)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition">
                    <Tag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">Categorías</span>
                </button>
              )}

              {userRole === 'owner' && (
                <button
                  onClick={() => setShowCajerosModal(true)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition">
                    <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">Administrar usuarios</span>
                </button>
              )}

              {userRole === 'owner' && (
                <button
                  onClick={() => setShowPrinterModal(true)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition">
                    <Printer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">Configurar impresora</span>
                </button>
              )}
            </div>

            {/* Zona de peligro */}
            {userRole === 'owner' && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDeleteTenantModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar lomitería
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Banner de error al cargar productos */}
        {productosError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Error al cargar productos</p>
            <p className="text-xs text-red-500 dark:text-red-400 font-mono mt-1">{productosError}</p>
          </div>
        )}

        {/* Contenido */}
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-orange-400 dark:text-orange-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Sin productos cargados</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Esta lomitería aún no tiene productos. Presiona &quot;Nuevo producto&quot; para comenzar a cargar el menú.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((producto) => (
              <div
                key={producto.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3"
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
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">{producto.nombre}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setProductoToEdit(producto)}
                        className="rounded-lg p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition"
                        title="Editar producto"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
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
                  </div>

                  <p className="text-base font-bold text-orange-600 dark:text-orange-400 mt-1">
                    Gs. {producto.precio.toLocaleString('es-PY')}
                  </p>

                  <div className="flex items-center gap-1 mt-2">
                    <ChefHat className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
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
                  className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
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
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
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
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
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
              ¿Estás seguro que querés eliminar{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">&quot;{productoToDelete.nombre}&quot;</span>?
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setProductoToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition disabled:opacity-50"
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

      {/* Modal de eliminación de tenant */}
      {showDeleteTenantModal && tenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deletingTenant && setShowDeleteTenantModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            {/* Header con icono de advertencia */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Eliminar lomitería permanentemente</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Lista de lo que se eliminará */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Se eliminarán TODOS los datos de &quot;{tenant.nombre}&quot;:
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                <li>Todos los productos y categorías</li>
                <li>Todo el inventario y materias primas</li>
                <li>Todos los pedidos y clientes</li>
                <li>Todos los usuarios (cajeros y administradores)</li>
                <li>Todas las transacciones y puntos de lealtad</li>
                <li>Todas las promociones y configuraciones</li>
                <li>Las cuentas de autenticación de todos los usuarios</li>
              </ul>
            </div>

            {/* Campo de confirmación con nombre del tenant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Para confirmar, escribe: <span className="font-bold text-red-600 dark:text-red-400">{tenant.nombre}</span>
              </label>
              <input
                type="text"
                value={tenantNameConfirmation}
                onChange={(e) => setTenantNameConfirmation(e.target.value)}
                placeholder="Nombre del tenant"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                disabled={deletingTenant}
                autoComplete="off"
              />
            </div>

            {/* Mensaje de error */}
            {deleteTenantError && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {deleteTenantError}
              </p>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteTenantModal(false)
                  setTenantNameConfirmation('')
                  setDeleteTenantError(null)
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                disabled={deletingTenant}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTenant}
                disabled={deletingTenant || tenantNameConfirmation !== tenant.nombre}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingTenant ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar permanentemente'
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
      <CajerosModal
        open={showCajerosModal}
        onClose={() => setShowCajerosModal(false)}
        tenant={tenant}
      />
      <PrinterConfigModal
        open={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        tenant={tenant}
      />
      <EditProductoModal
        open={productoToEdit !== null}
        onClose={() => setProductoToEdit(null)}
        tenantId={tenant.id}
        producto={productoToEdit}
        onSaved={() => {
          setProductoToEdit(null)
          refreshProductos()
        }}
      />
    </>
  )
}
