import { requireOwner } from '@/lib/auth/guard'
import { listTenants } from '@/app/actions/owner'
import { OwnerDashboard } from '@/features/owner/view/OwnerDashboard'

export default async function OwnerTenantsPage() {
  await requireOwner()

  const { tenants } = await listTenants()

  return <OwnerDashboard initialTenants={tenants as any} />
}

