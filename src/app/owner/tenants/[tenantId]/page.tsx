import { requireOwner } from '@/lib/auth/guard'
import { getTenantDetail } from '@/app/actions/owner'
import { TenantDetailView } from '@/features/owner/view/TenantDetailView'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ tenantId: string }>
}

export default async function TenantDetailPage({ params }: Props) {
  await requireOwner()
  const { tenantId } = await params
  const { tenant, error } = await getTenantDetail(tenantId)

  if (error || !tenant) {
    redirect('/owner')
  }

  return <TenantDetailView tenant={tenant} />
}
