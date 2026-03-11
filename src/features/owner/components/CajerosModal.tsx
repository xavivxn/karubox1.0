'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Users, UserPlus, Trash2, AlertTriangle, Mail, Calendar, ShieldCheck, CreditCard } from 'lucide-react'
import { UsuarioFormModal } from './CajeroFormModal'
import { listUsuariosTenantOwner, deleteUsuarioTenantOwner } from '@/app/actions/owner'
import type { TenantUserRole } from '@/app/actions/owner'

interface Usuario {
  id: string
  auth_user_id: string
  nombre: string
  email: string
  activo: boolean
  created_at: string
}

interface Tenant {
  id: string
  nombre: string
  slug: string
}

interface CajerosModalProps {
  open: boolean
  onClose: () => void
  tenant: Tenant
}

const TABS: { rol: TenantUserRole; label: string; icon: typeof ShieldCheck }[] = [
  { rol: 'admin', label: 'Administradores', icon: ShieldCheck },
  { rol: 'cajero', label: 'Cajeros', icon: CreditCard },
]

const ROLE_BADGE: Record<TenantUserRole, { label: string; classes: string }> = {
  admin: { label: 'Admin', classes: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' },
  cajero: { label: 'Cajero', classes: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' },
}

const ROLE_EMPTY: Record<TenantUserRole, string> = {
  admin: 'Esta lomitería aún no tiene administradores adicionales.',
  cajero: 'Esta lomitería aún no tiene cajeros. Presiona el botón para crear uno con acceso al Punto de Venta.',
}

export function CajerosModal({ open, onClose, tenant }: CajerosModalProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TenantUserRole>('admin')
  const [admins, setAdmins] = useState<Usuario[]>([])
  const [cajeros, setCajeros] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    const [adminsResult, cajerosResult] = await Promise.all([
      listUsuariosTenantOwner(tenant.id, 'admin'),
      listUsuariosTenantOwner(tenant.id, 'cajero'),
    ])
    if (!adminsResult.error) setAdmins(adminsResult.usuarios as Usuario[])
    if (!cajerosResult.error) setCajeros(cajerosResult.usuarios as Usuario[])
    setLoading(false)
  }, [tenant.id])

  useEffect(() => {
    if (open) {
      setActiveTab('admin')
      setDeleteError(null)
      setUserToDelete(null)
      fetchUsuarios()
    }
  }, [open, fetchUsuarios])

  const refreshUsuarios = useCallback(async (rol: TenantUserRole) => {
    const result = await listUsuariosTenantOwner(tenant.id, rol)
    if (!result.error) {
      if (rol === 'admin') setAdmins(result.usuarios as Usuario[])
      else setCajeros(result.usuarios as Usuario[])
    }
  }, [tenant.id])

  const handleSaved = () => {
    setShowCreateModal(false)
    refreshUsuarios(activeTab)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteUsuarioTenantOwner(userToDelete.id, tenant.id)
    setDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      return
    }
    setUserToDelete(null)
    refreshUsuarios(activeTab)
  }

  const usuarios = activeTab === 'admin' ? admins : cajeros
  const activeTabConfig = TABS.find((t) => t.rol === activeTab)!

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !deleting && onClose()}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-orange-500 dark:text-orange-400 font-medium">
                Administrar usuarios
              </p>
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{tenant.nombre}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
            >
              <UserPlus className="w-4 h-4" />
              {activeTab === 'admin' ? 'Nuevo admin' : 'Nuevo cajero'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-900/50 rounded-xl p-1 gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.rol
              const count = tab.rol === 'admin' ? admins.length : cajeros.length
              return (
                <button
                  key={tab.rol}
                  onClick={() => setActiveTab(tab.rol)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Contenido */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-orange-400 dark:text-orange-300" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">
                Sin {activeTabConfig.label.toLowerCase()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                {ROLE_EMPTY[activeTab]}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usuarios.map((usuario) => {
                const fechaCreacion = new Date(usuario.created_at).toLocaleDateString('es-PY', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                const badge = ROLE_BADGE[activeTab]
                return (
                  <div
                    key={usuario.id}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                          <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                            {usuario.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                            {usuario.nombre}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          usuario.activo
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                        <span className="truncate">{usuario.email}</span>
                      </p>
                      <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                        {fechaCreacion}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setDeleteError(null)
                        setUserToDelete(usuario)
                      }}
                      className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && usuarios.length > 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
              {usuarios.length} {activeTabConfig.label.toLowerCase()}
            </p>
          )}
        </div>
      </div>

      {/* Modal confirmación de eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setUserToDelete(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Eliminar usuario</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300">
              ¿Estás seguro que querés eliminar a{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">"{userToDelete.nombre}"</span>?
              Se eliminarán sus credenciales de acceso.
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setUserToDelete(null)}
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

      {/* Modal crear usuario */}
      <UsuarioFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tenantId={tenant.id}
        rol={activeTab}
        onSaved={handleSaved}
      />
    </div>,
    document.body
  )
}
