import { requireOwner } from '@/lib/auth/guard'
import { OwnerHomeView } from '@/features/owner/view/OwnerHomeView'

export default async function OwnerPage() {
  await requireOwner()
  return <OwnerHomeView />
}
