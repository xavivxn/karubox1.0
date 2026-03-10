import { requireOwner } from '@/lib/auth/guard'
import { CreateTenantView } from '@/features/owner/view/CreateTenantView'

export default async function NewTenantPage() {
  await requireOwner()

  return <CreateTenantView />
}
