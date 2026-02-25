'use client'

import { useCartStore } from '@/store/cartStore'
import { ArrowDownToLine } from 'lucide-react'

const CART_SECTION_ID = 'pos-cart-section'

interface Props {
  darkMode?: boolean
}

export function ScrollToCartFAB({ darkMode }: Props) {
  const { items } = useCartStore()
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0)

  const scrollToCart = () => {
    const el = document.getElementById(CART_SECTION_ID)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (itemCount === 0) return null

  return (
    <button
      type="button"
      onClick={scrollToCart}
      aria-label={`Ir a finalizar pedido (${itemCount} ${itemCount === 1 ? 'ítem' : 'ítems'})`}
      title="Ir a finalizar pedido"
      className={`
        lg:hidden fixed bottom-6 right-6 z-40
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
      <span className="hidden sm:inline">Finalizar pedido</span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
        <ArrowDownToLine size={20} strokeWidth={2.5} />
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
