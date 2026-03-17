import { ConfiguracionView } from '@/features/configuracion/view/ConfiguracionView'
import { requireRole } from '@/lib/auth/guard'

export default async function ConfiguracionPage() {
  await requireRole(['admin'], '/home/configuracion')
  return <ConfiguracionView />
}
