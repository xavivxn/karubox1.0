'use client'

export type IngredientUnit = 'unidad' | 'g' | 'kg' | 'ml' | 'l'

export interface IngredientRequirement {
  slug: string
  label: string
  unit: IngredientUnit
  quantityPerItem: number // cantidad por producto en la unidad indicada
}

export type ProductRecipeMap = Record<string, IngredientRequirement[]>

const normalize = (value: string) => value.trim().toLowerCase()

/**
 * Recetas aproximadas basadas en el menú de Atlas Burger.
 * Estas cantidades se pueden ajustar fácilmente en el futuro o persistir en base de datos.
 */
export const PRODUCT_RECIPES: ProductRecipeMap = {
  [normalize('Clásica')]: [
    { slug: 'pan-brioche', label: 'Pan Brioche Atlas', unit: 'unidad', quantityPerItem: 1 },
    { slug: 'carne-120', label: 'Blend 120g', unit: 'g', quantityPerItem: 120 },
    { slug: 'cheddar', label: 'Queso Cheddar Bloque', unit: 'g', quantityPerItem: 30 },
    { slug: 'lechuga', label: 'Mix Verde', unit: 'g', quantityPerItem: 15 },
    { slug: 'tomate', label: 'Tomate Laminado', unit: 'g', quantityPerItem: 20 }
  ],
  [normalize('Mega Bacon')]: [
    { slug: 'pan-brioche', label: 'Pan Brioche Atlas', unit: 'unidad', quantityPerItem: 1 },
    { slug: 'carne-160', label: 'Blend 160g', unit: 'g', quantityPerItem: 160 },
    { slug: 'cheddar', label: 'Queso Cheddar Bloque', unit: 'g', quantityPerItem: 40 },
    { slug: 'bacon', label: 'Bacon Premium', unit: 'g', quantityPerItem: 35 },
    { slug: 'salsa-house', label: 'Salsa House', unit: 'ml', quantityPerItem: 20 }
  ],
  [normalize('Smash Atlas')]: [
    { slug: 'pan-smash', label: 'Pan Smash', unit: 'unidad', quantityPerItem: 1 },
    { slug: 'carne-90', label: 'Blend 90g', unit: 'g', quantityPerItem: 90 },
    { slug: 'cheddar', label: 'Queso Cheddar Bloque', unit: 'g', quantityPerItem: 25 },
    { slug: 'cebolla', label: 'Cebolla Picada', unit: 'g', quantityPerItem: 15 },
    { slug: 'salsa-smash', label: 'Salsa Smash', unit: 'ml', quantityPerItem: 15 }
  ],
  [normalize('Big Atlas')]: [
    { slug: 'pan-brioche', label: 'Pan Brioche Atlas', unit: 'unidad', quantityPerItem: 1 },
    { slug: 'carne-160', label: 'Blend 160g', unit: 'g', quantityPerItem: 160 },
    { slug: 'cheddar', label: 'Queso Cheddar Bloque', unit: 'g', quantityPerItem: 50 },
    { slug: 'huevo', label: 'Huevo', unit: 'unidad', quantityPerItem: 1 },
    { slug: 'mix-verde', label: 'Mix Verde', unit: 'g', quantityPerItem: 20 }
  ],
  [normalize('Papas Grandes')]: [
    { slug: 'papa-frita', label: 'Papa Pre-frita', unit: 'g', quantityPerItem: 300 },
    { slug: 'aceite', label: 'Aceite de Fritura', unit: 'ml', quantityPerItem: 40 },
    { slug: 'sal', label: 'Sal Especial', unit: 'g', quantityPerItem: 3 }
  ],
  [normalize('Nuggets')]: [
    { slug: 'nugget', label: 'Nugget Congelado', unit: 'unidad', quantityPerItem: 6 },
    { slug: 'aceite', label: 'Aceite de Fritura', unit: 'ml', quantityPerItem: 30 },
    { slug: 'salsa-house', label: 'Salsa House', unit: 'ml', quantityPerItem: 15 }
  ],
  [normalize('Árabe Pollo')]: [
    { slug: 'pan-arabe', label: 'Pan Árabe', unit: 'unidad', quantityPerItem: 1 },
    { slug: 'pollo-mechado', label: 'Pollo Mechado', unit: 'g', quantityPerItem: 140 },
    { slug: 'mix-verde', label: 'Mix Verde', unit: 'g', quantityPerItem: 25 },
    { slug: 'salsa-garlic', label: 'Salsa de Ajo', unit: 'ml', quantityPerItem: 20 }
  ],
  [normalize('Coca Cola 1,5L')]: [
    { slug: 'coca-15', label: 'Coca Cola 1.5L', unit: 'unidad', quantityPerItem: 1 }
  ]
}

export interface IngredientConsumption {
  slug: string
  label: string
  unit: IngredientUnit
  total: number
}

export const normalizeProductName = (name: string) => normalize(name)

export function getRecipeForProduct(productName: string): IngredientRequirement[] {
  return PRODUCT_RECIPES[normalize(productName)] ?? []
}

export function aggregateIngredientConsumption(
  items: Array<{ nombre: string; cantidad: number }>
): IngredientConsumption[] {
  const totals = new Map<string, IngredientConsumption>()

  for (const item of items) {
    const recipe = getRecipeForProduct(item.nombre)
    if (!recipe.length) continue

    for (const ingredient of recipe) {
      const key = ingredient.slug
      const totalIncrement = ingredient.quantityPerItem * item.cantidad

      if (totals.has(key)) {
        const current = totals.get(key)!
        totals.set(key, {
          ...current,
          total: current.total + totalIncrement
        })
      } else {
        totals.set(key, {
          slug: key,
          label: ingredient.label,
          unit: ingredient.unit,
          total: totalIncrement
        })
      }
    }
  }

  return Array.from(totals.values())
}


