import { Loader2 } from 'lucide-react'

export function HomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
      <div className="text-center text-white">
        <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
        <p className="text-xl font-semibold">Verificando sesión...</p>
      </div>
    </div>
  )
}
