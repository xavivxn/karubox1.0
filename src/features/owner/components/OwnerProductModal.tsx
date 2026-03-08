'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Image as ImageIcon, Loader2, ChefHat, Plus, Trash2 } from 'lucide-react'
import {
  listCategoriasOwner,
  listIngredientesOwner,
  listProductosOwner,
  createProductoOwner,
} from '@/app/actions/owner'

interface RecetaItem {
  ingrediente_id: string
  cantidad: number
  unidad: string
  obligatorio: boolean
}

interface OwnerProductModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  onSaved?: () => void
}

export function OwnerProductModal({ open, onClose, tenantId, onSaved }: OwnerProductModalProps) {
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [ingredientes, setIngredientes] = useState<{ id: string; nombre: string; unidad: string }[]>([])
  const [productos, setProductos] = useState<{ id: string; nombre: string }[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'receta'>('general')

  // Form fields
  const [tipoProducto, setTipoProducto] = useState<'con_receta' | 'combo' | 'sin_receta'>('con_receta')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [disponible, setDisponible] = useState(true)
  const [imagenUrl, setImagenUrl] = useState('')

  // Receta fields
  const [receta, setReceta] = useState<RecetaItem[]>([])
  const [selectedIngredienteId, setSelectedIngredienteId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [obligatorio, setObligatorio] = useState(true)

  // Combo fields
  const [comboItems, setComboItems] = useState<{ producto_id: string; cantidad: number }[]>([])
  const [selectedProductoId, setSelectedProductoId] = useState('')
  const [cantidadProducto, setCantidadProducto] = useState('')

  // Sin receta fields
  const [selectedIngredienteSinRecetaId, setSelectedIngredienteSinRecetaId] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      setLoadingData(true)
      try {
        const [catResult, ingResult, prodResult] = await Promise.all([
          listCategoriasOwner(tenantId),
          listIngredientesOwner(tenantId),
          listProductosOwner(tenantId),
        ])

        setCategorias(catResult.categorias)
        setIngredientes(ingResult.ingredientes)
        setProductos(prodResult.productos)

        if (catResult.categorias.length > 0) {
          setCategoriaId(catResult.categorias[0].id)
        }
      } catch {
        setErrorMessage('No se pudieron cargar los datos')
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [open, tenantId])

  useEffect(() => {
    if (!open) {
      setTipoProducto('con_receta')
      setNombre('')
      setDescripcion('')
      setPrecio('')
      setCategoriaId('')
      setDisponible(true)
      setImagenUrl('')
      setReceta([])
      setComboItems([])
      setSelectedIngredienteSinRecetaId('')
      setActiveTab('general')
      setSuccessMessage(null)
      setErrorMessage(null)
    }
  }, [open])

  const handleAddIngrediente = () => {
    if (!selectedIngredienteId || !cantidad || parseFloat(cantidad) <= 0) {
      setErrorMessage('Selecciona un ingrediente y especifica una cantidad válida')
      return
    }
    const ingrediente = ingredientes.find((i) => i.id === selectedIngredienteId)
    if (!ingrediente) return
    if (receta.some((r) => r.ingrediente_id === selectedIngredienteId)) {
      setErrorMessage('Este ingrediente ya está en la receta')
      return
    }
    setReceta([
      ...receta,
      {
        ingrediente_id: selectedIngredienteId,
        cantidad: parseFloat(cantidad),
        unidad: ingrediente.unidad,
        obligatorio,
      },
    ])
    setSelectedIngredienteId('')
    setCantidad('')
    setObligatorio(true)
    setErrorMessage(null)
  }

  const handleRemoveIngrediente = (ingredienteId: string) => {
    setReceta(receta.filter((r) => r.ingrediente_id !== ingredienteId))
  }

  const handleAddProducto = () => {
    if (!selectedProductoId || !cantidadProducto || parseFloat(cantidadProducto) <= 0) {
      setErrorMessage('Selecciona un producto y especifica una cantidad válida')
      return
    }
    if (comboItems.some((c) => c.producto_id === selectedProductoId)) {
      setErrorMessage('Este producto ya está en el combo')
      return
    }
    setComboItems([
      ...comboItems,
      { producto_id: selectedProductoId, cantidad: parseFloat(cantidadProducto) },
    ])
    setSelectedProductoId('')
    setCantidadProducto('')
    setErrorMessage(null)
  }

  const handleRemoveProducto = (productoId: string) => {
    setComboItems(comboItems.filter((c) => c.producto_id !== productoId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSaving(true)

    const result = await createProductoOwner(tenantId, {
      nombre,
      descripcion,
      precio: parseFloat(precio),
      categoria_id: categoriaId,
      disponible,
      imagen_url: imagenUrl,
      tipo: tipoProducto,
      receta: tipoProducto === 'con_receta' ? receta : undefined,
      combo_items: tipoProducto === 'combo' ? comboItems : undefined,
      inventario_id: tipoProducto === 'sin_receta' ? selectedIngredienteSinRecetaId : undefined,
    })

    setIsSaving(false)

    if (result.error) {
      setErrorMessage(result.error)
      return
    }

    setSuccessMessage(
      `¡${tipoProducto === 'combo' ? 'Combo' : 'Producto'} "${result.producto?.nombre}" creado exitosamente!`
    )
    setTimeout(() => {
      onSaved?.()
      onClose()
    }, 1500)
  }

  if (!open || !mounted) return null

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent outline-none transition disabled:opacity-50'

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cargar Producto POS</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Productos con receta, combos o sin receta para el menú</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 dark:border-gray-700 px-6">
          <div className="flex gap-1">
            {(['general', 'receta'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-semibold text-sm transition-colors relative flex items-center gap-2 ${
                  activeTab === tab
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'receta' && <ChefHat className="w-4 h-4" />}
                {tab === 'general' ? 'Información General' : tipoProducto === 'combo' ? 'Items del Combo' : tipoProducto === 'sin_receta' ? 'Materia Prima' : 'Receta'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 dark:bg-orange-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-700">
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-700">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{successMessage}</p>
            </div>
          )}

          <form id="owner-product-form" onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'general' && (
              <>
                {/* Tipo de producto */}
                <div className="space-y-4 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    ¿Qué vas a crear?
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="relative flex cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 p-4 hover:border-orange-500 dark:hover:border-orange-400 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:border-orange-400 dark:has-[:checked]:bg-orange-900/30">
                      <input
                        type="radio"
                        value="con_receta"
                        checked={tipoProducto === 'con_receta'}
                        onChange={(e) => setTipoProducto(e.target.value as 'con_receta')}
                        disabled={isSaving}
                        className="peer sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Producto con Receta</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fabricado a partir de materias primas</p>
                      </div>
                    </label>
                    <label className="relative flex cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 p-4 hover:border-orange-500 dark:hover:border-orange-400 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:border-orange-400 dark:has-[:checked]:bg-orange-900/30">
                      <input
                        type="radio"
                        value="combo"
                        checked={tipoProducto === 'combo'}
                        onChange={(e) => setTipoProducto(e.target.value as 'combo')}
                        disabled={isSaving}
                        className="peer sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Combo</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agrupaci&oacute;n de productos existentes</p>
                      </div>
                    </label>
                    <label className="relative flex cursor-pointer rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 p-4 hover:border-orange-500 dark:hover:border-orange-400 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:border-orange-400 dark:has-[:checked]:bg-orange-900/30">
                      <input
                        type="radio"
                        value="sin_receta"
                        checked={tipoProducto === 'sin_receta'}
                        onChange={(e) => setTipoProducto(e.target.value as 'sin_receta')}
                        disabled={isSaving}
                        className="peer sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Producto sin receta</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vinculado a un item del inventario</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Nombre */}
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
                    className={inputClass}
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
                    className={`${inputClass} resize-none`}
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
                      className={inputClass}
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label htmlFor="categoria" className="block text-sm font-semibold mb-2">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    {loadingData ? (
                      <div className="flex items-center justify-center h-12 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <select
                        id="categoria"
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                        disabled={isSaving}
                        className={inputClass}
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
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      id="imagen"
                      type="url"
                      value={imagenUrl}
                      onChange={(e) => setImagenUrl(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      disabled={isSaving}
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* Disponibilidad */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                  <input
                    id="disponible"
                    type="checkbox"
                    checked={disponible}
                    onChange={(e) => setDisponible(e.target.checked)}
                    disabled={isSaving}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 disabled:opacity-50"
                  />
                  <label htmlFor="disponible" className="text-sm font-semibold cursor-pointer select-none">
                    Producto disponible para la venta
                  </label>
                </div>
              </>
            )}

            {activeTab === 'receta' && (
              <div className="space-y-6">
                {tipoProducto === 'con_receta' ? (
                  <>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-700">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Define qué ingredientes lleva este producto y en qué cantidad
                      </p>
                    </div>

                    {/* Agregar ingrediente */}
                    <div className="space-y-4 p-5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                      <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Agregar ingrediente</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label htmlFor="ingrediente" className="block text-sm font-medium mb-2">
                            Ingrediente
                          </label>
                          {loadingData ? (
                            <div className="flex items-center justify-center h-12 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                          ) : (
                            <select
                              id="ingrediente"
                              value={selectedIngredienteId}
                              onChange={(e) => setSelectedIngredienteId(e.target.value)}
                              disabled={isSaving}
                              className={inputClass}
                            >
                              <option value="">Seleccionar ingrediente</option>
                              {ingredientes
                                .filter((ing) => !receta.some((r) => r.ingrediente_id === ing.id))
                                .map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.nombre} ({ing.unidad})
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label htmlFor="cantidad" className="block text-sm font-medium mb-2">
                            Cantidad
                          </label>
                          <input
                            id="cantidad"
                            type="number"
                            step="0.01"
                            min="0"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            placeholder="0"
                            disabled={isSaving}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          id="obligatorio"
                          type="checkbox"
                          checked={obligatorio}
                          onChange={(e) => setObligatorio(e.target.checked)}
                          disabled={isSaving}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 disabled:opacity-50"
                        />
                        <label htmlFor="obligatorio" className="text-sm cursor-pointer select-none">
                          Ingrediente obligatorio (no se puede remover)
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddIngrediente}
                        disabled={isSaving || !selectedIngredienteId || !cantidad}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition disabled:opacity-50"
                      >
                        <Plus className="w-5 h-5" />
                        Agregar a la receta
                      </button>
                    </div>

                    {/* Lista de ingredientes */}
                    {receta.length > 0 ? (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                          Ingredientes de la receta ({receta.length})
                        </h3>
                        <div className="space-y-2">
                          {receta.map((item) => {
                            const ingrediente = ingredientes.find((i) => i.id === item.ingrediente_id)
                            return (
                              <div
                                key={item.ingrediente_id}
                                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700"
                              >
                                <div className="flex items-center gap-3">
                                  <ChefHat className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                  <div>
                                    <p className="font-semibold text-sm">{ingrediente?.nombre}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.cantidad} {item.unidad}{' '}
                                      {item.obligatorio ? '• Obligatorio' : '• Opcional'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngrediente(item.ingrediente_id)}
                                  disabled={isSaving}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition disabled:opacity-50"
                                  aria-label="Eliminar ingrediente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No hay ingredientes en la receta</p>
                      </div>
                    )}
                  </>
                ) : tipoProducto === 'combo' ? (
                  <>
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-700">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Selecciona los productos que incluye este combo
                      </p>
                    </div>

                    {/* Agregar producto al combo */}
                    <div className="space-y-4 p-5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                      <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Agregar producto</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label htmlFor="producto" className="block text-sm font-medium mb-2">
                            Producto
                          </label>
                          {loadingData ? (
                            <div className="flex items-center justify-center h-12 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                          ) : (
                            <select
                              id="producto"
                              value={selectedProductoId}
                              onChange={(e) => setSelectedProductoId(e.target.value)}
                              disabled={isSaving}
                              className={inputClass}
                            >
                              <option value="">Seleccionar producto</option>
                              {productos
                                .filter((p) => !comboItems.some((c) => c.producto_id === p.id))
                                .map((prod) => (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.nombre}
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label htmlFor="cantidadProducto" className="block text-sm font-medium mb-2">
                            Cantidad
                          </label>
                          <input
                            id="cantidadProducto"
                            type="number"
                            step="1"
                            min="1"
                            value={cantidadProducto}
                            onChange={(e) => setCantidadProducto(e.target.value)}
                            placeholder="1"
                            disabled={isSaving}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddProducto}
                        disabled={isSaving || !selectedProductoId || !cantidadProducto}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition disabled:opacity-50"
                      >
                        <Plus className="w-5 h-5" />
                        Agregar al combo
                      </button>
                    </div>

                    {/* Lista de productos del combo */}
                    {comboItems.length > 0 ? (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                          Productos del combo ({comboItems.length})
                        </h3>
                        <div className="space-y-2">
                          {comboItems.map((item) => {
                            const producto = productos.find((p) => p.id === item.producto_id)
                            return (
                              <div
                                key={item.producto_id}
                                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700"
                              >
                                <div className="flex items-center gap-3">
                                  <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                  <div>
                                    <p className="font-semibold text-sm">{producto?.nombre}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Cantidad: {item.cantidad}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProducto(item.producto_id)}
                                  disabled={isSaving}
                                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition disabled:opacity-50"
                                  aria-label="Eliminar producto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No hay productos en el combo</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-700">
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        Selecciona la materia prima que corresponde a este producto
                      </p>
                    </div>

                    <div className="space-y-4 p-5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                      <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Materia prima</h3>
                      {loadingData ? (
                        <div className="flex items-center justify-center h-12 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      ) : ingredientes.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No hay materias primas registradas</p>
                          <p className="text-xs mt-1">Registra materias primas primero usando &quot;Registrar inventario&quot;</p>
                        </div>
                      ) : (
                        <select
                          value={selectedIngredienteSinRecetaId}
                          onChange={(e) => setSelectedIngredienteSinRecetaId(e.target.value)}
                          disabled={isSaving}
                          className={inputClass}
                        >
                          <option value="">Seleccionar materia prima</option>
                          {ingredientes.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.nombre} ({ing.unidad})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {selectedIngredienteSinRecetaId && (
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                          <div>
                            <p className="font-semibold text-sm">
                              {ingredientes.find((i) => i.id === selectedIngredienteSinRecetaId)?.nombre}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Unidad: {ingredientes.find((i) => i.id === selectedIngredienteSinRecetaId)?.unidad}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="owner-product-form"
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
