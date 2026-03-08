import { useState } from 'react'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { toggleTenantStatus } from '@/app/actions/owner'

interface Tenant {
  id: string
  nombre: string
  slug: string
  ruc: string | null
  activo: boolean
  created_at: string
  usuarios: { count: number }[]
}

interface TenantCardProps {
  tenant: Tenant
  onStatusChange: () => void
}

export function TenantCard({ tenant, onStatusChange }: TenantCardProps) {
  const [toggling, setToggling] = useState(false)

  const usuariosCount = tenant.usuarios?.[0]?.count ?? 0
  const fechaCreacion = new Date(tenant.created_at).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const handleToggle = async () => {
    setToggling(true)
    await toggleTenantStatus(tenant.id, !tenant.activo)
    setToggling(false)
    onStatusChange()
  }

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-4 ${
        tenant.activo
          ? 'border-green-400 dark:border-green-500'
          : 'border-red-400 dark:border-red-500'
      }`}
    >
      {/* Indicador de estado superior */}
      <div
        className={`absolute top-0 left-4 right-4 h-1 rounded-b-full ${
          tenant.activo ? 'bg-green-400 dark:bg-green-500' : 'bg-red-400 dark:bg-red-500'
        }`}
      />

      {/* Header de la card */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base truncate">
            {tenant.nombre}
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">/{tenant.slug}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            tenant.activo
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              tenant.activo ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          {tenant.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Datos */}
      <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
        {tenant.ruc && (
          <p className="flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-500">RUC:</span> {tenant.ruc}
          </p>
        )}
        <p className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-gray-500">Usuarios:</span> {usuariosCount}
        </p>
        <p className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-gray-500">Creado:</span> {fechaCreacion}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-2 mt-auto">
        <Link
          href={`/owner/tenants/${tenant.id}/productos?name=${encodeURIComponent(tenant.nombre)}`}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium text-center transition bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 inline-flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          Gestionar
        </Link>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
            tenant.activo
              ? 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700'
              : 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
          }`}
        >
          {toggling ? 'Actualizando...' : tenant.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  )
}
