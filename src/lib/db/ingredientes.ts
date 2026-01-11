import { createClient } from '@/lib/supabase/client'

/**
 * Tipos para ingredientes e inventario
 */
export interface Ingrediente {
  id: string
  tenant_id: string
  slug: string
  nombre: string
  tipo_inventario: 'discreto' | 'fraccionable'
  unidad: string
  stock_actual: number
  stock_minimo: number
  icono?: string
  precio_publico?: number
  controlar_stock: boolean
  descripcion?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface MovimientoIngrediente {
  id: string
  tenant_id: string
  ingrediente_id: string
  tipo: 'entrada' | 'salida' | 'ajuste' | 'inicial'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo?: string
  pedido_id?: string
  usuario_id?: string
  created_at: string
}

export interface IngredienteConStock extends Ingrediente {
  stock_bajo: boolean
}

/**
 * Obtener todos los ingredientes de un tenant
 */
export async function getIngredientes(tenantId: string): Promise<Ingrediente[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ingredientes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('activo', true)
    .order('nombre')
  
  if (error) {
    console.error('Error al obtener ingredientes:', error)
    throw new Error(`Error al obtener ingredientes: ${error.message}`)
  }
  
  return data as Ingrediente[]
}

/**
 * Obtener un ingrediente por ID
 */
export async function getIngredienteById(id: string): Promise<Ingrediente | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ingredientes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No se encontró el ingrediente
      return null
    }
    console.error('Error al obtener ingrediente:', error)
    throw new Error(`Error al obtener ingrediente: ${error.message}`)
  }
  
  return data as Ingrediente
}

/**
 * Obtener ingredientes con stock bajo
 */
export async function getIngredientesBajoStock(tenantId: string): Promise<IngredienteConStock[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vista_ingredientes_stock_bajo')
    .select('*')
    .eq('tenant_id', tenantId)
  
  if (error) {
    console.error('Error al obtener ingredientes con stock bajo:', error)
    throw new Error(`Error al obtener ingredientes con stock bajo: ${error.message}`)
  }
  
  return data as IngredienteConStock[]
}

/**
 * Actualizar el stock de un ingrediente
 * @param ingredienteId - ID del ingrediente
 * @param cantidad - Cantidad a sumar (positivo) o restar (negativo)
 * @param tipo - Tipo de movimiento: 'entrada', 'salida', 'ajuste', 'inicial'
 * @param motivo - Motivo del movimiento (opcional)
 * @param pedidoId - ID del pedido relacionado (opcional, solo para tipo 'salida')
 * @param usuarioId - ID del usuario que realiza el movimiento (opcional)
 */
export async function updateStockIngrediente(
  ingredienteId: string,
  cantidad: number,
  tipo: 'entrada' | 'salida' | 'ajuste' | 'inicial',
  motivo?: string,
  pedidoId?: string,
  usuarioId?: string
): Promise<{ success: boolean; nuevoStock: number }> {
  const supabase = createClient()
  
  try {
    // 1. Obtener el ingrediente actual
    const ingrediente = await getIngredienteById(ingredienteId)
    if (!ingrediente) {
      throw new Error('Ingrediente no encontrado')
    }
    
    // 2. Calcular nuevo stock
    const stockAnterior = ingrediente.stock_actual
    let nuevoStock = stockAnterior
    
    if (tipo === 'entrada' || tipo === 'inicial') {
      nuevoStock = stockAnterior + cantidad
    } else if (tipo === 'salida') {
      nuevoStock = stockAnterior - cantidad
    } else if (tipo === 'ajuste') {
      // Para ajuste, la cantidad es el nuevo valor absoluto
      nuevoStock = cantidad
    }
    
    // 3. Validar que no quede negativo (excepto para ajuste manual)
    if (nuevoStock < 0 && tipo !== 'ajuste') {
      throw new Error(`Stock insuficiente para ${ingrediente.nombre}. Stock actual: ${stockAnterior}, cantidad solicitada: ${cantidad}`)
    }
    
    // 4. Actualizar stock en la tabla ingredientes
    const { error: updateError } = await supabase
      .from('ingredientes')
      .update({ 
        stock_actual: nuevoStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', ingredienteId)
    
    if (updateError) {
      throw new Error(`Error al actualizar stock: ${updateError.message}`)
    }
    
    // 5. Registrar el movimiento
    await registrarMovimientoIngrediente({
      tenantId: ingrediente.tenant_id,
      ingredienteId,
      tipo,
      cantidad: tipo === 'ajuste' ? cantidad : Math.abs(cantidad),
      stockAnterior,
      stockNuevo: nuevoStock,
      motivo,
      pedidoId,
      usuarioId
    })
    
    return { success: true, nuevoStock }
    
  } catch (error) {
    console.error('Error en updateStockIngrediente:', error)
    throw error
  }
}

/**
 * Registrar un movimiento de ingrediente en el historial
 */
export async function registrarMovimientoIngrediente(params: {
  tenantId: string
  ingredienteId: string
  tipo: 'entrada' | 'salida' | 'ajuste' | 'inicial'
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  motivo?: string
  pedidoId?: string
  usuarioId?: string
}): Promise<MovimientoIngrediente> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('movimientos_ingredientes')
    .insert({
      tenant_id: params.tenantId,
      ingrediente_id: params.ingredienteId,
      tipo: params.tipo,
      cantidad: params.cantidad,
      stock_anterior: params.stockAnterior,
      stock_nuevo: params.stockNuevo,
      motivo: params.motivo,
      pedido_id: params.pedidoId,
      usuario_id: params.usuarioId
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error al registrar movimiento de ingrediente:', error)
    throw new Error(`Error al registrar movimiento: ${error.message}`)
  }
  
  return data as MovimientoIngrediente
}

/**
 * Cargar stock de un ingrediente (wrapper para entrada de stock)
 * @param ingredienteId - ID del ingrediente
 * @param cantidad - Cantidad a agregar (siempre positiva)
 * @param motivo - Motivo de la carga (ej: "Compra", "Donación", "Corrección")
 * @param usuarioId - ID del usuario que realiza la carga
 */
export async function cargarStockIngrediente(
  ingredienteId: string,
  cantidad: number,
  motivo: string,
  usuarioId?: string
): Promise<{ success: boolean; nuevoStock: number }> {
  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a cero')
  }
  
  return updateStockIngrediente(
    ingredienteId,
    cantidad,
    'entrada',
    motivo,
    undefined,
    usuarioId
  )
}

/**
 * Obtener el historial de movimientos de un ingrediente
 */
export async function getMovimientosIngrediente(
  ingredienteId: string,
  limite?: number
): Promise<MovimientoIngrediente[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('movimientos_ingredientes')
    .select('*')
    .eq('ingrediente_id', ingredienteId)
    .order('created_at', { ascending: false })
  
  if (limite) {
    query = query.limit(limite)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error al obtener movimientos:', error)
    throw new Error(`Error al obtener movimientos: ${error.message}`)
  }
  
  return data as MovimientoIngrediente[]
}

/**
 * Verificar si hay stock suficiente de un ingrediente
 */
export async function verificarStockDisponible(
  ingredienteId: string,
  cantidadRequerida: number
): Promise<{ disponible: boolean; stockActual: number; faltante: number }> {
  const ingrediente = await getIngredienteById(ingredienteId)
  
  if (!ingrediente) {
    throw new Error('Ingrediente no encontrado')
  }
  
  const disponible = ingrediente.stock_actual >= cantidadRequerida
  const faltante = disponible ? 0 : cantidadRequerida - ingrediente.stock_actual
  
  return {
    disponible,
    stockActual: ingrediente.stock_actual,
    faltante
  }
}

/**
 * Obtener todos los ingredientes con información de stock bajo
 */
export async function getIngredientesConAlerta(tenantId: string): Promise<IngredienteConStock[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('ingredientes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('activo', true)
    .eq('controlar_stock', true)
    .order('nombre')
  
  if (error) {
    console.error('Error al obtener ingredientes con alerta:', error)
    throw new Error(`Error al obtener ingredientes: ${error.message}`)
  }
  
  // Agregar la propiedad stock_bajo
  const ingredientesConAlerta = (data as Ingrediente[]).map(ing => ({
    ...ing,
    stock_bajo: ing.stock_actual <= ing.stock_minimo
  }))
  
  return ingredientesConAlerta
}
