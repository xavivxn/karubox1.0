'use client'

import { create } from 'zustand'

export const DEFAULT_LOADER_MESSAGE = 'Preparando tu pedido...'

interface LoaderState {
  isVisible: boolean
  activeRequests: number
  message: string
  start: (message?: string) => void
  stop: () => void
  setMessage: (message: string) => void
  hideImmediate: () => void
}

export const useLoaderStore = create<LoaderState>((set) => ({
  isVisible: false,
  activeRequests: 0,
  message: DEFAULT_LOADER_MESSAGE,
  start: (message) =>
    set((state) => {
      const nextCount = state.activeRequests + 1
      return {
        activeRequests: nextCount,
        isVisible: true,
        message: message ?? DEFAULT_LOADER_MESSAGE
      }
    }),
  stop: () =>
    set((state) => {
      const nextCount = Math.max(0, state.activeRequests - 1)
      return {
        activeRequests: nextCount,
        isVisible: nextCount > 0
      }
    }),
  setMessage: (message) => set({ message }),
  hideImmediate: () => set({ isVisible: false, activeRequests: 0, message: DEFAULT_LOADER_MESSAGE })
}))

export const loaderActions = {
  start: (message?: string) => useLoaderStore.getState().start(message),
  stop: () => useLoaderStore.getState().stop(),
  setMessage: (message: string) => useLoaderStore.getState().setMessage(message),
  hideImmediate: () => useLoaderStore.getState().hideImmediate()
}

