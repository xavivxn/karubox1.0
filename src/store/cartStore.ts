import { create } from 'zustand'
import type { IngredientRequirement } from '@/types/ingredients'
import type { Cliente } from '@/types/supabase'

export interface ExtraIngredientSelection extends IngredientRequirement {
  unitPrice: number
}

export interface RemovedIngredientInfo {
  slug: string
  label: string
}

export interface CartItemCustomization {
  removedIngredients: RemovedIngredientInfo[]
  extras: ExtraIngredientSelection[]
  resolvedRecipe: IngredientRequirement[]
  notes?: string
}

// Item dentro de un combo (producto con su cantidad y customización)
export interface ComboProductItem {
  producto_id: string
  nombre: string
  descripcion?: string
  cantidad: number
  tiene_receta: boolean
  customization?: CartItemCustomization
}

export interface CartItem {
  id: string
  producto_id: string
  nombre: string
  descripcion?: string
  precio: number
  cantidad: number
  subtotal: number
  notas?: string
  extraCostPerUnit?: number
  tipo: 'producto' | 'combo' // Identifica si es producto individual o combo
  customization?: CartItemCustomization // Para productos individuales
  comboItems?: ComboProductItem[] // Para combos: lista de productos componentes
}

interface CartState {
  items: CartItem[]
  cliente: Cliente | null
  tipo: 'delivery' | 'local' | 'para_llevar' | null
  /** Si el cliente quiere factura fiscal (solo aplica cuando hay cliente) */
  conFactura: boolean

  // Acciones
  addItem: (producto: { id: string; nombre: string; descripcion?: string; precio: number; tiene_receta?: boolean }) => void
  addComboItem: (combo: { id: string; nombre: string; descripcion?: string; precio: number; comboItems: ComboProductItem[] }) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, cantidad: number) => void
  updateItemCustomization: (itemId: string, customization: CartItemCustomization | null, extraCostPerUnit: number) => void
  updateComboProductCustomization: (cartItemId: string, productoId: string, customization: CartItemCustomization | null) => void
  clearCart: () => void
  setCliente: (cliente: Cliente | null) => void
  setTipo: (tipo: 'delivery' | 'local' | 'para_llevar') => void
  setConFactura: (conFactura: boolean) => void

  // Computed
  getTotal: () => number
  getItemCount: () => number
}

const calculateSubtotal = (precioBase: number, extraCostPerUnit: number | undefined, cantidad: number) => {
  const extras = extraCostPerUnit ?? 0
  return (precioBase + extras) * cantidad
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  cliente: null,
  tipo: null,
  conFactura: false,

  addItem: (producto) => {
    const items = get().items
    const existingItem = items.find(item => item.producto_id === producto.id && item.tipo === 'producto')

    if (existingItem) {
      // Si ya existe, incrementar cantidad
      set({
        items: items.map(item =>
          item.producto_id === producto.id && item.tipo === 'producto'
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: calculateSubtotal(item.precio, item.extraCostPerUnit, item.cantidad + 1)
              }
            : item
        )
      })
    } else {
      // Si no existe, agregar nuevo producto individual
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
            subtotal: producto.precio,
            extraCostPerUnit: 0,
            tipo: 'producto' as const
          }
        ]
      })
    }
  },

  addComboItem: (combo) => {
    const items = get().items
    // Los combos siempre se agregan como nuevos items (no se agrupan)
    set({
      items: [
        ...items,
        {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random()}`,
          producto_id: combo.id,
          nombre: combo.nombre,
          descripcion: combo.descripcion,
          precio: combo.precio,
          cantidad: 1,
          subtotal: combo.precio,
          extraCostPerUnit: 0,
          tipo: 'combo' as const,
          comboItems: combo.comboItems
        }
      ]
    })
  },

  removeItem: (itemId) => {
    set({
      items: get().items.filter(item => item.id !== itemId)
    })
  },

  updateQuantity: (itemId, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(itemId)
      return
    }

    set({
      items: get().items.map(item =>
        item.id === itemId
          ? {
              ...item,
              cantidad,
              subtotal: calculateSubtotal(item.precio, item.extraCostPerUnit, cantidad)
            }
          : item
      )
    })
  },

  updateItemCustomization: (itemId, customization, extraCostPerUnit) => {
    set({
      items: get().items.map(item =>
        item.id === itemId
          ? {
              ...item,
              customization: customization ?? undefined,
              extraCostPerUnit,
              subtotal: calculateSubtotal(item.precio, extraCostPerUnit, item.cantidad)
            }
          : item
      )
    })
  },

  updateComboProductCustomization: (cartItemId, productoId, customization) => {
    set({
      items: get().items.map(item => {
        if (item.id === cartItemId && item.tipo === 'combo' && item.comboItems) {
          // Actualizar customización del producto específico dentro del combo
          const updatedComboItems = item.comboItems.map(comboProduct =>
            comboProduct.producto_id === productoId
              ? {
                  ...comboProduct,
                  customization: customization ?? undefined
                }
              : comboProduct
          )
          
          // Calcular costo extra total del combo sumando todos los productos
          const totalExtraCost = updatedComboItems.reduce((sum, comboProduct) => {
            if (comboProduct.customization?.extras) {
              const productExtraCost = comboProduct.customization.extras.reduce(
                (extraSum, extra) => extraSum + (extra.unitPrice * extra.quantityPerItem),
                0
              )
              return sum + (productExtraCost * comboProduct.cantidad)
            }
            return sum
          }, 0)
          
          return {
            ...item,
            comboItems: updatedComboItems,
            extraCostPerUnit: totalExtraCost,
            subtotal: calculateSubtotal(item.precio, totalExtraCost, item.cantidad)
          }
        }
        return item
      })
    })
  },

  clearCart: () => {
    set({
      items: [],
      cliente: null,
      tipo: null,
      conFactura: false
    })
  },

  setCliente: (cliente) => {
    set({ cliente })
  },

  setTipo: (tipo) => {
    set({ tipo })
  },

  setConFactura: (conFactura) => {
    set({ conFactura })
  },

  getTotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0)
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.cantidad, 0)
  }
}))


