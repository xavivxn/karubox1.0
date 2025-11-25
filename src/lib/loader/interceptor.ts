'use client'

import { loaderActions, DEFAULT_LOADER_MESSAGE } from '@/store/loaderStore'

let interceptorInstalled = false
declare global {
  interface Window {
    __lomiteriaLoader?: {
      show: (message?: string) => void
      hide: () => void
    }
  }
}

const shouldIgnore = (url: string) => {
  if (!url) return false
  return (
    url.includes('/_next/') ||
    url.includes('__next') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  )
}

export function setupLoaderInterceptor() {
  if (typeof window === 'undefined') return
  if (interceptorInstalled) return

  const originalFetch = window.fetch.bind(window)
  interceptorInstalled = true

  if (process.env.NODE_ENV !== 'production') {
    window.__lomiteriaLoader = {
      show: (message?: string) => loaderActions.start(message ?? DEFAULT_LOADER_MESSAGE),
      hide: () => loaderActions.hideImmediate()
    }
  }

  window.fetch = async (...args) => {
    const requestInfo = args[0]
    const url =
      typeof requestInfo === 'string'
        ? requestInfo
        : requestInfo instanceof Request
          ? requestInfo.url
          : ''

    const skip = shouldIgnore(url)
    if (!skip) {
      loaderActions.start()
    }

    try {
      return await originalFetch(...args)
    } finally {
      if (!skip) {
        loaderActions.stop()
      }
    }
  }
}

