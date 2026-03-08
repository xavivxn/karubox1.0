'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, UserPlus, Loader2 } from 'lucide-react'
import { createUsuarioTenantOwner } from '@/app/actions/owner'
import type { TenantUserRole } from '@/app/actions/owner'

const ROLE_CONFIG: Record<TenantUserRole, { titulo: string; subtitulo: string; nota: string; placeholder: string; boton: string; exito: string }> = {
  admin: {
    titulo: 'Nuevo Administrador',
    subtitulo: 'Credenciales de acceso al panel',
    nota: 'El administrador podrá iniciar sesión con estas credenciales y tendrá acceso completo al dashboard, POS y administración de esta lomitería.',
    placeholder: 'admin@ejemplo.com',
    boton: 'Crear administrador',
    exito: 'Administrador creado exitosamente',
  },
  cajero: {
    titulo: 'Nuevo Cajero',
    subtitulo: 'Credenciales de acceso al POS',
    nota: 'El cajero podrá iniciar sesión con estas credenciales y tendrá acceso únicamente al Punto de Venta de esta lomitería.',
    placeholder: 'cajero@ejemplo.com',
    boton: 'Crear cajero',
    exito: 'Cajero creado exitosamente',
  },
}

interface UsuarioFormModalProps {
  open: boolean
  onClose: () => void
  tenantId: string
  rol: TenantUserRole
  onSaved?: () => void
}

export function UsuarioFormModal({ open, onClose, tenantId, rol, onSaved }: UsuarioFormModalProps) {
  const [mounted, setMounted] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const config = ROLE_CONFIG[rol]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setNombre('')
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(null)
    }
  }, [open])

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)

    if (!nombre.trim()) return setError('El nombre es requerido')
    if (!email.trim()) return setError('El email es requerido')
    if (!password || password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')

    setSaving(true)
    const result = await createUsuarioTenantOwner(tenantId, rol, {
      nombre: nombre.trim(),
      email: email.trim(),
      password,
    })
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(`${config.exito}. Email: ${result.email}`)
    setTimeout(() => {
      onSaved?.()
      onClose()
    }, 1500)
  }

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{config.titulo}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">{config.subtitulo}</p>
            </div>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={config.placeholder}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 text-sm"
            />
          </div>

          {/* Nota informativa */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3">
            <p className="text-xs text-orange-700 dark:text-orange-400">{config.nota}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3 rounded-b-2xl">
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {config.boton}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
