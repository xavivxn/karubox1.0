import { requireRole } from '@/lib/auth/guard'
import { HistorialPedidosView } from '@/features/pedidos/view/HistorialPedidosView'

export default async function PedidosPage() {
  await requireRole(['admin', 'cajero'], '/home/pedidos')

  return <HistorialPedidosView />
}
