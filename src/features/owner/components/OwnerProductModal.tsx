'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Image as ImageIcon, Loader2, ChefHat, Plus, Trash2, Layers, Box, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  listCategoriasOwner,
  listIngredientesOwner,
  listProductosOwner,
  createProductoOwner,
} from '@/app/actions/owner'
import { calcularPuntosAutomaticos, normalizePuntosRetornoPct } from '@/features/pos/utils/pos.utils'
import { useTenant } from '@/contexts/TenantContext'
import { calcularPuntos } from '@/features/pos/utils/pos.utils'

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
  const { tenant } = useTenant()
  const retornoPct = normalizePuntosRetornoPct(
    tenant?.id === tenantId ? tenant.puntos_retorno_pct : undefined
  )
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [ingredientes, setIngredientes] = useState<{ id: string; nombre: string; unidad: string }[]>([])
  const [productos, setProductos] = useState<{ id: string; nombre: string }[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Form fields
  const [tipoProducto, setTipoProducto] = useState<'con_receta' | 'combo' | 'sin_receta'>('con_receta')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [disponible, setDisponible] = useState(true)
  const [imagenUrl, setImagenUrl] = useState('')
  const [puntosExtra, setPuntosExtra] = useState<number>(0)

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
      setPuntosExtra(0)
      setReceta([])
      setComboItems([])
      setSelectedIngredienteSinRecetaId('')
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

  const toTitleCase = (str: string): string =>
    str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

  const formatGuaranies = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSaving(true)

    const result = await createProductoOwner(tenantId, {
      nombre,
      descripcion,
      precio: parseInt(precio.replace(/\./g, ''), 10) || 0,
      categoria_id: categoriaId,
      disponible,
      imagen_url: imagenUrl,
      puntos_extra: puntosExtra,
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
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition disabled:opacity-50'

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/40 shrink-0">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Cargar Producto POS</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Productos con receta, combos o sin receta para el men&uacute;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>


        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/60 p-3.5">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/60 p-3.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{successMessage}</p>
            </div>
          )}

          <form id="owner-product-form" onSubmit={handleSubmit} className="space-y-5">

            {/* ── Sección 1: Tipo de producto ── */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shrink-0">1</span>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Tipo de producto</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="group relative flex cursor-pointer gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 hover:border-orange-400 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
                  <input type="radio" value="con_receta" checked={tipoProducto === 'con_receta'} onChange={(e) => setTipoProducto(e.target.value as 'con_receta')} disabled={isSaving} className="peer sr-only" />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 group-has-[:checked]:bg-orange-100 dark:group-has-[:checked]:bg-orange-900/40 transition">
                    <ChefHat className="h-4 w-4 text-gray-500 dark:text-gray-400 group-has-[:checked]:text-orange-600 dark:group-has-[:checked]:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Con Receta</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">A partir de materias primas</p>
                  </div>
                </label>
                <label className="group relative flex cursor-pointer gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 hover:border-orange-400 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
                  <input type="radio" value="sin_receta" checked={tipoProducto === 'sin_receta'} onChange={(e) => setTipoProducto(e.target.value as 'sin_receta')} disabled={isSaving} className="peer sr-only" />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 group-has-[:checked]:bg-orange-100 dark:group-has-[:checked]:bg-orange-900/40 transition">
                    <Box className="h-4 w-4 text-gray-500 dark:text-gray-400 group-has-[:checked]:text-orange-600 dark:group-has-[:checked]:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Sin Receta</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Vinculado a inventario</p>
                  </div>
                </label>
                <label className="group relative flex cursor-pointer gap-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 hover:border-orange-400 dark:hover:border-orange-500 transition has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/20">
                  <input type="radio" value="combo" checked={tipoProducto === 'combo'} onChange={(e) => setTipoProducto(e.target.value as 'combo')} disabled={isSaving} className="peer sr-only" />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 group-has-[:checked]:bg-orange-100 dark:group-has-[:checked]:bg-orange-900/40 transition">
                    <Layers className="h-4 w-4 text-gray-500 dark:text-gray-400 group-has-[:checked]:text-orange-600 dark:group-has-[:checked]:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Combo</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Agrupa productos existentes</p>
                  </div>
                </label>
              </div>
            </section>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

            {/* ── Sección 2: Receta / Combo / Materia Prima (contextual) ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shrink-0">2</span>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  {tipoProducto === 'combo' ? 'Items del Combo' : tipoProducto === 'sin_receta' ? 'Materia Prima' : 'Receta'}
                </h3>
                {(receta.length > 0 || comboItems.length > 0) && (
                  <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                    {tipoProducto === 'combo' ? comboItems.length : receta.length}
                  </span>
                )}
              </div>

              {tipoProducto === 'con_receta' && (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 px-3.5 py-2.5">
                    <ChefHat className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Define qu&eacute; ingredientes lleva este producto y en qu&eacute; cantidad</p>
                  </div>
                  <div className="space-y-4 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label htmlFor="ingrediente" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Ingrediente</label>
                        {loadingData ? (
                          <div className="flex items-center justify-center h-[42px] rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <select id="ingrediente" value={selectedIngredienteId} onChange={(e) => setSelectedIngredienteId(e.target.value)} disabled={isSaving} className={inputClass}>
                            <option value="">Seleccionar ingrediente</option>
                            {ingredientes.filter((ing) => !receta.some((r) => r.ingrediente_id === ing.id)).map((ing) => (
                              <option key={ing.id} value={ing.id}>{ing.nombre} ({ing.unidad})</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label htmlFor="cantidad" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
                        <input id="cantidad" type="number" step="0.01" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0" disabled={isSaving} className={inputClass} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input id="obligatorio" type="checkbox" checked={obligatorio} onChange={(e) => setObligatorio(e.target.checked)} disabled={isSaving} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 disabled:opacity-50" />
                      <label htmlFor="obligatorio" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">Ingrediente obligatorio (no se puede remover)</label>
                    </div>
                    <button type="button" onClick={handleAddIngrediente} disabled={isSaving || !selectedIngredienteId || !cantidad} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                      Agregar a la receta
                    </button>
                  </div>
                  {receta.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ingredientes ({receta.length})</p>
                      {receta.map((item) => {
                        const ing = ingredientes.find((i) => i.id === item.ingrediente_id)
                        return (
                          <div key={item.ingrediente_id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <ChefHat className="w-4 h-4 text-gray-400 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{ing?.nombre}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.cantidad} {item.unidad} &bull; {item.obligatorio ? 'Obligatorio' : 'Opcional'}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveIngrediente(item.ingrediente_id)} disabled={isSaving} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition disabled:opacity-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-gray-400 dark:text-gray-500">
                      <ChefHat className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs">Sin ingredientes a&uacute;n</p>
                    </div>
                  )}
                </>
              )}

              {tipoProducto === 'combo' && (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/60 px-3.5 py-2.5">
                    <Layers className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Selecciona los productos que incluye este combo</p>
                  </div>
                  <div className="space-y-4 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label htmlFor="producto" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Producto</label>
                        {loadingData ? (
                          <div className="flex items-center justify-center h-[42px] rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <select id="producto" value={selectedProductoId} onChange={(e) => setSelectedProductoId(e.target.value)} disabled={isSaving} className={inputClass}>
                            <option value="">Seleccionar producto</option>
                            {productos.filter((p) => !comboItems.some((c) => c.producto_id === p.id)).map((prod) => (
                              <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label htmlFor="cantidadProducto" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
                        <input id="cantidadProducto" type="number" step="1" min="1" value={cantidadProducto} onChange={(e) => setCantidadProducto(e.target.value)} placeholder="1" disabled={isSaving} className={inputClass} />
                      </div>
                    </div>
                    <button type="button" onClick={handleAddProducto} disabled={isSaving || !selectedProductoId || !cantidadProducto} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                      Agregar al combo
                    </button>
                  </div>
                  {comboItems.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Productos ({comboItems.length})</p>
                      {comboItems.map((item) => {
                        const prod = productos.find((p) => p.id === item.producto_id)
                        return (
                          <div key={item.producto_id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-gray-400 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{prod?.nombre}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Cantidad: {item.cantidad}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveProducto(item.producto_id)} disabled={isSaving} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 transition disabled:opacity-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-gray-400 dark:text-gray-500">
                      <Package className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs">Sin productos en el combo a&uacute;n</p>
                    </div>
                  )}
                </>
              )}

              {tipoProducto === 'sin_receta' && (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/60 px-3.5 py-2.5">
                    <Box className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Selecciona la materia prima que corresponde a este producto</p>
                  </div>
                  {loadingData ? (
                    <div className="flex items-center justify-center h-[42px] rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  ) : ingredientes.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-gray-400 dark:text-gray-500">
                      <Package className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-xs">No hay materias primas registradas</p>
                      <p className="text-[11px] mt-0.5">Registr&aacute; primero usando &quot;Registrar inventario&quot;</p>
                    </div>
                  ) : (
                    <select value={selectedIngredienteSinRecetaId} onChange={(e) => setSelectedIngredienteSinRecetaId(e.target.value)} disabled={isSaving} className={inputClass}>
                      <option value="">Seleccionar materia prima</option>
                      {ingredientes.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.nombre} ({ing.unidad})</option>
                      ))}
                    </select>
                  )}
                  {selectedIngredienteSinRecetaId && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <Package className="w-4 h-4 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ingredientes.find((i) => i.id === selectedIngredienteSinRecetaId)?.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Unidad: {ingredientes.find((i) => i.id === selectedIngredienteSinRecetaId)?.unidad}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

            {/* ── Sección 3: Información ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shrink-0">3</span>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Informaci&oacute;n</h3>
              </div>
              <div>
                <label htmlFor="nombre" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del producto <span className="text-orange-500">*</span>
                </label>
                <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(toTitleCase(e.target.value))} placeholder="Ej: Hamburguesa Clásica" disabled={isSaving} className={inputClass} />
              </div>
              <div>
                <label htmlFor="descripcion" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripci&oacute;n <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Medallón 120g con papas fritas y bebida" rows={2} disabled={isSaving} className={`${inputClass} resize-none`} />
              </div>
            </section>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

            {/* ── Sección 4: Precio, Categoría y Puntos ── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shrink-0">4</span>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Precio, categor&iacute;a y puntos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="precio" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Precio <span className="text-orange-500">*</span>
                  </label>
                  <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition">
                    <span className="flex items-center px-3.5 text-sm font-semibold text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60 select-none whitespace-nowrap">Gs.</span>
                    <input id="precio" type="text" inputMode="numeric" value={precio} onChange={(e) => setPrecio(formatGuaranies(e.target.value))} placeholder="0" disabled={isSaving} className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label htmlFor="categoria" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categor&iacute;a <span className="text-orange-500">*</span>
                  </label>
                  {loadingData ? (
                    <div className="flex items-center justify-center h-[42px] rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <select id="categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} disabled={isSaving} className={inputClass}>
                      <option value="">Seleccionar categor&iacute;a</option>
                      {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Puntos extra bonus por unidad */}
              <div className="rounded-xl border border-yellow-200 dark:border-yellow-700/40 bg-yellow-50 dark:bg-yellow-900/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-base">⭐</span>
                  <label htmlFor="puntos_extra" className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    Puntos bonus por unidad vendida
                  </label>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">(opcional)</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Además de la acumulación automática ({retornoPct}% del total del pedido, configurable en Clientes), podés
                  asignar puntos extra para incentivar este producto.
                </p>
                <div className="flex rounded-xl border border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-400/20 transition">
                  <span className="flex items-center px-3.5 text-sm font-semibold text-yellow-600 border-r border-yellow-200 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 select-none whitespace-nowrap">pts</span>
                  <input
                    id="puntos_extra"
                    type="number"
                    min={0}
                    step={1}
                    value={puntosExtra}
                    onChange={(e) => setPuntosExtra(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    disabled={isSaving}
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
                {puntosExtra > 0 && (
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                    Este producto dará {puntosExtra} pts bonus + automáticos por precio (≈{' '}
                    {calcularPuntosAutomaticos(
                      parseInt(precio.replace(/\./g, ''), 10) || 0,
                      retornoPct
                    )}{' '}
                    pts si el pedido fuera solo 1× esta unidad a este precio).
                  </p>
                )}
              </div>
            </section>

            {/* Imagen + Disponible */}
            <div>
              <label htmlFor="imagen" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                URL de imagen <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition">
                <span className="flex items-center px-3.5 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                </span>
                <input id="imagen" type="url" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" disabled={isSaving} className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <div className="relative">
                <input id="disponible" type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} disabled={isSaving} className="sr-only peer" />
                <div className="h-5 w-9 rounded-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-orange-500 peer-disabled:opacity-50 transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Disponible para la venta</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">El producto aparece habilitado en el POS</p>
              </div>
            </label>

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
