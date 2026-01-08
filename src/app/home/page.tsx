import HomeView from '@/features/home/view/HomeView'
import { requireRole } from '@/lib/auth/guard'

export default async function HomePage() {
  // Proteger la ruta: solo admin puede acceder
  await requireRole(['admin'], '/home')
  
  return <HomeView />
}

