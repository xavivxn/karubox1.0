import POSView from '@/features/pos/view/POSView'
import { requireRole } from '@/lib/auth/guard'

export default async function POSPage() {
  // Proteger la ruta: admin y cajero pueden acceder
  await requireRole(['admin', 'cajero'], '/home/pos')
  
  return <POSView />
}
