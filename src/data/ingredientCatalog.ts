'use client'

export interface IngredientDefinition {
  slug: string
  nombre: string
  unit: 'unidad' | 'g' | 'kg' | 'ml' | 'l'
  icon: string
  categoria?: string
  descripcion?: string
  stockMinimo?: number
}

export const INGREDIENT_CATEGORY_NAME = 'Insumos Base'

export const INGREDIENT_CATALOG: IngredientDefinition[] = [
  {
    slug: 'pan-brioche',
    nombre: 'Pan Brioche Atlas',
    unit: 'unidad',
    icon: '🥖',
    descripcion: 'Panes para burgers premium',
    stockMinimo: 40
  },
  {
    slug: 'pan-smash',
    nombre: 'Pan Smash',
    unit: 'unidad',
    icon: '🍞',
    descripcion: 'Panes pequeños para smash burgers',
    stockMinimo: 60
  },
  {
    slug: 'carne-120',
    nombre: 'Blend 120g',
    unit: 'g',
    icon: '🥩',
    descripcion: 'Carne preparada para burgers clásicas',
    stockMinimo: 6000
  },
  {
    slug: 'carne-160',
    nombre: 'Blend 160g',
    unit: 'g',
    icon: '🍔',
    descripcion: 'Carne para burgers premium',
    stockMinimo: 8000
  },
  {
    slug: 'carne-90',
    nombre: 'Blend Smash 90g',
    unit: 'g',
    icon: '🍖',
    descripcion: 'Carne para smash burgers',
    stockMinimo: 5000
  },
  {
    slug: 'cheddar',
    nombre: 'Queso Cheddar Bloque',
    unit: 'g',
    icon: '🧀',
    descripcion: 'Bloques de cheddar para rallar',
    stockMinimo: 3000
  },
  {
    slug: 'bacon',
    nombre: 'Bacon Premium',
    unit: 'g',
    icon: '🥓',
    descripcion: 'Bacon ahumado premium',
    stockMinimo: 2000
  },
  {
    slug: 'huevo',
    nombre: 'Huevos',
    unit: 'unidad',
    icon: '🥚',
    descripcion: 'Huevos frescos para toppings',
    stockMinimo: 60
  },
  {
    slug: 'mix-verde',
    nombre: 'Mix Verde',
    unit: 'g',
    icon: '🥬',
    descripcion: 'Lechuga + rúcula + espinaca',
    stockMinimo: 1500
  },
  {
    slug: 'tomate',
    nombre: 'Tomate Laminado',
    unit: 'g',
    icon: '🍅',
    descripcion: 'Tomates frescos laminados',
    stockMinimo: 1200
  },
  {
    slug: 'salsa-house',
    nombre: 'Salsa House',
    unit: 'ml',
    icon: '🥣',
    descripcion: 'Salsa secreta de la casa',
    stockMinimo: 1500
  },
  {
    slug: 'salsa-smash',
    nombre: 'Salsa Smash',
    unit: 'ml',
    icon: '🔥',
    descripcion: 'Salsa especial para smash',
    stockMinimo: 1200
  },
  {
    slug: 'salsa-garlic',
    nombre: 'Salsa de Ajo',
    unit: 'ml',
    icon: '🧄',
    descripcion: 'Base para árabes y agregados',
    stockMinimo: 1000
  },
  {
    slug: 'papa-frita',
    nombre: 'Papa Pre-frita',
    unit: 'g',
    icon: '🍟',
    descripcion: 'Papas congeladas listas para freír',
    stockMinimo: 8000
  },
  {
    slug: 'aceite',
    nombre: 'Aceite de Fritura',
    unit: 'ml',
    icon: '🛢️',
    descripcion: 'Aceite alto rendimiento para freidora',
    stockMinimo: 5000
  },
  {
    slug: 'sal',
    nombre: 'Sal Especial',
    unit: 'g',
    icon: '🧂',
    descripcion: 'Sal con mezcla de especias',
    stockMinimo: 500
  },
  {
    slug: 'pollo-mechado',
    nombre: 'Pollo Mechado',
    unit: 'g',
    icon: '🍗',
    descripcion: 'Base para árabes de pollo',
    stockMinimo: 3000
  },
  {
    slug: 'pan-arabe',
    nombre: 'Pan Árabe',
    unit: 'unidad',
    icon: '🥙',
    descripcion: 'Pan árabe artesanal',
    stockMinimo: 40
  }
]


