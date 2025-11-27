export interface Categoria {
  id: string
  nombre: string
  orden: number
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria_id?: string
  disponible: boolean
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
