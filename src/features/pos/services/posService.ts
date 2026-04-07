import { createClient } from '@/lib/supabase/client'
import type { Categoria, Producto, ComboItemDB, SauceProduct } from '../types/pos.types'

const SAUCES_CATEGORY_NAME = 'Salsas'

interface ComboItemRow {
  combo_id: string
  producto_id: string
  cantidad: number
  producto: { id: string; nombre: string; tiene_receta: boolean }
}

interface CategoriaRow {
  id: string
  nombre: string
  orden: number
  mostrar_en_pos: boolean | null
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
  async loadCatalog(tenantId: string): Promise<{ categorias: Categoria[]; productos: Producto[] }> {
    const supabase = createClient()

    const [catRes, prodRes, ventasCategoria, ventasProducto] = await Promise.all([
      supabase
        .from('categorias')
        .select('id,nombre,orden,mostrar_en_pos')
        .eq('tenant_id', tenantId)
        .eq('activa', true),
      supabase
        .from('productos')
        .select('id,nombre,descripcion,precio,categoria_id,disponible,tiene_receta,puntos_extra')
        .eq('tenant_id', tenantId)
        .eq('disponible', true)
        .neq('is_deleted', true)
        .order('nombre'),
      loadVentasPorCategoria(tenantId),
      loadVentasPorProducto(tenantId),
    ])

    if (catRes.error) throw catRes.error
    if (prodRes.error) throw prodRes.error

    const categoriaRows = (catRes.data || []) as CategoriaRow[]
    const categorias: Categoria[] = categoriaRows
      .filter((c) => c.mostrar_en_pos !== false)
      .map((c) => ({
        ...c,
        mostrar_en_pos: c.mostrar_en_pos ?? true,
      }))
    categorias.sort((a, b) => {
      const va = ventasCategoria.get(a.id) ?? 0
      const vb = ventasCategoria.get(b.id) ?? 0
      if (vb !== va) return vb - va
      if (a.orden !== b.orden) return a.orden - b.orden
      return (a.nombre || '').localeCompare(b.nombre || '')
    })

    const hiddenCatIds = new Set(
      categoriaRows
        .filter((row) => row.mostrar_en_pos === false)
        .map((row) => row.id)
    )

    const productos = ((prodRes.data || []) as Producto[]).filter(
      (p) => !p.categoria_id || !hiddenCatIds.has(p.categoria_id)
    )
    productos.sort((a, b) => {
      const va = ventasProducto.get(a.id) ?? 0
      const vb = ventasProducto.get(b.id) ?? 0
      if (vb !== va) return vb - va
      return (a.nombre || '').localeCompare(b.nombre || '')
    })

    return { categorias, productos }
  },

  async loadCategorias(tenantId: string): Promise<Categoria[]> {
    const { categorias } = await this.loadCatalog(tenantId)
    return categorias
  },

  async loadProductos(tenantId: string): Promise<Producto[]> {
    const { productos } = await this.loadCatalog(tenantId)
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
  },

  /**
   * Salsas del tenant (categoría "Salsas"), aunque esté oculta en el catálogo POS.
   * Misma lógica que el drawer de salsas del carrito.
   */
  async loadSauceProducts(tenantId: string): Promise<SauceProduct[]> {
    const supabase = createClient()
    const { data: cat, error: catErr } = await supabase
      .from('categorias')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('nombre', SAUCES_CATEGORY_NAME)
      .maybeSingle()

    if (catErr) throw catErr
    if (!cat?.id) return []

    const { data: prods, error: prodErr } = await supabase
      .from('productos')
      .select('id, nombre, descripcion, precio')
      .eq('tenant_id', tenantId)
      .eq('categoria_id', cat.id)
      .eq('is_deleted', false)
      .eq('disponible', true)
      .order('nombre')

    if (prodErr) throw prodErr
    return (prods ?? []) as SauceProduct[]
  },
}
