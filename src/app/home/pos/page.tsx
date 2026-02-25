import { requireRole } from '@/lib/auth/guard'
import POSPageClient from './POSPageClient'

export default async function POSPage() {
  await requireRole(['admin', 'cajero'], '/home/pos')
  return <POSPageClient />
}
