import { requireRole } from '@/lib/auth/guard'
import CocinaVirtualView from '@/features/cocina/view/CocinaVirtualView'

export default async function CocinaPage() {
  await requireRole(['admin'], '/home/admin/cocina')
  return <CocinaVirtualView />
}
