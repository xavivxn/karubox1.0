import { requireRole } from '@/lib/auth/guard'
import { ClientesPanelView } from '@/features/clientes/components/ClientesPanelView'

export default async function ClientesPage() {
  await requireRole(['admin'], '/home/admin/clientes')
  return <ClientesPanelView />
}
