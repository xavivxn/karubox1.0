import { createClient } from '@/lib/supabase/client'
import type { Categoria, Producto } from '../types/pos.types'

export const posService = {
  async loadCategorias(_tenantId: string): Promise<Categoria[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categorias')
      .select('id,nombre,orden')
      .eq('activa', true)
      .order('orden')

    if (error) throw error
    return (data || []) as Categoria[]
  },

  async loadProductos(_tenantId: string): Promise<Producto[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('id,nombre,descripcion,precio,categoria_id,disponible')
      .eq('disponible', true)
      .eq('is_deleted', false)
      .order('nombre')

    if (error) throw error
    return (data || []) as Producto[]
  }
}
