import { requireRole } from '@/lib/auth/guard'
import { HistorialPedidosView } from '@/features/pedidos/view/HistorialPedidosView'

export default async function PedidosPage() {
  await requireRole(['admin', 'cajero', 'cocinero', 'repartidor'], '/home/pedidos')

  return <HistorialPedidosView />
}
