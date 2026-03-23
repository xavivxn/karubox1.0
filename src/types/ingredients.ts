export type IngredientUnit = 'unidad' | 'g' | 'kg' | 'ml' | 'l'

export interface IngredientDefinition {
  id: string
  tenant_id: string
  slug: string
  nombre: string
  unidad: IngredientUnit
  tipo_inventario?: 'discreto' | 'fraccionable'
  icono: string | null
  precio_publico: number
  stock_actual?: number
  stock_minimo?: number
  stock_minimo_sugerido: number | null
  controlar_stock?: boolean
  descripcion?: string | null
  activo: boolean
  permite_extra_en_carrito?: boolean
}

export interface IngredientRequirement {
  ingredienteId?: string
  slug: string
  label: string
  unit: IngredientUnit
  quantityPerItem: number
}

export interface IngredientConsumption {
  slug: string
  label: string
  unit: IngredientUnit
  total: number
}



