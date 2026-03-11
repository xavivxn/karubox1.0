'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Tag, Loader2, Pencil, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CategoriaModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  onSaved?: () => void
}

interface CategoriaExistente {
  id: string
  nombre: string
  descripcion: string | null
  orden: number
  activa: boolean
}

interface EditState {
  nombre: string
  descripcion: string
  orden: string
}

export function CategoriaModal({ open, onClose, tenantId, onSaved }: CategoriaModalProps) {
  const [activeTab, setActiveTab] = useState<'existentes' | 'nueva'>('existentes')
  const [mounted, setMounted] = useState(false)

  // Nueva categoría state
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [orden, setOrden] = useState('')

  // Categorías existentes state
  const [categorias, setCategorias] = useState<CategoriaExistente[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editStates, setEditStates] = useState<Record<string, EditState>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editError, setEditError] = useState<Record<string, string>>({})
  const [editSuccess, setEditSuccess] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadCategorias = async () => {
    setLoadingCategorias(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre, descripcion, orden, activa')
        .eq('tenant_id', tenantId)
        .order('orden', { ascending: true })
      if (error) throw error
      setCategorias(data ?? [])
    } catch {
      // silently fail; user can retry by switching tabs
    } finally {
      setLoadingCategorias(false)
    }
  }

  useEffect(() => {
    if (!open) {
      setNombre('')
      setDescripcion('')
      setOrden('')
      setErrorMessage(null)
      setSuccessMessage(null)
      setExpandedId(null)
      setEditStates({})
      setEditError({})
      setEditSuccess(null)
      setCategorias([])
      setActiveTab('existentes')
    } else {
      loadCategorias()
    }
  }, [open])

  const handleExpand = (cat: CategoriaExistente) => {
    if (expandedId === cat.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(cat.id)
    if (!editStates[cat.id]) {
      setEditStates((prev) => ({
        ...prev,
        [cat.id]: {
          nombre: cat.nombre,
          descripcion: cat.descripcion ?? '',
          orden: String(cat.orden),
        },
      }))
    }
  }

  const capitalizeFirst = (value: string) =>
    value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1)

  const handleEditChange = (id: string, field: keyof EditState, value: string) => {
    const processed = field === 'nombre' ? capitalizeFirst(value) : value
    setEditStates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: processed } }))
    setEditError((prev) => ({ ...prev, [id]: '' }))
  }

  const handleSaveEdit = async (cat: CategoriaExistente) => {
    const state = editStates[cat.id]
    if (!state) return

    if (!state.nombre.trim()) {
      setEditError((prev) => ({ ...prev, [cat.id]: 'El nombre es obligatorio' }))
      return
    }

    setSavingId(cat.id)
    setEditSuccess(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categorias')
        .update({
          nombre: state.nombre.trim(),
          descripcion: state.descripcion.trim() || null,
          orden: parseInt(state.orden) || 0,
        })
        .eq('id', cat.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      setCategorias((prev) =>
        prev
          .map((c) =>
            c.id === cat.id
              ? {
                  ...c,
                  nombre: state.nombre.trim(),
                  descripcion: state.descripcion.trim() || null,
                  orden: parseInt(state.orden) || 0,
                }
              : c
          )
          .sort((a, b) => a.orden - b.orden)
      )
      setEditSuccess(`Categoría "${state.nombre.trim()}" actualizada`)
      setExpandedId(null)
      onSaved?.()
      setTimeout(() => setEditSuccess(null), 2500)
    } catch (err: any) {
      setEditError((prev) => ({ ...prev, [cat.id]: err.message || 'Error al guardar' }))
    } finally {
      setSavingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!nombre.trim()) {
      setErrorMessage('El nombre de la categoría es obligatorio')
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('categorias')
        .insert({
          tenant_id: tenantId,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          orden: parseInt(orden) || 0,
          activa: true,
        })

      if (error) throw error

      setSuccessMessage(`Categoría "${nombre.trim()}" creada exitosamente`)

      setTimeout(() => {
        onSaved?.()
        onClose()
      }, 1200)
    } catch (error: any) {
      console.error('Error al crear categoría:', error)
      setErrorMessage(error.message || 'Error al crear la categoría')
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) return null
  if (!open) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white dark:bg-gray-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2.5">
              <Tag className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Categorías
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Gestiona las categorías del menú
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 shrink-0">
          <button
            onClick={() => setActiveTab('existentes')}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'existentes'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Categorías existentes
          </button>
          <button
            onClick={() => setActiveTab('nueva')}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'nueva'
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Nueva categoría
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {/* Tab: Existentes */}
          {activeTab === 'existentes' && (
            <div className="px-6 py-5 space-y-3">
              {editSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{editSuccess}</p>
                </div>
              )}

              {loadingCategorias ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : categorias.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No hay categorías creadas aún
                </div>
              ) : (
                categorias.map((cat) => {
                  const isExpanded = expandedId === cat.id
                  const state = editStates[cat.id]
                  const isSavingThis = savingId === cat.id
                  const err = editError[cat.id]

                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      {/* Row header */}
                      <button
                        type="button"
                        onClick={() => handleExpand(cat)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-bold shrink-0">
                            {cat.orden}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white truncate">
                            {cat.nombre}
                          </span>
                          {cat.descripcion && (
                            <span className="hidden sm:block text-xs text-gray-400 truncate">
                              — {cat.descripcion}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Pencil className="h-3.5 w-3.5 text-gray-400" />
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Edit form */}
                      {isExpanded && state && (
                        <div className="px-4 py-4 space-y-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                          {err && (
                            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3">
                              <p className="text-sm font-medium text-red-800 dark:text-red-300">{err}</p>
                            </div>
                          )}

                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                              Nombre *
                            </label>
                            <input
                              type="text"
                              value={state.nombre}
                              onChange={(e) => handleEditChange(cat.id, 'nombre', e.target.value)}
                              disabled={isSavingThis}
                              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                              Descripción
                            </label>
                            <textarea
                              value={state.descripcion}
                              onChange={(e) => handleEditChange(cat.id, 'descripcion', e.target.value)}
                              rows={2}
                              disabled={isSavingThis}
                              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 resize-none"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                              Orden de aparición
                            </label>
                            <input
                              type="number"
                              value={state.orden}
                              onChange={(e) => handleEditChange(cat.id, 'orden', e.target.value)}
                              min="0"
                              step="1"
                              disabled={isSavingThis}
                              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                            />
                            <p className="mt-1 text-xs text-gray-400">Número menor = aparece primero</p>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(cat)}
                              disabled={isSavingThis}
                              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
                            >
                              {isSavingThis ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Guardar cambios
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Tab: Nueva */}
          {activeTab === 'nueva' && (
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
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

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre de la categoría *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(capitalizeFirst(e.target.value))}
                  placeholder="Ej: Hamburguesas, Bebidas, Postres"
                  required
                  disabled={isSaving}
                  autoFocus
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Breve descripción de la categoría"
                  rows={2}
                  disabled={isSaving}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Orden de aparición (opcional)
                </label>
                <input
                  type="number"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  disabled={isSaving}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1.5 text-xs text-gray-400">Número menor = aparece primero en el menú</p>
              </div>

              {/* Footer inline for this tab */}
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
                    'Crear categoría'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
