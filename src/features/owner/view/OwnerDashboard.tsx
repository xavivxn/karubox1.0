'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { listTenants } from '@/app/actions/owner'
import { TenantCard } from '../components/TenantCard'

interface Tenant {
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
  usuarios: { count: number }[]
}

interface OwnerDashboardProps {
  initialTenants: Tenant[]
}

export function OwnerDashboard({ initialTenants }: OwnerDashboardProps) {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants)
  const [refreshing, setRefreshing] = useState(false)
  const [navigatingToNew, setNavigatingToNew] = useState(false)

  const handleNewTenant = useCallback(() => {
    setNavigatingToNew(true)
    router.push('/owner/tenants/new')
  }, [router])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    const result = await listTenants()
    if (!result.error) setTenants(result.tenants as Tenant[])
    setRefreshing(false)
  }, [])

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Lomiterías registradas</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {tenants.length === 0
              ? 'Sin lomiterías aún.'
              : `${tenants.length} lomitería${tenants.length !== 1 ? 's' : ''} en la plataforma.`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewTenant}
          disabled={navigatingToNew}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm disabled:opacity-80 disabled:cursor-wait"
        >
          {navigatingToNew ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <span>+</span>
          )}
          {navigatingToNew ? 'Cargando...' : 'Nueva lomitería'}
        </button>
      </div>

      {/* Estado vacío */}
      {tenants.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-4xl mb-3">🍔</p>
          <p className="text-gray-500 dark:text-gray-300 font-medium">No hay lomiterías registradas todavía.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Hacé clic en &ldquo;Nueva lomitería&rdquo; para empezar.
          </p>
        </div>
      )}

      {/* Grid de cards */}
      {tenants.length > 0 && (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${
            refreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}
        >
          {tenants.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} onStatusChange={refresh} />
          ))}
        </div>
      )}
    </div>
  )
}
