'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Tag, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CategoriaModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  onSaved?: () => void
}

export function CategoriaModal({ open, onClose, tenantId, onSaved }: CategoriaModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [orden, setOrden] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setNombre('')
      setDescripcion('')
      setOrden('')
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [open])

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
          activa: true
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
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2.5">
              <Tag className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Nueva Categoría
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Agrupa productos del menú bajo una categoría
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
              onChange={(e) => setNombre(e.target.value)}
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
        </form>

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
                'Crear categoría'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
