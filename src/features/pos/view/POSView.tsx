'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { LayoutDashboard, FileText, Loader2, ShoppingCart, Search, Gift } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/contexts/TenantContext'
import { useEstadoCaja } from '@/features/caja/hooks/useEstadoCaja'
import { CajaCerradaModal } from '@/features/caja/components/CajaCerradaModal'
import { ROUTES } from '@/config/routes'
import { normalizarParaBusqueda } from '@/features/clientes/utils/clientes.utils'
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
import POSSearchBar from '../components/POSSearchBar'
import { CartBottomBar } from '../components/CartBottomBar'
import { CART_SECTION_ID, POS_PRODUCTS_SECTION_ID } from '../components/ScrollToCartFAB'
import CanjePuntosModal from '../components/CanjePuntosModal'
import { AppFooter } from '@/components/layout/AppFooter'

export default function POSView() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isCanjePuntosOpen, setIsCanjePuntosOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [showCajaCerradaModal, setShowCajaCerradaModal] = useState(false)

  const { usuario, tenant, loading: tenantLoading, darkMode, isAdmin, isCajero } = useTenant()
  const { items, addItem, addComboItem } = useCartStore()
  const { sesionAbierta, loading: loadingCaja } = useEstadoCaja(tenant?.id ?? null)
  const { categorias, productos, loading, feedback: dataFeedback } = usePOSData()
  const { handleConfirmOrder, isProcessing } = useOrderConfirmation()
  const initialCategorySet = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const searchSentinelRef = useRef<HTMLDivElement>(null)
  const searchCircleRef = useRef<HTMLButtonElement>(null)
  const searchOverlayRef = useRef<HTMLDivElement>(null)
  const [searchBarStuck, setSearchBarStuck] = useState(false)
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)

  // Al cargar el POS, seleccionar la primera categoría (no "Todos") para que lo primero que se vea sea una categoría definida
  useEffect(() => {
    if (categorias.length > 0 && !initialCategorySet.current) {
      setSelectedCategory(categorias[0].id)
      initialCategorySet.current = true
    }
  }, [categorias])

  // Detectar cuando la barra de búsqueda queda sticky para aplicar estilo compacto (más visibilidad al operador)
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    // Regla robusta: cuando el contenedor scroll se mueve (scrollTop > 0),
    // el wrapper sticky ya quedó "pegado" arriba; cuando volvemos al inicio, vuelve el modo normal.
    const updateFromScroll = () => {
      setSearchBarStuck(scrollEl.scrollTop > 0)
    }

    updateFromScroll()
    scrollEl.addEventListener('scroll', updateFromScroll, { passive: true })
    return () => {
      scrollEl.removeEventListener('scroll', updateFromScroll as EventListener)
    }
  }, [])

  // When bar is no longer sticky, close overlay so we show full bar in flow again
  useEffect(() => {
    if (!searchBarStuck) setSearchOverlayOpen(false)
  }, [searchBarStuck])

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOverlayOpen) {
      const t = setTimeout(() => {
        document.querySelector<HTMLInputElement>('[data-pos-search-input]')?.focus()
      }, 100)
      return () => clearTimeout(t)
    }
  }, [searchOverlayOpen])

  // Escape closes search overlay
  useEffect(() => {
    if (!searchOverlayOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeSearchOverlay()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchOverlayOpen])


  const closeSearchOverlay = () => {
    setSearchOverlayOpen(false)
    setTimeout(() => searchCircleRef.current?.focus(), 0)
  }

  // Merge feedback from data loading
  const currentFeedback = feedback || dataFeedback

  const filteredProducts = selectedCategory
    ? productos.filter((p) => p.categoria_id === selectedCategory)
    : productos

  /** En el grid principal mostramos hasta 10 productos (los más vendidos, el orden ya viene del backend) */
  const TOP_PRODUCTOS_GRID = 10
  const filteredProductsTop = filteredProducts.slice(0, TOP_PRODUCTOS_GRID)

  const searchActive = searchTerm.trim().length >= 2
  const searchResults = useMemo(() => {
    if (!searchActive) return []
    const term = normalizarParaBusqueda(searchTerm)
    const catNames = new Map(categorias.map((c) => [c.id, normalizarParaBusqueda(c.nombre ?? '')]))
    return productos.filter((p) => {
      const nombre = normalizarParaBusqueda(p.nombre ?? '')
      const desc = normalizarParaBusqueda(p.descripcion ?? '')
      const catNombre = p.categoria_id ? catNames.get(p.categoria_id) ?? '' : ''
      return nombre.includes(term) || desc.includes(term) || catNombre.includes(term)
    })
  }, [productos, categorias, searchTerm, searchActive])

  const productsToShow = searchActive ? searchResults : filteredProductsTop

  // Al menos 2 categorías siguientes para listar abajo del grid principal (ocultas si hay búsqueda activa)
  const selectedIndex = selectedCategory
    ? categorias.findIndex((c) => c.id === selectedCategory)
    : -1
  const siguientesCategorias =
    selectedIndex >= 0
      ? categorias.slice(selectedIndex + 1, selectedIndex + 3)
      : categorias.slice(0, 2)

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
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full flex-1 overflow-y-auto min-h-0 px-4 pb-24 md:px-6 lg:pb-6"
        >
          <div className="flex-shrink-0 pt-2 md:pt-3">
            <div className={searchOverlayOpen ? 'opacity-0 pointer-events-none' : ''}>
              <div className="max-w-7xl mx-auto">
                <header className="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${
                        darkMode
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <h1
                        className={`truncate text-base font-bold tracking-tight sm:text-xl ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
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
                    {(isAdmin || isCajero) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!sesionAbierta) return
                          setIsCanjePuntosOpen(true)
                        }}
                        title="Canje de puntos"
                        disabled={!sesionAbierta}
                        className={`inline-flex items-center justify-center rounded-lg border p-2 sm:rounded-xl sm:gap-2 sm:px-3 sm:py-2 sm:text-sm sm:font-medium transition min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 ${
                          darkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-orange-200'
                        } ${!sesionAbierta ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}
                      >
                        <Gift className="h-4 w-4 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Canje de puntos</span>
                      </button>
                    )}
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
              </div>
            </div>
          </div>
          <div ref={searchSentinelRef} className="h-1 w-full" aria-hidden />
          <div
            className={`sticky top-0 z-10 px-0 ${
              darkMode ? 'bg-gray-900/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'
            }`}
          >
            <div className="max-w-7xl mx-auto">
              {!searchBarStuck && (
                <POSSearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onClear={() => setSearchTerm('')}
                  placeholder="Buscar producto..."
                  darkMode={darkMode}
                />
              )}

              {searchBarStuck && !searchOverlayOpen && (
                <div className="py-2">
                  <button
                    ref={searchCircleRef}
                    type="button"
                    onClick={() => setSearchOverlayOpen(true)}
                    aria-label="Abrir búsqueda"
                    aria-expanded={false}
                    className={`flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full border shadow-md backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-50 ${
                      darkMode
                        ? 'border-orange-500/30 bg-gray-800/90 text-gray-200 shadow-black/20 hover:border-orange-500/50 hover:bg-gray-800'
                        : 'border-orange-300/80 bg-white/90 text-gray-700 shadow-gray-200/80 hover:border-orange-400 hover:bg-white'
                    }`}
                  >
                    <Search className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              )}

              {searchBarStuck && searchOverlayOpen && (
                <POSSearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onClear={() => setSearchTerm('')}
                  placeholder="Buscar producto..."
                  darkMode={darkMode}
                  onClose={closeSearchOverlay}
                />
              )}
            </div>
          </div>
        <div
          className={`max-w-7xl mx-auto transition-[padding] duration-200 ${
            searchBarStuck && !searchOverlayOpen ? 'pt-2' : ''
          }`}
        >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div id={POS_PRODUCTS_SECTION_ID} className="lg:col-span-2 space-y-6 scroll-mt-4">
            <CategoryList
              categories={categorias}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              darkMode={darkMode}
            />

            {searchActive && productsToShow.length === 0 ? (
              <div className={`rounded-2xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <p className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Ningún producto coincide con &quot;{searchTerm.trim()}&quot;
                </p>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      darkMode
                        ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    }`}
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              </div>
            ) : (
              <ProductGrid
                products={productsToShow}
                onAddProduct={onAddProduct}
                loading={loading}
                verificandoCaja={loadingCaja}
                darkMode={darkMode}
              />
            )}

            {/* Al menos 2 categorías siguientes listadas abajo (ocultas si hay búsqueda activa) */}
            {!loading && !searchActive && siguientesCategorias.length > 0 && (
              <div className="space-y-6 mt-8">
                {siguientesCategorias.map((cat) => {
                  const productosCategoria = productos.filter((p) => p.categoria_id === cat.id)
                  if (productosCategoria.length === 0) return null
                  return (
                    <section key={cat.id} className="space-y-3">
                      <h3
                        className={`text-sm font-semibold uppercase tracking-wide px-1 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {cat.nombre}
                      </h3>
                      <ProductGrid
                        products={productosCategoria}
                        onAddProduct={onAddProduct}
                        loading={false}
                        verificandoCaja={loadingCaja}
                        darkMode={darkMode}
                        hideTitle
                      />
                    </section>
                  )
                })}
              </div>
            )}
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
        <div className="pt-6">
          <AppFooter isDark={darkMode} variant="default" />
        </div>
      </div>
      </div>
      </div>

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        darkMode={darkMode}
      />

      <CanjePuntosModal
        key={isCanjePuntosOpen ? 'canje-open' : 'canje-closed'}
        open={isCanjePuntosOpen}
        onClose={() => setIsCanjePuntosOpen(false)}
        darkMode={darkMode}
        productos={productos}
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
