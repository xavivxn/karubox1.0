import type { TenantInfo } from '../types/home.types'

interface HomeHeaderProps {
  tenantInfo: TenantInfo
  darkMode: boolean
}

export function HomeHeader({ tenantInfo, darkMode }: HomeHeaderProps) {
  return (
    <section className="text-center space-y-4">
      <div
        className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-semibold ${
          darkMode ? 'bg-gray-800 text-orange-300' : 'bg-orange-100 text-orange-700'
        }`}
      >
        <span>Operando: {tenantInfo.nombre}</span>
        {tenantInfo.usuario && <span>• Usuario: {tenantInfo.usuario}</span>}
      </div>
      <h1 className={`text-5xl md:text-6xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Sistema de Gestión
      </h1>
      <p className={`text-lg md:text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Control total de tu lomitería: ventas, pedidos y reportes en tiempo real.
      </p>
    </section>
  )
}
