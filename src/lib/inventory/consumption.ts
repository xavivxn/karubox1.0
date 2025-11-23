'use client'

import { supabase } from '@/lib/supabase'
import { CartItem } from '@/store/cartStore'
import {
  IngredientConsumption,
  IngredientUnit,
  aggregateIngredientConsumption,
  normalizeProductName
} from '@/data/inventoryRecipes'

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

  const ingredientTotals = aggregateIngredientConsumption(
    items.map(item => ({ nombre: item.nombre, cantidad: item.cantidad }))
  )

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
    const displayName = row.productos?.nombre
    if (displayName) {
      inventoryMap.set(normalizeProductName(displayName), {
        ...row,
        stock_actual: Number(row.stock_actual ?? 0),
        stock_minimo: Number(row.stock_minimo ?? 0)
      })
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
  items: Array<{ producto_nombre: string; cantidad: number }>
): IngredientConsumption[] {
  return aggregateIngredientConsumption(
    items.map(item => ({ nombre: item.producto_nombre, cantidad: item.cantidad }))
  )
}


