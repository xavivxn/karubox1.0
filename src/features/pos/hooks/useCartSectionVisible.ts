'use client'

import { useState, useEffect } from 'react'

const CART_SECTION_ID = 'pos-cart-section'

/**
 * Observa si la sección del carrito (#pos-cart-section) está visible en el viewport.
 * Útil para mostrar CTA contextuales: "Ver carrito" vs "Agregar más productos".
 */
export function useCartSectionVisible(): boolean {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = document.getElementById(CART_SECTION_ID)
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        setIsVisible(entry.isIntersecting)
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return isVisible
}
