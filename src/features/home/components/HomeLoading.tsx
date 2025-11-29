import { Loader2 } from 'lucide-react'

export function HomeLoading() {
  return (
    <div className="text-center">
      <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-orange-500" />
      <p className="text-xl font-semibold">Verificando sesión...</p>
    </div>
  )
}
