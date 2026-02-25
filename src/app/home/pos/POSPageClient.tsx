'use client'

import dynamic from 'next/dynamic'

const POSView = dynamic(() => import('@/features/pos/view/POSView'), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Cargando punto de venta...</p>
      </div>
    </div>
  ),
  ssr: false,
})

export default function POSPageClient() {
  return <POSView />
}
