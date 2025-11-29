import type { TenantInfo } from '../types/home.types'

interface HomeHeaderProps {
  tenantInfo: TenantInfo
  darkMode: boolean
}

export function HomeHeader({ tenantInfo, darkMode }: HomeHeaderProps) {
  return (
    <section className="text-center space-y-4">
      <h1 className={`text-5xl md:text-6xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Sistema de Gestión
      </h1>
      <p className={`text-lg md:text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Control total de tus ventas, pedidos y reportes en tiempo real.
      </p>
    </section>
  )
}
