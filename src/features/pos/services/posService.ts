import { createClient } from '@/lib/supabase/client'
import type { Categoria, Producto } from '../types/pos.types'

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
      .select('id,nombre,descripcion,precio,categoria_id,disponible')
      .eq('tenant_id', tenantId)
      .eq('disponible', true)
      .neq('is_deleted', true)
      .order('nombre')

    if (error) throw error
    return (data || []) as Producto[]
  }
}
