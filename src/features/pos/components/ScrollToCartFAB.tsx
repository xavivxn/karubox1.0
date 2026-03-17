'use client'

import { useCartStore } from '@/store/cartStore'
import { ArrowDownToLine, ChevronUp } from 'lucide-react'
import { useCartSectionVisible } from '../hooks/useCartSectionVisible'

const CART_SECTION_ID = 'pos-cart-section'
export const POS_PRODUCTS_SECTION_ID = 'pos-products-section'

interface Props {
  darkMode?: boolean
}

export function ScrollToCartFAB({ darkMode }: Props) {
  const { items } = useCartStore()
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0)
  const isCartVisible = useCartSectionVisible()

  const scrollToCart = () => {
    const el = document.getElementById(CART_SECTION_ID)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToProducts = () => {
    const el = document.getElementById(POS_PRODUCTS_SECTION_ID)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (itemCount === 0) return null

  const showAddMore = isCartVisible

  return (
    <button
      type="button"
      onClick={showAddMore ? scrollToProducts : scrollToCart}
      aria-label={showAddMore ? 'Agregar más productos' : `Ir a finalizar pedido (${itemCount} ${itemCount === 1 ? 'ítem' : 'ítems'})`}
      title={showAddMore ? 'Agregar más productos' : 'Ir a finalizar pedido'}
      className={`
        lg:hidden fixed z-40
        bottom-[max(1.5rem,env(safe-area-inset-bottom))]
        right-[max(1.5rem,env(safe-area-inset-right))]
        flex items-center gap-2 rounded-full pl-4 pr-3 py-3
        font-semibold text-sm text-white
        shadow-lg transition-all duration-200
        hover:scale-105 hover:shadow-xl active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400
        ${darkMode
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700'
          : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-600/35 hover:from-orange-600 hover:to-orange-700'
        }
      `}
    >
      <span className="hidden sm:inline">{showAddMore ? 'Agregar más' : 'Finalizar pedido'}</span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
        {showAddMore ? (
          <ChevronUp size={20} strokeWidth={2.5} />
        ) : (
          <ArrowDownToLine size={20} strokeWidth={2.5} />
        )}
      </span>
      <span
        className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/90 px-1.5 text-xs font-bold text-orange-600"
        aria-hidden
      >
        {itemCount}
      </span>
    </button>
  )
}

export { CART_SECTION_ID }
