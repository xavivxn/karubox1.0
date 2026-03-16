'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { LayoutDashboard, FileText, Loader2, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/contexts/TenantContext'
import { useEstadoCaja } from '@/features/caja/hooks/useEstadoCaja'
import { CajaCerradaModal } from '@/features/caja/components/CajaCerradaModal'
import { ROUTES } from '@/config/routes'
import { usePOSData } from '../hooks/usePOSData'
import { useOrderConfirmation } from '../hooks/useOrderConfirmation'
import { POSLoading } from '../components/POSLoading'
import { FeedbackModal } from '@/components/ui/FeedbackModal'
import type { FeedbackState, Producto } from '../types/pos.types'
import { ItemCustomizationDrawer } from '../components/ItemCustomizationDrawer'
import Cart from '../components/Cart'
import ClientModal from '../components/ClientModal'
import CategoryList from '../components/CategoryList'
import ProductGrid from '../components/ProductGrid'
import { CartBottomBar } from '../components/CartBottomBar'
import { CART_SECTION_ID } from '../components/ScrollToCartFAB'

export default function POSView() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [showCajaCerradaModal, setShowCajaCerradaModal] = useState(false)

  const { usuario, tenant, loading: tenantLoading, darkMode, isAdmin } = useTenant()
  const { items, addItem, addComboItem } = useCartStore()
  const { sesionAbierta, loading: loadingCaja } = useEstadoCaja(tenant?.id ?? null)
  const { categorias, productos, loading, feedback: dataFeedback } = usePOSData()
  const { handleConfirmOrder, isProcessing } = useOrderConfirmation()
  const initialCategorySet = useRef(false)

  // Al cargar el POS, seleccionar la primera categoría (no "Todos") para que lo primero que se vea sea una categoría definida
  useEffect(() => {
    if (categorias.length > 0 && !initialCategorySet.current) {
      setSelectedCategory(categorias[0].id)
      initialCategorySet.current = true
    }
  }, [categorias])

  // Merge feedback from data loading
  const currentFeedback = feedback || dataFeedback

  const filteredProducts = selectedCategory
    ? productos.filter((p) => p.categoria_id === selectedCategory)
    : productos

  const onConfirmOrder = async () => {
    if (loadingCaja) return
    if (!sesionAbierta) {
      setShowCajaCerradaModal(true)
      return
    }
    const result = await handleConfirmOrder()
    if (result) {
      setFeedback(result)
    }
  }

  const onAddProduct = (product: Producto) => {
    if (loadingCaja) return
    if (items.length === 0 && !sesionAbierta) {
      setShowCajaCerradaModal(true)
      return
    }
    if (product.combo_items && product.combo_items.length > 0) {
      addComboItem({
        id: product.id,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        comboItems: product.combo_items.map((ci) => ({
          producto_id: ci.producto_id,
          nombre: ci.producto.nombre,
          cantidad: ci.cantidad,
          tiene_receta: ci.producto.tiene_receta,
        }))
      })
    } else {
      addItem({ ...product, puntos_extra: product.puntos_extra ?? 0 })
    }
  }

  if (tenantLoading) {
    return <POSLoading darkMode={darkMode} />
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 md:px-6 md:pt-3 lg:pb-6">
        <div className="max-w-7xl mx-auto">
        {/* Título de sección + acciones — compacto en móvil */}
        <header className="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className={`truncate text-base font-bold tracking-tight sm:text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Punto de venta
              </h1>
              <p className={`hidden sm:block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Selecciona productos y confirma el pedido
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={`${ROUTES.PROTECTED.PEDIDOS}?from=${ROUTES.PEDIDOS_FROM.POS}`}
            onClick={() => setNavigatingTo(ROUTES.PROTECTED.PEDIDOS)}
            title="Historial de pedidos"
            className={`inline-flex items-center justify-center rounded-lg border p-2 sm:rounded-xl sm:gap-2 sm:px-3 sm:py-2 sm:text-sm sm:font-medium transition min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 ${
              navigatingTo !== null && navigatingTo !== ROUTES.PROTECTED.PEDIDOS
                ? 'pointer-events-none cursor-not-allowed opacity-50'
                : ''
            } ${
              darkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-orange-200'
            }`}
          >
            {navigatingTo === ROUTES.PROTECTED.PEDIDOS ? (
              <Loader2 className="h-4 w-4 animate-spin sm:h-4 sm:w-4" />
            ) : (
              <FileText className="h-4 w-4 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">Historial de pedidos</span>
          </Link>
          {isAdmin && (
            <Link
              href={ROUTES.PROTECTED.ADMIN}
              onClick={() => setNavigatingTo(ROUTES.PROTECTED.ADMIN)}
              title="Administración"
              className={`inline-flex items-center justify-center rounded-lg border p-2 sm:rounded-xl sm:gap-2 sm:px-3 sm:py-2 sm:text-sm sm:font-medium transition min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 ${
                navigatingTo !== null && navigatingTo !== ROUTES.PROTECTED.ADMIN
                  ? 'pointer-events-none cursor-not-allowed opacity-50'
                  : ''
              } ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-orange-200'
              }`}
            >
              {navigatingTo === ROUTES.PROTECTED.ADMIN ? (
                <Loader2 className="h-4 w-4 animate-spin sm:h-4 sm:w-4" />
              ) : (
                <LayoutDashboard className="h-4 w-4 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">Administración</span>
            </Link>
          )}
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <CategoryList
              categories={categorias}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              darkMode={darkMode}
            />

            <ProductGrid
              products={filteredProducts}
              onAddProduct={onAddProduct}
              loading={loading}
              verificandoCaja={loadingCaja}
              darkMode={darkMode}
            />
          </div>

          <div id={CART_SECTION_ID} className="lg:col-span-1 scroll-mt-4">
            <div className="sticky top-6">
              <div style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <Cart
                  onOpenClientModal={() => setIsClientModalOpen(true)}
                  onConfirmOrder={onConfirmOrder}
                  isProcessing={isProcessing}
                  darkMode={darkMode}
                  onEditItem={(itemId) => setEditingItemId(itemId)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        darkMode={darkMode}
      />
      <ItemCustomizationDrawer
        open={Boolean(editingItemId)}
        itemId={editingItemId}
        onClose={() => setEditingItemId(null)}
        darkMode={darkMode}
      />
      <CartBottomBar darkMode={darkMode} />
      {currentFeedback && (
        <FeedbackModal
          open
          type={currentFeedback.type}
          title={currentFeedback.title}
          message={currentFeedback.message}
          details={currentFeedback.details}
          onClose={() => setFeedback(null)}
          darkMode={darkMode}
        />
      )}
      <CajaCerradaModal
        open={showCajaCerradaModal}
        onClose={() => setShowCajaCerradaModal(false)}
        darkMode={darkMode}
      />
    </div>
  )
}
