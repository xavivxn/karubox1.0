import { create } from 'zustand'

export interface CartItem {
  id: string
  producto_id: string
  nombre: string
  descripcion?: string
  precio: number
  cantidad: number
  subtotal: number
  notas?: string
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string
  puntos_totales: number
}

interface CartState {
  items: CartItem[]
  cliente: Cliente | null
  tipo: 'delivery' | 'local' | 'para_llevar' | null
  
  // Acciones
  addItem: (producto: { id: string; nombre: string; descripcion?: string; precio: number }) => void
  removeItem: (productoId: string) => void
  updateQuantity: (productoId: string, cantidad: number) => void
  clearCart: () => void
  setCliente: (cliente: Cliente | null) => void
  setTipo: (tipo: 'delivery' | 'local' | 'para_llevar') => void
  
  // Computed
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cliente: null,
  tipo: null,

  addItem: (producto) => {
    const items = get().items
    const existingItem = items.find(item => item.producto_id === producto.id)

    if (existingItem) {
      // Si ya existe, incrementar cantidad
      set({
        items: items.map(item =>
          item.producto_id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio
              }
            : item
        )
      })
    } else {
      // Si no existe, agregar nuevo
      set({
        items: [
          ...items,
          {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random()}`,
            producto_id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            cantidad: 1,
            subtotal: producto.precio
          }
        ]
      })
    }
  },

  removeItem: (productoId) => {
    set({
      items: get().items.filter(item => item.producto_id !== productoId)
    })
  },

  updateQuantity: (productoId, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(productoId)
      return
    }

    set({
      items: get().items.map(item =>
        item.producto_id === productoId
          ? {
              ...item,
              cantidad,
              subtotal: cantidad * item.precio
            }
          : item
      )
    })
  },

  clearCart: () => {
    set({
      items: [],
      cliente: null,
      tipo: null
    })
  },

  setCliente: (cliente) => {
    set({ cliente })
  },

  setTipo: (tipo) => {
    set({ tipo })
  },

  getTotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0)
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.cantidad, 0)
  }
}))


