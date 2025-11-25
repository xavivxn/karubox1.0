'use client'

import { useEffect } from 'react'
import { setupLoaderInterceptor } from '@/lib/loader/interceptor'

export function LoaderInterceptor() {
  useEffect(() => {
    setupLoaderInterceptor()
  }, [])

  return null
}

