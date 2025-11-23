import { supabase } from '@/lib/supabase'
import type { IngredientDefinition, IngredientRequirement, IngredientUnit } from '@/types/ingredients'

interface RecipeRow {
  producto_id: string
  cantidad: number
  unidad: IngredientUnit | null
  ingrediente: {
    id: string
    slug: string
    nombre: string
    unidad: IngredientUnit
  } | null
}

export async function fetchTenantIngredients(tenantId: string): Promise<IngredientDefinition[]> {
  const { data, error } = await supabase
    .from('ingredientes')
    .select(
      'id, tenant_id, slug, nombre, unidad, icono, precio_publico, stock_minimo_sugerido, descripcion, activo'
    )
    .eq('tenant_id', tenantId)
    .order('nombre')

  if (error) {
    console.error('Error fetching ingredientes', error)
    throw error
  }

  return (data ?? []) as IngredientDefinition[]
}

export async function fetchRecipesForProducts(
  tenantId: string,
  productIds: string[]
): Promise<Map<string, IngredientRequirement[]>> {
  if (!productIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('recetas_producto')
    .select(
      `
        producto_id,
        cantidad,
        unidad,
        ingrediente:ingrediente_id ( id, slug, nombre, unidad )
      `
    )
    .eq('tenant_id', tenantId)
    .in('producto_id', productIds)

  if (error) {
    console.error('Error fetching recetas_producto', error)
    throw error
  }

  const map = new Map<string, IngredientRequirement[]>()

  ;(data as RecipeRow[]).forEach((row) => {
    if (!row.ingrediente) return

    const requirement: IngredientRequirement = {
      ingredienteId: row.ingrediente.id,
      slug: row.ingrediente.slug,
      label: row.ingrediente.nombre,
      unit: row.unidad ?? row.ingrediente.unidad,
      quantityPerItem: row.cantidad
    }

    const existing = map.get(row.producto_id) ?? []
    existing.push(requirement)
    map.set(row.producto_id, existing)
  })

  return map
}

export async function fetchProductRecipe(
  tenantId: string,
  productId: string
): Promise<IngredientRequirement[]> {
  const map = await fetchRecipesForProducts(tenantId, [productId])
  return map.get(productId) ?? []
}



