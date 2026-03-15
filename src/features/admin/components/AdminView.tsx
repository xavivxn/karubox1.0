/**
 * Admin Module - Main View Component
 * Componente principal del dashboard de administración
 */

'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { IngredienteModal } from './IngredienteModal'
import { OwnerProductModal } from '@/features/owner/components/OwnerProductModal'
import { ProductosListModal } from './ProductosListModal'
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
import { InventoryDrawer } from './InventoryDrawer'

export const AdminView = () => {
  const { tenant, usuario, darkMode } = useTenant()
  const [showIngredienteModal, setShowIngredienteModal] = useState(false)
  const [showOwnerProductModal, setShowOwnerProductModal] = useState(false)
  const [showProductosListModal, setShowProductosListModal] = useState(false)
  const [showStockDrawer, setShowStockDrawer] = useState(false)

  // Admin puede crear productos a partir de materias primas (recetas, combos, sin receta)
  const canManageProducts = usuario?.rol === 'admin'

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

  const handleIngredienteSaved = () => {
    setShowIngredienteModal(false)
    refetch()
  }

  const handleOwnerProductSaved = () => {
    setShowOwnerProductModal(false)
    refetch()
  }

  const handleStockDrawerSaved = () => {
    setShowStockDrawer(false)
    refetch()
  }

  return (
    <>
      {/* Header con resumen diario */}
      <AdminHeader
        tenantName={tenant.nombre}
        stats={stats}
        onOpenIngredienteModal={() => setShowIngredienteModal(true)}
        onOpenStockDrawer={() => setShowStockDrawer(true)}
        onOpenProductosList={canManageProducts ? () => setShowProductosListModal(true) : undefined}
        onOpenProductModal={canManageProducts ? () => setShowOwnerProductModal(true) : undefined}
      />

      {/* KPI Cards principales */}
      <KpiCards
        stats={stats}
        totalInventoryItems={totalInventoryItems}
        lowStockCount={lowStockItems.length}
        darkMode={darkMode}
      />

      {/* Resumen diario y balance mensual */}
      {/* <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DailySummary stats={stats} />
        <MonthlyBalance stats={stats} />
      </section> */}

      {/* KPIs adicionales */}
      {/* <AdditionalKpis stats={stats} /> */}

      {/* Tendencia semanal y alertas de inventario */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <WeeklyTrend stats={stats} />
        <InventoryAlerts
          lowStockItems={lowStockItems}
          onOpenStockDrawer={() => setShowStockDrawer(true)}
        />
      </section>

      {/* Top clientes, productos y consumo de ingredientes */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopClients topClients={topClients} />
        <TopProducts topProducts={topProducts} />
        <IngredientConsumption ingredientsUsage={ingredientsUsage} />
      </section>

      {/* Grid completo de inventario */}
      <InventoryGrid
        inventory={inventory}
        onOpenIngredienteModal={() => setShowIngredienteModal(true)}
        onOpenStockDrawer={() => setShowStockDrawer(true)}
        onOpenProductModal={canManageProducts ? () => setShowOwnerProductModal(true) : undefined}
      />

      {/* Modal para registrar nuevos ingredientes */}
      <IngredienteModal
        open={showIngredienteModal}
        onClose={() => setShowIngredienteModal(false)}
        tenantId={tenant.id}
        onSaved={handleIngredienteSaved}
      />

      {/* Modal para ver listado de productos (editar, eliminar, enlace a nuevo) */}
      <ProductosListModal
        open={showProductosListModal}
        onClose={() => setShowProductosListModal(false)}
        tenantId={tenant.id}
        onOpenCreate={() => setShowOwnerProductModal(true)}
        onRefresh={refetch}
      />

      {/* Modal para crear productos (recetas, combos, sin receta) — mismo que en gestión owner */}
      <OwnerProductModal
        open={showOwnerProductModal}
        onClose={() => setShowOwnerProductModal(false)}
        tenantId={tenant.id}
        onSaved={handleOwnerProductSaved}
      />

      {/* Drawer para cargar stock de materias primas existentes */}
      <InventoryDrawer
        open={showStockDrawer}
        onClose={() => setShowStockDrawer(false)}
        tenantId={tenant.id}
        usuarioId={usuario?.id ?? null}
        onSaved={handleStockDrawerSaved}
      />
    </>
  )
}
