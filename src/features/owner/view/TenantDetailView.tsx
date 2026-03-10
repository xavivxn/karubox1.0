'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Mail, Phone, MapPin, Building2, FileText, Globe, Pencil, X } from 'lucide-react'
import { updateTenant } from '@/app/actions/owner'
import { ROUTES } from '@/config/routes'

interface TenantDetail {
  id: string
  nombre: string
  slug: string
  ruc: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  logo_url: string | null
  activo: boolean
  created_at: string
}

interface TenantDetailViewProps {
  tenant: TenantDetail
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 focus:outline-none transition bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export function TenantDetailView({ tenant }: TenantDetailViewProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    nombre: tenant.nombre,
    ruc: tenant.ruc ?? '',
    email: tenant.email ?? '',
    telefono: tenant.telefono ?? '',
    direccion: tenant.direccion ?? '',
    logo_url: tenant.logo_url ?? '',
  })

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCancel = () => {
    setForm({
      nombre: tenant.nombre,
      ruc: tenant.ruc ?? '',
      email: tenant.email ?? '',
      telefono: tenant.telefono ?? '',
      direccion: tenant.direccion ?? '',
      logo_url: tenant.logo_url ?? '',
    })
    setEditing(false)
    setError('')
    setSuccess('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.nombre.trim()) {
      setError('El nombre del negocio es requerido')
      return
    }

    setSaving(true)
    const result = await updateTenant(tenant.id, {
      nombre: form.nombre,
      ruc: form.ruc,
      email: form.email,
      telefono: form.telefono,
      direccion: form.direccion,
      logo_url: form.logo_url,
    })
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess('Datos actualizados correctamente')
    setEditing(false)
    router.refresh()
  }

  const fechaCreacion = new Date(tenant.created_at).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const hasContactInfo = tenant.email || tenant.telefono || tenant.direccion

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(ROUTES.PROTECTED.OWNER)}
          className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-blue-500 dark:text-blue-400 font-medium">
            Detalle del negocio
          </p>
          <div className="flex items-center gap-3">
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt={`Logo de ${tenant.nombre}`}
                className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 truncate">{tenant.nombre}</h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">/{tenant.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Card principal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Información del negocio</h2>
          {!editing ? (
            <button
              onClick={() => { setEditing(true); setSuccess('') }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          )}
        </div>

        {editing ? (
          /* Modo edición */
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div>
              <label htmlFor="edit-nombre" className={labelClass}>
                Nombre del negocio
              </label>
              <input
                id="edit-nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                required
                className={inputClass}
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="edit-ruc" className={labelClass}>
                RUC
              </label>
              <input
                id="edit-ruc"
                type="text"
                value={form.ruc}
                onChange={(e) => setField('ruc', e.target.value)}
                className={inputClass}
                placeholder="80012345-6"
                disabled={saving}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Datos de contacto
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className={inputClass}
                    placeholder="contacto@lomiteria.com"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label htmlFor="edit-telefono" className={labelClass}>
                    Teléfono
                  </label>
                  <input
                    id="edit-telefono"
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setField('telefono', e.target.value)}
                    className={inputClass}
                    placeholder="0981 123 456"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label htmlFor="edit-direccion" className={labelClass}>
                    Dirección
                  </label>
                  <input
                    id="edit-direccion"
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setField('direccion', e.target.value)}
                    className={inputClass}
                    placeholder="Av. Eusebio Ayala 1234, Asunción"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label htmlFor="edit-logo_url" className={labelClass}>
                    URL del logo
                  </label>
                  <input
                    id="edit-logo_url"
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => setField('logo_url', e.target.value)}
                    className={inputClass}
                    placeholder="https://ejemplo.com/logo.png"
                    disabled={saving}
                  />
                  {form.logo_url && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={form.logo_url}
                        alt="Preview del logo"
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500">Vista previa</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </form>
        ) : (
          /* Modo visualización */
          <div className="p-6 space-y-5">
            {/* Datos generales */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Nombre</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.nombre}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Slug</p>
                  <p className="text-sm font-medium font-mono text-gray-900 dark:text-gray-100">/{tenant.slug}</p>
                </div>
              </div>

              {tenant.ruc && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">RUC</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.ruc}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Datos de contacto */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Datos de contacto
              </p>
              {hasContactInfo ? (
                <div className="space-y-3">
                  {tenant.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.email}</p>
                      </div>
                    </div>
                  )}
                  {tenant.telefono && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Teléfono</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.telefono}</p>
                      </div>
                    </div>
                  )}
                  {tenant.direccion && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Dirección</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.direccion}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  No se registraron datos de contacto. Presioná &quot;Editar&quot; para agregar.
                </p>
              )}
            </div>

            {/* Logo */}
            {tenant.logo_url && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Logo</p>
                <img
                  src={tenant.logo_url}
                  alt={`Logo de ${tenant.nombre}`}
                  className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-600"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}

            {/* Meta */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Creado el {fechaCreacion}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push(`/owner/tenants/${tenant.id}/productos?name=${encodeURIComponent(tenant.nombre)}`)}
          className="py-3 px-4 rounded-xl text-sm font-medium text-center transition bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700"
        >
          Gestionar productos
        </button>
        <button
          onClick={() => router.push(`/owner/tenants/${tenant.id}/cajeros`)}
          className="py-3 px-4 rounded-xl text-sm font-medium text-center transition bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
        >
          Administrar usuarios
        </button>
      </div>
    </div>
  )
}
