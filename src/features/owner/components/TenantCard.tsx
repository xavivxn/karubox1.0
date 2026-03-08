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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
      {/* Header de la card */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">{tenant.nombre}</h3>
          <p className="text-sm text-gray-400 font-mono">/{tenant.slug}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            tenant.activo
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {tenant.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Datos */}
      <div className="space-y-1 text-sm text-gray-600">
        {tenant.ruc && (
          <p>
            <span className="text-gray-400">RUC:</span> {tenant.ruc}
          </p>
        )}
        <p>
          <span className="text-gray-400">Usuarios:</span> {usuariosCount}
        </p>
        <p>
          <span className="text-gray-400">Creado:</span> {fechaCreacion}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-2 mt-auto">
        <Link
          href={`/owner/tenants/${tenant.id}/productos?name=${encodeURIComponent(tenant.nombre)}`}
          className="w-full py-2 px-4 rounded-lg text-sm font-medium text-center transition bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 inline-flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          Gestionar productos
        </Link>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
            tenant.activo
              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
          }`}
        >
          {toggling ? 'Actualizando...' : tenant.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  )
}
