'use client'

import { createClient } from '@/lib/supabase/client'
import { CartItem } from '@/store/cartStore'
import { fetchRecipesForProducts } from '@/lib/api/ingredients'
import { updateStockIngrediente } from '@/lib/db/ingredientes'
import type { IngredientConsumption, IngredientRequirement, IngredientUnit } from '@/types/ingredients'

type InventoryRow = {
  id: string
  stock_actual: number
  stock_minimo: number
  unidad: string
  producto_id: string | null
  productos?: {
    nombre: string | null
  } | null
}

const unitFactor: Record<string, number> = {
  g: 1,
  gr: 1,
  grs: 1,
  kg: 1000,
  kilogramo: 1000,
  unidad: 1,
  unidades: 1,
  ml: 1,
  mililitro: 1,
  l: 1000,
  litro: 1000
}

const normalizeUnit = (unit: string | null | undefined): IngredientUnit | string => {
  if (!unit) return 'unidad'
  const lower = unit.toLowerCase()
  if (lower.includes('kg')) return 'kg'
  if (lower.includes('g')) return 'g'
  if (lower.includes('ml')) return 'ml'
  if (lower.includes('l')) return 'l'
  return 'unidad'
}

const convertUnits = (value: number, from: IngredientUnit, to: IngredientUnit | string) => {
  if (from === to) return value
  const fromFactor = unitFactor[from]
  const toFactor = unitFactor[to] ?? unitFactor[normalizeUnit(to) as IngredientUnit]
  if (!fromFactor || !toFactor) {
    return value
  }
  return (value * fromFactor) / toFactor
}

interface ApplyInventoryArgs {
  tenantId: string
  items: CartItem[]
  pedidoId: string
  pedidoNumero: number
  usuarioId: string | null
}

const normalizeProductName = (value: string) => value.trim().toLowerCase()

const collectIngredientTotals = (
  totalsMap: Map<string, IngredientConsumption>,
  requirements: IngredientRequirement[],
  multiplier: number
) => {
  requirements.forEach((ingredient) => {
    const key = ingredient.slug
    const increment = ingredient.quantityPerItem * multiplier

    if (totalsMap.has(key)) {
      const current = totalsMap.get(key)!
      current.total += increment
    } else {
      totalsMap.set(key, {
        slug: ingredient.slug,
        label: ingredient.label,
        unit: ingredient.unit,
        total: increment
      })
    }
  })
}

/**
 * Descuenta inventario estimado según las recetas definidas para cada producto.
 * Si un insumo no existe en inventario, se ignora y sólo se registra en consola.
 */
export async function applyInventoryConsumption({
  tenantId,
  items,
  pedidoId,
  pedidoNumero,
  usuarioId
}: ApplyInventoryArgs) {
  if (!tenantId || !items.length) return

  const supabase = createClient()
  const totalsMap = new Map<string, IngredientConsumption>()
  const productIds = Array.from(
    new Set(
      items
        .filter((item) => !item.customization?.resolvedRecipe?.length && item.producto_id)
        .map((item) => item.producto_id as string)
    )
  )
  const recipeMap = productIds.length
    ? await fetchRecipesForProducts(tenantId, productIds)
    : new Map<string, IngredientRequirement[]>()

  for (const item of items) {
    if (item.customization?.resolvedRecipe?.length) {
      collectIngredientTotals(totalsMap, item.customization.resolvedRecipe, item.cantidad)
      continue
    }

    if (!item.producto_id) continue

    const recipe = recipeMap.get(item.producto_id)
    if (!recipe?.length) continue

    collectIngredientTotals(totalsMap, recipe, item.cantidad)
  }

  const ingredientTotals = Array.from(totalsMap.values())
  if (!ingredientTotals.length) return

  const { data: inventoryRows, error } = await supabase
    .from('inventario')
    .select('id, stock_actual, stock_minimo, unidad, producto_id, productos:producto_id ( nombre )')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error cargando inventario para consumo:', error)
    return
  }

  if (!inventoryRows?.length) return

  const inventoryMap = new Map<string, InventoryRow>()

  inventoryRows.forEach(row => {
    // Supabase devuelve un objeto anidado para la relación productos
    const productosData = row.productos as unknown as { nombre: string | null } | null
    const displayName = productosData?.nombre
    
    if (displayName) {
      const inventoryRow: InventoryRow = {
        id: row.id,
        stock_actual: Number(row.stock_actual ?? 0),
        stock_minimo: Number(row.stock_minimo ?? 0),
        unidad: row.unidad,
        producto_id: row.producto_id,
        productos: productosData
      }
      inventoryMap.set(normalizeProductName(displayName), inventoryRow)
    }
  })

  for (const ingredient of ingredientTotals) {
    const inventoryRow =
      inventoryMap.get(normalizeProductName(ingredient.label)) ??
      inventoryMap.get(ingredient.slug)

    if (!inventoryRow) {
      console.warn(
        `[Inventario] No se encontró insumo "${ingredient.label}". Crea un producto con ese nombre y asócialo al inventario para habilitar el descuento automático.`
      )
      continue
    }

    const inventoryUnit = normalizeUnit(inventoryRow.unidad) as IngredientUnit
    const quantityToDiscount = convertUnits(ingredient.total, ingredient.unit, inventoryUnit)
    if (!quantityToDiscount || Number.isNaN(quantityToDiscount)) {
      continue
    }

    const previousStock = Number(inventoryRow.stock_actual ?? 0)
    const newStock = Math.max(previousStock - quantityToDiscount, 0)

    const { error: updateError } = await supabase
      .from('inventario')
      .update({
        stock_actual: newStock
      })
      .eq('id', inventoryRow.id)

    if (updateError) {
      console.error('Error actualizando inventario:', updateError)
      continue
    }

    await supabase.from('movimientos_inventario').insert({
      inventario_id: inventoryRow.id,
      pedido_id: pedidoId,
      tipo: 'salida',
      cantidad: -quantityToDiscount,
      stock_anterior: previousStock,
      stock_nuevo: newStock,
      motivo: `Consumo automático por pedido #${pedidoNumero}`,
      usuario_id: usuarioId ?? undefined
    })
  }
}

export function getIngredientEstimationFromItems(
  tenantId: string,
  items: Array<{ producto_id: string | null; producto_nombre: string; cantidad: number }>
): Promise<IngredientConsumption[]> {
  const productIds = Array.from(
    new Set(items.map((item) => item.producto_id).filter((id): id is string => Boolean(id)))
  )

  if (!productIds.length) {
    return Promise.resolve([])
  }

  return fetchRecipesForProducts(tenantId, productIds).then((recipeMap) => {
    const totalsMap = new Map<string, IngredientConsumption>()

    items.forEach((item) => {
      if (!item.producto_id) return
      const recipe = recipeMap.get(item.producto_id)
      if (!recipe?.length) return
      collectIngredientTotals(totalsMap, recipe, item.cantidad)
    })

    return Array.from(totalsMap.values())
  })
}

/**
 * NUEVO SISTEMA: Descuenta ingredientes o inventario según tipo de producto
 * 
 * Para productos con receta (tiene_receta=true):
 *   - Descuenta de la tabla ingredientes según recetas_producto
 *   - Aplica customización (extras suman, removidos no descuentan)
 *   - Guarda customización en items_pedido_customizacion
 * 
 * Para productos sin receta (tiene_receta=false):
 *   - Descuenta de la tabla inventario (productos terminados como Coca Cola)
 */
export async function descontarIngredientesPorPedido({
  tenantId,
  items,
  pedidoId,
  pedidoNumero,
  usuarioId
}: ApplyInventoryArgs): Promise<{ success: boolean; errores: string[] }> {
  if (!tenantId || !items.length) {
    return { success: true, errores: [] }
  }

  const supabase = createClient()
  const errores: string[] = []

  try {
    // 1. Obtener información de productos (con campo tiene_receta)
    const productoIds = items
      .map(item => item.producto_id)
      .filter((id): id is string => Boolean(id))
    
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre, tiene_receta')
      .in('id', productoIds)
    
    if (productosError) {
      console.error('Error al obtener productos:', productosError)
      errores.push('Error al obtener información de productos')
      return { success: false, errores }
    }

    const productosMap = new Map(
      (productos || []).map(p => [p.id, p])
    )

    // 2. Procesar cada item del pedido
    for (const item of items) {
      if (!item.producto_id) continue

      const producto = productosMap.get(item.producto_id)
      if (!producto) {
        console.warn(`Producto ${item.nombre} no encontrado`)
        continue
      }

      // 3. Decidir si descuenta de ingredientes o de inventario
      if (producto.tiene_receta) {
        // Producto fabricado: descontar ingredientes según receta
        await descontarIngredientesDeReceta({
          supabase,
          tenantId,
          item,
          pedidoId,
          pedidoNumero,
          usuarioId,
          errores
        })
      } else {
        // Producto terminado: descontar de inventario
        await descontarDeInventario({
          supabase,
          tenantId,
          productoId: item.producto_id,
          productoNombre: item.nombre,
          cantidad: item.cantidad,
          pedidoId,
          pedidoNumero,
          usuarioId,
          errores
        })
      }
    }

    return { success: errores.length === 0, errores }
  } catch (error) {
    console.error('Error en descontarIngredientesPorPedido:', error)
    errores.push('Error general al procesar descuento de inventario')
    return { success: false, errores }
  }
}

/**
 * Descuenta ingredientes de un producto con receta
 */
async function descontarIngredientesDeReceta({
  supabase,
  tenantId,
  item,
  pedidoId,
  pedidoNumero,
  usuarioId,
  errores
}: {
  supabase: any
  tenantId: string
  item: CartItem
  pedidoId: string
  pedidoNumero: number
  usuarioId: string | null
  errores: string[]
}) {
  try {
    // 1. Obtener receta del producto
    const { data: receta, error: recetaError } = await supabase
      .from('recetas_producto')
      .select(`
        id,
        ingrediente_id,
        cantidad,
        unidad,
        obligatorio,
        ingredientes:ingrediente_id (
          id,
          slug,
          nombre,
          unidad,
          tipo_inventario,
          stock_actual,
          controlar_stock
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('producto_id', item.producto_id)

    if (recetaError) {
      console.error('Error al obtener receta:', recetaError)
      errores.push(`Error al obtener receta de ${item.nombre}`)
      return
    }

    if (!receta || receta.length === 0) {
      console.warn(`Producto ${item.nombre} no tiene receta definida`)
      return
    }

    // 2. Crear mapa de ingredientes removidos por el cliente
    const ingredientesRemovidos = new Set(
      (item.customization?.removedIngredients || []).map(ing => ing.slug)
    )

    // 3. Crear mapa de extras agregados
    const extrasMap = new Map(
      (item.customization?.extras || []).map(extra => [
        extra.slug,
        extra.quantityPerItem
      ])
    )

    // 4. Procesar cada ingrediente de la receta
    for (const recetaItem of receta) {
      const ingrediente = recetaItem.ingredientes as any
      if (!ingrediente || !ingrediente.controlar_stock) continue

      const ingredienteSlug = ingrediente.slug
      
      // Si el ingrediente fue removido, no descontar
      if (ingredientesRemovidos.has(ingredienteSlug)) {
        console.log(`Ingrediente ${ingrediente.nombre} removido, no se descuenta`)
        
        // Guardar customización en items_pedido_customizacion
        await guardarCustomizacion({
          supabase,
          tenantId,
          pedidoId,
          itemPedidoId: item.id, // Esto debería venir del item insertado en items_pedido
          ingredienteId: ingrediente.id,
          tipo: 'removido',
          cantidadOriginal: recetaItem.cantidad,
          cantidadAjustada: 0
        })
        continue
      }

      // Calcular cantidad total a descontar
      let cantidadBase = recetaItem.cantidad * item.cantidad
      
      // Si hay extras de este ingrediente, agregar
      if (extrasMap.has(ingredienteSlug)) {
        const extraPorItem = extrasMap.get(ingredienteSlug)!
        cantidadBase += extraPorItem * item.cantidad
        
        // Guardar customización de extra
        await guardarCustomizacion({
          supabase,
          tenantId,
          pedidoId,
          itemPedidoId: item.id,
          ingredienteId: ingrediente.id,
          tipo: 'extra',
          cantidadOriginal: recetaItem.cantidad,
          cantidadAjustada: recetaItem.cantidad + extraPorItem
        })
      }

      // Descontar del stock de ingredientes
      try {
        await updateStockIngrediente(
          ingrediente.id,
          cantidadBase,
          'salida',
          `Venta pedido #${pedidoNumero}`,
          pedidoId,
          usuarioId || undefined
        )
      } catch (error: any) {
        console.error(`Error al descontar ${ingrediente.nombre}:`, error)
        errores.push(`Stock insuficiente de ${ingrediente.nombre}`)
      }
    }
  } catch (error) {
    console.error('Error en descontarIngredientesDeReceta:', error)
    errores.push(`Error al procesar ingredientes de ${item.nombre}`)
  }
}

/**
 * Descuenta de inventario para productos sin receta
 */
async function descontarDeInventario({
  supabase,
  tenantId,
  productoId,
  productoNombre,
  cantidad,
  pedidoId,
  pedidoNumero,
  usuarioId,
  errores
}: {
  supabase: any
  tenantId: string
  productoId: string
  productoNombre: string
  cantidad: number
  pedidoId: string
  pedidoNumero: number
  usuarioId: string | null
  errores: string[]
}) {
  try {
    // 1. Buscar en inventario
    const { data: inventario, error: inventarioError } = await supabase
      .from('inventario')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('producto_id', productoId)
      .single()

    if (inventarioError || !inventario) {
      console.warn(`Producto ${productoNombre} no tiene registro en inventario`)
      return
    }

    if (!inventario.controlar_stock) {
      console.log(`Producto ${productoNombre} no controla stock`)
      return
    }

    // 2. Verificar stock suficiente
    const stockAnterior = Number(inventario.stock_actual || 0)
    if (stockAnterior < cantidad) {
      errores.push(`Stock insuficiente de ${productoNombre}. Disponible: ${stockAnterior}, solicitado: ${cantidad}`)
      return
    }

    // 3. Descontar stock
    const stockNuevo = stockAnterior - cantidad

    const { error: updateError } = await supabase
      .from('inventario')
      .update({
        stock_actual: stockNuevo,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventario.id)

    if (updateError) {
      console.error('Error al actualizar inventario:', updateError)
      errores.push(`Error al descontar ${productoNombre}`)
      return
    }

    // 4. Registrar movimiento
    await supabase.from('movimientos_inventario').insert({
      tenant_id: tenantId,
      inventario_id: inventario.id,
      pedido_id: pedidoId,
      tipo: 'salida',
      cantidad: -cantidad,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      motivo: `Venta pedido #${pedidoNumero}`,
      usuario_id: usuarioId || undefined
    })

    console.log(`Descontado ${cantidad} ${inventario.unidad} de ${productoNombre}`)
  } catch (error) {
    console.error('Error en descontarDeInventario:', error)
    errores.push(`Error al procesar ${productoNombre}`)
  }
}

/**
 * Guarda la customización de un item en la tabla items_pedido_customizacion
 */
async function guardarCustomizacion({
  supabase,
  tenantId,
  pedidoId,
  itemPedidoId,
  ingredienteId,
  tipo,
  cantidadOriginal,
  cantidadAjustada
}: {
  supabase: any
  tenantId: string
  pedidoId: string
  itemPedidoId: string
  ingredienteId: string
  tipo: 'extra' | 'removido' | 'modificado'
  cantidadOriginal: number
  cantidadAjustada: number
}) {
  try {
    await supabase.from('items_pedido_customizacion').insert({
      tenant_id: tenantId,
      pedido_id: pedidoId,
      item_pedido_id: itemPedidoId,
      ingrediente_id: ingredienteId,
      tipo,
      cantidad_original: cantidadOriginal,
      cantidad_ajustada: cantidadAjustada
    })
  } catch (error) {
    console.error('Error al guardar customización:', error)
  }
}



