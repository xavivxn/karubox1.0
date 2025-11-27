import Link from 'next/link'
import { Moon, Sun } from 'lucide-react'

interface POSHeaderProps {
  tenantName?: string
  userName?: string
  darkMode: boolean
  onToggleDarkMode: () => void
  onSignOut: () => void
}

export function POSHeader({
  tenantName,
  userName,
  darkMode,
  onToggleDarkMode,
  onSignOut
}: POSHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto mb-6">
      <div className={`rounded-2xl shadow-2xl p-6 ${
        darkMode
          ? 'bg-gradient-to-r from-orange-600 to-orange-700'
          : 'bg-gradient-to-r from-orange-500 to-orange-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl drop-shadow-lg">🖥️</div>
            <div className="text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-1">
                Punto de Venta
              </h1>
              {tenantName && userName && (
                <p className="text-orange-100 text-sm md:text-base">
                  {tenantName} • {userName}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleDarkMode}
              className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all hover:scale-105"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link
              href="/home"
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all hover:scale-105 font-medium"
            >
              ← Volver
            </Link>
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-105 font-medium shadow-lg"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
