'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/contexts/TenantContext'
import { usePOSData } from '../hooks/usePOSData'
import { useOrderConfirmation } from '../hooks/useOrderConfirmation'
import { POSHeader } from '../components/POSHeader'
import { POSLoading } from '../components/POSLoading'
import CategoryList from '@/components/pos/CategoryList'
import ProductGrid from '@/components/pos/ProductGrid'
import Cart from '@/components/pos/Cart'
import ClientModal from '@/components/pos/ClientModal'
import { ItemCustomizationDrawer } from '@/components/pos/ItemCustomizationDrawer'
import { FeedbackModal } from '@/components/ui/FeedbackModal'
import type { FeedbackState } from '../types/pos.types'

export default function POSView() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const { usuario, tenant, loading: tenantLoading, darkMode, toggleDarkMode, signOut } = useTenant()
  const { addItem } = useCartStore()
  const { categorias, productos, loading, feedback: dataFeedback } = usePOSData()
  const { handleConfirmOrder, isProcessing } = useOrderConfirmation()

  // Merge feedback from data loading
  const currentFeedback = feedback || dataFeedback

  const filteredProducts = selectedCategory
    ? productos.filter((p) => p.categoria_id === selectedCategory)
    : productos

  const onConfirmOrder = async () => {
    const result = await handleConfirmOrder()
    if (result) {
      setFeedback(result)
    }
  }

  if (tenantLoading) {
    return <POSLoading darkMode={darkMode} />
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
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
              onAddProduct={(product) => addItem(product)}
              loading={loading}
              darkMode={darkMode}
            />
          </div>

          <div className="lg:col-span-1">
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
      />
      <ItemCustomizationDrawer
        open={Boolean(editingItemId)}
        itemId={editingItemId}
        onClose={() => setEditingItemId(null)}
        darkMode={darkMode}
      />
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
    </div>
  )
}
