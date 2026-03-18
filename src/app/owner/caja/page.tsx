import { requireOwner } from '@/lib/auth/guard'
import { CajaSociosView } from '@/features/owner/view/CajaSociosView'

export default async function OwnerCajaPage() {
  await requireOwner()
  return <CajaSociosView />
}

