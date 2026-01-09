/**
 * Admin Module - Main View Component
 * Componente principal del dashboard de administración
 */

'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { InventoryDrawer } from './InventoryDrawer'
import { ProductModal } from './ProductModal'
import { useAdminDashboard } from '../hooks/useAdminDashboard'
import { AdminHeader } from './AdminHeader'
import { AdminLoading } from './AdminLoading'
import { KpiCards } from './KpiCards'
import { DailySummary } from './DailySummary'
import { MonthlyBalance } from './MonthlyBalance'
import { AdditionalKpis } from './AdditionalKpis'
import { WeeklyTrend } from './WeeklyTrend'
import { InventoryAlerts } from './InventoryAlerts'
import { TopClients } from './TopClients'
import { TopProducts } from './TopProducts'
import { IngredientConsumption } from './IngredientConsumption'
import { InventoryGrid } from './InventoryGrid'

export const AdminView = () => {
  const { tenant, usuario, darkMode } = useTenant()
  const [showInventoryDrawer, setShowInventoryDrawer] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  
  const {
    loading,
    stats,
    topClients,
    topProducts,
    inventory,
    ingredientsUsage,
    lowStockItems,
    totalInventoryItems,
    refetch
  } = useAdminDashboard(tenant?.id ?? null)

  // Si no hay tenant, mostrar loader
  if (!tenant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    )
  }

  // Si está cargando, mostrar loading state
  if (loading) {
    return <AdminLoading darkMode={darkMode} />
  }

  const handleInventoryDrawerClose = () => {
    setShowInventoryDrawer(false)
  }

  const handleInventorySaved = () => {
    setShowInventoryDrawer(false)
    refetch()
  }

  const handleProductSaved = () => {
    setShowProductModal(false)
    refetch()
  }

  return (
    <>
      {/* Header con resumen diario */}
      <AdminHeader
        tenantName={tenant.nombre}
        stats={stats}
        onOpenInventoryDrawer={() => setShowInventoryDrawer(true)}
        onOpenProductModal={() => setShowProductModal(true)}
      />

      {/* KPI Cards principales */}
      <KpiCards
        stats={stats}
        totalInventoryItems={totalInventoryItems}
        lowStockCount={lowStockItems.length}
      />

      {/* Resumen diario y balance mensual */}
      {/* <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DailySummary stats={stats} />
        <MonthlyBalance stats={stats} />
      </section> */}

      {/* KPIs adicionales */}
      {/* <AdditionalKpis stats={stats} /> */}

      {/* Tendencia semanal y alertas de inventario */}
      {/* <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <WeeklyTrend stats={stats} />
        <InventoryAlerts
          lowStockItems={lowStockItems}
          onOpenInventoryDrawer={() => setShowInventoryDrawer(true)}
        />
      </section> */}

      {/* Top clientes, productos y consumo de ingredientes */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopClients topClients={topClients} />
        <TopProducts topProducts={topProducts} />
        {/* <IngredientConsumption ingredientsUsage={ingredientsUsage} /> */}
      </section>

      {/* Grid completo de inventario */}
      {/* <InventoryGrid
        inventory={inventory}
        onOpenInventoryDrawer={() => setShowInventoryDrawer(true)}
      /> */}

      {/* Drawer para registrar movimientos de inventario */}
      {/* <InventoryDrawer
        open={showInventoryDrawer}
        onClose={handleInventoryDrawerClose}
        tenantId={tenant.id}
        usuarioId={usuario?.id ?? null}
        onSaved={handleInventorySaved}
      /> */}

      {/* Modal para registrar nuevos productos */}
      <ProductModal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        tenantId={tenant.id}
        onSaved={handleProductSaved}
      />
    </>
  )
}
