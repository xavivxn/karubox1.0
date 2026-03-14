export interface Categoria {
  id: string
  nombre: string
  orden: number
}

export interface ComboItemDB {
  producto_id: string
  cantidad: number
  producto: { id: string; nombre: string; tiene_receta: boolean }
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria_id?: string
  disponible: boolean
  tiene_receta: boolean
  combo_items?: ComboItemDB[]
}

export interface FeedbackDetail {
  label: string
  value: string
}

export interface FeedbackState {
  type: 'success' | 'error'
  title: string
  message: string
  details?: FeedbackDetail[]
}

export type TipoPedido = 'delivery' | 'local' | 'para_llevar' | null
