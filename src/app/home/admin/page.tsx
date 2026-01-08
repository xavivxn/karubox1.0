import { AdminView } from '@/features/admin/components/AdminView'
import { requireRole } from '@/lib/auth/guard'

export default async function AdminPage() {
  // Proteger la ruta: solo admin puede acceder
  await requireRole(['admin'], '/home/admin')
  
  return <AdminView />
}
