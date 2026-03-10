import { requireOwner } from '@/lib/auth/guard'
import { getTenantForOwner, listUsuariosTenantOwner } from '@/app/actions/owner'
import { CajerosManagementView } from '@/features/owner/view/CajerosManagementView'

interface Props {
  params: Promise<{ tenantId: string }>
}

export default async function OwnerCajerosPage({ params }: Props) {
  await requireOwner()

  const { tenantId } = await params

  const tenantResult = await getTenantForOwner(tenantId)

  if (tenantResult.error || !tenantResult.tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-800">Lomitería no encontrada</p>
          <p className="text-sm text-gray-500">
            {tenantResult.error ?? 'No se pudo cargar la información del tenant.'}
          </p>
          <a
            href="/owner"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition"
          >
            Volver al panel
          </a>
        </div>
      </div>
    )
  }

  const [adminsResult, cajerosResult] = await Promise.all([
    listUsuariosTenantOwner(tenantId, 'admin'),
    listUsuariosTenantOwner(tenantId, 'cajero'),
  ])

  return (
    <CajerosManagementView
      tenant={tenantResult.tenant}
      initialAdmins={adminsResult.usuarios as any}
      initialCajeros={cajerosResult.usuarios as any}
    />
  )
}
