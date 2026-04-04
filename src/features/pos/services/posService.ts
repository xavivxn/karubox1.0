import { createClient } from '@/lib/supabase/client'
import type { Categoria, Producto, ComboItemDB } from '../types/pos.types'

interface ComboItemRow {
  combo_id: string
  producto_id: string
  cantidad: number
  producto: { id: string; nombre: string; tiene_receta: boolean }
}

/** Map producto_id -> total unidades vendidas (pedidos no cancelados) */
async function loadVentasPorProducto(tenantId: string): Promise<Map<string, number>> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_pos_ventas_por_producto', {
    p_tenant_id: tenantId
  })
  if (error) return new Map()
  const map = new Map<string, number>()
  for (const row of (data || []) as { producto_id: string; total_cantidad: number }[]) {
    map.set(row.producto_id, Number(row.total_cantidad) || 0)
  }
  return map
}

/** Map categoria_id -> total unidades vendidas (pedidos no cancelados) */
async function loadVentasPorCategoria(tenantId: string): Promise<Map<string, number>> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_pos_ventas_por_categoria', {
    p_tenant_id: tenantId
  })
  if (error) return new Map()
  const map = new Map<string, number>()
  for (const row of (data || []) as { categoria_id: string; total_cantidad: number }[]) {
    map.set(row.categoria_id, Number(row.total_cantidad) || 0)
  }
  return map
}

export const posService = {
  async loadCategorias(tenantId: string): Promise<Categoria[]> {
    const supabase = createClient()
    const [catRes, ventasMap] = await Promise.all([
      supabase
        .from('categorias')
        .select('id,nombre,orden,mostrar_en_pos')
        .eq('tenant_id', tenantId)
        .eq('activa', true)
        .order('orden'),
      loadVentasPorCategoria(tenantId)
    ])
    if (catRes.error) throw catRes.error
    const categorias = ((catRes.data || []) as Categoria[]).filter((c) => c.mostrar_en_pos !== false)
    // Más pedidos primero; mismo nivel: respetar orden luego nombre
    categorias.sort((a, b) => {
      const va = ventasMap.get(a.id) ?? 0
      const vb = ventasMap.get(b.id) ?? 0
      if (vb !== va) return vb - va
      if (a.orden !== b.orden) return a.orden - b.orden
      return (a.nombre || '').localeCompare(b.nombre || '')
    })
    return categorias
  },

  async loadProductos(tenantId: string): Promise<Producto[]> {
    const supabase = createClient()
    const [prodRes, ventasMap, catVis] = await Promise.all([
      supabase
        .from('productos')
        .select('id,nombre,descripcion,precio,categoria_id,disponible,tiene_receta,puntos_extra')
        .eq('tenant_id', tenantId)
        .eq('disponible', true)
        .neq('is_deleted', true)
        .order('nombre'),
      loadVentasPorProducto(tenantId),
      supabase.from('categorias').select('id,mostrar_en_pos').eq('tenant_id', tenantId),
    ])
    if (prodRes.error) throw prodRes.error
    if (catVis.error) throw catVis.error
    const hiddenCatIds = new Set(
      (catVis.data || [])
        .filter((row: { mostrar_en_pos: boolean | null }) => row.mostrar_en_pos === false)
        .map((row: { id: string }) => row.id)
    )
    const productos = ((prodRes.data || []) as Producto[]).filter(
      (p) => !p.categoria_id || !hiddenCatIds.has(p.categoria_id)
    )
    // Más pedidos primero; mismo nivel: orden por nombre
    productos.sort((a, b) => {
      const va = ventasMap.get(a.id) ?? 0
      const vb = ventasMap.get(b.id) ?? 0
      if (vb !== va) return vb - va
      return (a.nombre || '').localeCompare(b.nombre || '')
    })
    return productos
  },

  async loadComboItems(tenantId: string): Promise<Map<string, ComboItemDB[]>> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('combo_items')
      .select('combo_id, producto_id, cantidad, producto:producto_id(id, nombre, tiene_receta)')
      .eq('tenant_id', tenantId)

    if (error) throw error

    const map = new Map<string, ComboItemDB[]>()
    for (const row of (data || []) as unknown as ComboItemRow[]) {
      if (!row.producto) continue
      const items = map.get(row.combo_id) ?? []
      items.push({
        producto_id: row.producto_id,
        cantidad: row.cantidad,
        producto: row.producto
      })
      map.set(row.combo_id, items)
    }
    return map
  }
}
