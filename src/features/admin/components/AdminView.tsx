/**
 * Admin Module - Main View Component
 * Componente principal del dashboard de administración
 */

'use client'

import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { IngredienteModal } from './IngredienteModal'
import { OwnerProductModal } from '@/features/owner/components/OwnerProductModal'
import { ProductosListModal } from './ProductosListModal'
import { useAdminDashboard } from '../hooks/useAdminDashboard'
import { useEstadoCaja } from '@/features/caja/hooks/useEstadoCaja'
import { CerrarCajaModal } from '@/features/caja/components/CerrarCajaModal'
import { abrirCajaAction } from '@/app/actions/caja'
import { resetCocinaDailyData } from '@/features/cocina/utils/achievements'
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
import { useQueryClient } from '@tanstack/react-query'

export const AdminView = () => {
  const queryClient = useQueryClient()
  const { tenant, usuario, darkMode } = useTenant()
  const [showIngredienteModal, setShowIngredienteModal] = useState(false)
  const [showOwnerProductModal, setShowOwnerProductModal] = useState(false)
  const [showProductosListModal, setShowProductosListModal] = useState(false)
  const [showStockDrawer, setShowStockDrawer] = useState(false)
  const [showCerrarCajaModal, setShowCerrarCajaModal] = useState(false)
  const [showConfirmEmpezar, setShowConfirmEmpezar] = useState(false)
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false)
  const [isEmpezando, setIsEmpezando] = useState(false)
  const [errorEmpezar, setErrorEmpezar] = useState<string | null>(null)

  const { sesionAbierta, ultimaSesionCerrada, loading: loadingCaja, refetch: refetchCaja } = useEstadoCaja(tenant?.id ?? null)

  const handleEmpezarDia = useCallback(async () => {
    if (!tenant?.id) return { success: false as const, error: 'Tenant no disponible.' }
    return await abrirCajaAction(tenant.id)
  }, [tenant?.id])

  const onConfirmEmpezar = useCallback(async () => {
    setErrorEmpezar(null)
    setIsEmpezando(true)
    const result = await handleEmpezarDia()
    setIsEmpezando(false)
    if (result.success) {
      if (tenant?.id) resetCocinaDailyData(tenant.id)
      await refetchCaja()
      setShowConfirmEmpezar(false)
    } else {
      setErrorEmpezar(result.error)
    }
  }, [handleEmpezarDia, refetchCaja, tenant?.id])

  const onConfirmCerrarCaja = useCallback(async () => {
    setShowConfirmCerrar(false)
    setShowCerrarCajaModal(true)
  }, [])

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
  } = useAdminDashboard(tenant?.id ?? null, { desde: sesionAbierta?.apertura_at ?? null })

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
    void queryClient.invalidateQueries({ queryKey: ['admin-dashboard', tenant?.id] })
  }

  const handleOwnerProductSaved = () => {
    setShowOwnerProductModal(false)
    void queryClient.invalidateQueries({ queryKey: ['admin-dashboard', tenant?.id] })
  }

  const handleStockDrawerSaved = () => {
    setShowStockDrawer(false)
    void queryClient.invalidateQueries({ queryKey: ['admin-dashboard', tenant?.id] })
  }

  // Resumen: si caja abierta = stats del turno actual; si cerrada = último cierre (registrado hasta que se abra de nuevo)
  const displayStats = sesionAbierta
    ? stats
    : ultimaSesionCerrada
      ? {
          ...stats,
          todayOrders: ultimaSesionCerrada.cantidad_pedidos,
          todayRevenue: ultimaSesionCerrada.total_ventas,
          todayCost: ultimaSesionCerrada.total_costo_estimado,
          todayProfit: ultimaSesionCerrada.ganancia_neta,
          avgTicket: ultimaSesionCerrada.cantidad_pedidos
            ? Math.round(ultimaSesionCerrada.total_ventas / ultimaSesionCerrada.cantidad_pedidos)
            : 0
        }
      : stats

  const resumenLabel = sesionAbierta
    ? `Turno actual (desde ${new Date(sesionAbierta.apertura_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })})`
    : ultimaSesionCerrada
      ? `Último cierre (${new Date(ultimaSesionCerrada.cierre_at!).toLocaleDateString('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })})`
      : 'Resumen diario'

  return (
    <>
      {/* Header con resumen del turno actual o último cierre */}
      <AdminHeader
        tenantName={tenant.nombre}
        stats={displayStats}
        resumenLabel={resumenLabel}
        onOpenIngredienteModal={() => setShowIngredienteModal(true)}
        onOpenStockDrawer={() => setShowStockDrawer(true)}
        onOpenProductosList={canManageProducts ? () => setShowProductosListModal(true) : undefined}
        onOpenProductModal={canManageProducts ? () => setShowOwnerProductModal(true) : undefined}
        sesionAbierta={sesionAbierta}
        loadingCaja={loadingCaja}
        onEmpezarDia={() => setShowConfirmEmpezar(true)}
        onAbrirModalCerrarCaja={() => setShowConfirmCerrar(true)}
      />

      {/* KPI Cards principales (mismo criterio: turno actual o último cierre) */}
      <KpiCards
        stats={displayStats}
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

      {/* Confirmación: Empezar el día */}
      <ConfirmModal
        open={showConfirmEmpezar}
        onClose={() => { setShowConfirmEmpezar(false); setErrorEmpezar(null) }}
        title="¿Empezar el día?"
        message="Se habilitarán POS y Cocina para operar. El resumen de ingresos y ganancias se calculará desde este momento."
        errorMessage={errorEmpezar}
        confirmLabel="Sí, empezar el día"
        cancelLabel="Cancelar"
        onConfirm={onConfirmEmpezar}
        variant="primary"
        loading={isEmpezando}
        darkMode={darkMode}
      />

      {/* Confirmación: Cerrar caja */}
      <ConfirmModal
        open={showConfirmCerrar}
        onClose={() => setShowConfirmCerrar(false)}
        title="¿Cerrar la caja?"
        message="Se calcularán los totales del turno y deberás ingresar el monto pagado a empleados. Esta acción registra el cierre del día."
        confirmLabel="Sí, cerrar caja"
        cancelLabel="Cancelar"
        onConfirm={onConfirmCerrarCaja}
        variant="warning"
        darkMode={darkMode}
      />

      {/* Modal cerrar caja (solo cuando hay sesión abierta) */}
      {sesionAbierta && (
        <CerrarCajaModal
          open={showCerrarCajaModal}
          onClose={() => setShowCerrarCajaModal(false)}
          sesion={sesionAbierta}
          tenantId={tenant.id}
          tenantNombre={tenant.nombre}
          onCerrarExitoso={refetchCaja}
          darkMode={darkMode}
        />
      )}
    </>
  )
}
