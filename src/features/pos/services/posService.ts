import { createClient } from '@/lib/supabase/client'
import type { Categoria, Producto } from '../types/pos.types'

export const posService = {
  async loadCategorias(tenantId: string): Promise<Categoria[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('activa', true)
      .order('orden')

    if (error) throw error
    return data || []
  },

  async loadProductos(tenantId: string): Promise<Producto[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('disponible', true)
      .eq('is_deleted', false)
      .order('nombre')

    if (error) throw error
    return data || []
  }
}
