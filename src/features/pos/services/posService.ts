import { createClient } from '@/lib/supabase/client'
import type { Categoria, Producto, ComboItemDB } from '../types/pos.types'

interface ComboItemRow {
  combo_id: string
  producto_id: string
  cantidad: number
  producto: { id: string; nombre: string; tiene_receta: boolean }
}

export const posService = {
  async loadCategorias(tenantId: string): Promise<Categoria[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categorias')
      .select('id,nombre,orden')
      .eq('tenant_id', tenantId)
      .eq('activa', true)
      .order('orden')

    if (error) throw error
    return (data || []) as Categoria[]
  },

  async loadProductos(tenantId: string): Promise<Producto[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('id,nombre,descripcion,precio,categoria_id,disponible,tiene_receta')
      .eq('tenant_id', tenantId)
      .eq('disponible', true)
      .neq('is_deleted', true)
      .order('nombre')

    if (error) throw error
    return (data || []) as Producto[]
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
