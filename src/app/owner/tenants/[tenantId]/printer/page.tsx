import { requireOwner } from '@/lib/auth/guard'
import { getTenantForOwner, getPrinterConfigOwner } from '@/app/actions/owner'
import { PrinterConfigView } from '@/features/owner/view/PrinterConfigView'

interface Props {
  params: Promise<{ tenantId: string }>
}

export default async function OwnerPrinterConfigPage({ params }: Props) {
  await requireOwner()

  const { tenantId } = await params

  const tenantResult = await getTenantForOwner(tenantId)

  if (tenantResult.error || !tenantResult.tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Lomitería no encontrada</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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

  const configResult = await getPrinterConfigOwner(tenantId)

  return (
    <PrinterConfigView
      tenant={tenantResult.tenant}
      initialConfig={configResult.config}
      configError={configResult.error ?? null}
    />
  )
}
