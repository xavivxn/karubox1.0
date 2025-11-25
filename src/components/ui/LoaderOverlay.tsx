'use client'

import { useMemo } from 'react'
import { useLoaderStore } from '@/store/loaderStore'

export function LoaderOverlay() {
  const isVisible = useLoaderStore((state) => state.isVisible)
  const message = useLoaderStore((state) => state.message)

  const subtitle = useMemo(() => {
    if (!message) return 'Estamos preparando todo...'
    return message
  }, [message])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/10 backdrop-blur-md">
      <div className="text-center text-gray-900 space-y-5 px-8 py-10 bg-white/85 border border-white/40 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.18)]">
        <div className="flex justify-center items-center gap-4 text-6xl">
          <span className="animate-chef-nod origin-bottom">🧑‍🍳</span>
          <span className="animate-burger-bounce">🍔</span>
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-gray-900">¡Ya casi!</p>
          <p className="text-base text-gray-600 max-w-sm mx-auto">{subtitle}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Sincronizando con cocina y stock...
        </div>
      </div>
    </div>
  )
}

