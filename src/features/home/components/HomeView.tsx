'use client'

import { useHomeAuth } from '../hooks/useHomeAuth'
import { HomeHeader } from './HomeHeader'
import { DashboardCards } from './DashboardCards'
import { FeaturesList } from './FeaturesList'
import { HomeLoading } from './HomeLoading'

export default function HomeView() {
  const { tenant, usuario, darkMode, loading, isAuthenticated } = useHomeAuth()

  if (loading) {
    return <HomeLoading />
  }

  if (!isAuthenticated) {
    return null
  }

  const tenantInfo = {
    nombre: tenant?.nombre ?? 'Ka\'u Manager',
    usuario: usuario?.nombre
  }

  return (
    <div className="space-y-16 py-4">
      <HomeHeader tenantInfo={tenantInfo} darkMode={darkMode} />
      <DashboardCards darkMode={darkMode} />
      <FeaturesList darkMode={darkMode} />
    </div>
  )
}
