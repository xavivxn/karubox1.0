import { createClient } from '@/lib/supabase/client'
import { applyInventoryConsumption } from '@/lib/inventory/consumption'
import type { CartItem } from '@/store/cartStore'
import type { Cliente } from '@/types/supabase'
import type { TipoPedido, FeedbackDetail } from '../types/pos.types'
import { calcularPuntos, formatTipoPedido } from '../utils/pos.utils'
import { formatGuaranies } from '@/lib/utils/format'
// ✅ Ya NO necesitamos printService - el agente imprime automáticamente vía Realtime
// import { printService } from './printService'

interface ConfirmOrderParams {
  tenantId: string
  usuarioId: string
  tenantNombre: string
  usuarioNombre: string
  cliente: Cliente | null
  tipo: TipoPedido
  items: CartItem[]
  total: number
}

export const orderService = {
  async confirmOrder(params: ConfirmOrderParams) {
    const supabase = createClient()
    const { tenantId, usuarioId, tenantNombre, usuarioNombre, cliente, tipo, items, total } = params

    if (!tipo) {
      throw new Error('El tipo de pedido es requerido')
    }

    if (items.length === 0) {
      throw new Error('El carrito está vacío')
    }

    const puntosGenerados = calcularPuntos(total)

    // Crear pedido con estado_pedido = 'FACT' para disparar impresión automática vía Realtime
    // El agente detectará este cambio y imprimirá automáticamente
    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .insert({
        tenant_id: tenantId,
        cliente_id: cliente?.id || null,
        usuario_id: usuarioId,
        tipo,
        total,
        puntos_generados: cliente ? puntosGenerados : 0,
        estado_pedido: 'FACT' // ✅ Esto dispara la impresión automática vía Supabase Realtime
      })
      .select()
      .single()

    if (errorPedido) throw errorPedido

    // Verificar que los productos existen antes de insertar
    const productoIds = items.map(item => item.producto_id).filter(Boolean)
    let validProductIds: Set<string> = new Set()
    
    if (productoIds.length > 0) {
      const { data: productosExistentes, error: errorProductos } = await supabase
        .from('productos')
        .select('id')
        .in('id', productoIds)
        .eq('tenant_id', tenantId)
        .eq('is_deleted', false)
      
      if (errorProductos) {
        console.warn('⚠️ Error al verificar productos existentes:', errorProductos)
      } else {
        validProductIds = new Set(productosExistentes?.map(p => p.id) || [])
      }
    }

    // Insertar items del pedido
    // Si el producto no existe, usar null para producto_id pero mantener producto_nombre
    const itemsToInsert = items.map((item) => {
      const productoExiste = validProductIds.has(item.producto_id)
      return {
        pedido_id: pedido.id,
        producto_id: productoExiste ? item.producto_id : null, // NULL si el producto no existe
        producto_nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.subtotal
      }
    })

    console.log('📦 Insertando items del pedido:', {
      pedido_id: pedido.id,
      items_count: itemsToInsert.length,
      productos_validos: validProductIds.size,
      productos_invalidos: productoIds.length - validProductIds.size,
      items: itemsToInsert
    })

    const { data: insertedItems, error: errorItems } = await supabase
      .from('items_pedido')
      .insert(itemsToInsert)
      .select()

    if (errorItems) {
      console.error('❌ Error al insertar items del pedido:', {
        error: errorItems,
        code: errorItems.code,
        message: errorItems.message,
        details: errorItems.details,
        hint: errorItems.hint
      })
      throw errorItems
    }

    console.log('✅ Items del pedido insertados correctamente:', insertedItems)
    
    // Advertir si algún producto no existía
    const productosInvalidos = items.filter(item => !validProductIds.has(item.producto_id))
    if (productosInvalidos.length > 0) {
      console.warn('⚠️ Algunos productos no se encontraron en la base de datos:', {
        productos: productosInvalidos.map(p => ({ id: p.producto_id, nombre: p.nombre }))
      })
    }

    // Actualizar puntos del cliente
    if (cliente && puntosGenerados > 0) {
      const nuevosPuntos = cliente.puntos_totales + puntosGenerados

      const { error: errorCliente } = await supabase
        .from('clientes')
        .update({ puntos_totales: nuevosPuntos })
        .eq('id', cliente.id)

      if (errorCliente) throw errorCliente

      await supabase.from('transacciones_puntos').insert({
        tenant_id: tenantId,
        cliente_id: cliente.id,
        pedido_id: pedido.id,
        tipo: 'ganado',
        puntos: puntosGenerados,
        saldo_anterior: cliente.puntos_totales,
        saldo_nuevo: nuevosPuntos,
        descripcion: `Puntos ganados por pedido #${pedido.numero_pedido}`
      })
    }

    // Aplicar consumo de inventario
    applyInventoryConsumption({
      tenantId,
      items,
      pedidoId: pedido.id,
      pedidoNumero: pedido.numero_pedido,
      usuarioId
    }).catch((consumptionError) => {
      console.warn('No se pudo descontar inventario automáticamente', consumptionError)
    })

    // ✅ Impresión automática vía Supabase Realtime
    // El agente detectará el cambio en estado_pedido = 'FACT' e imprimirá automáticamente
    // Ya NO necesitamos llamar a printService.printKitchenTicket()
    // El agente escucha cambios en la tabla 'pedidos' y procesa la impresión localmente
    console.log('✅ Pedido confirmado con estado_pedido = FACT. El agente imprimirá automáticamente vía Realtime.')

    // Construir detalles del feedback
    const successDetails: FeedbackDetail[] = [
      { label: 'Lomitería', value: tenantNombre },
      { label: 'Cajero', value: usuarioNombre },
      { label: 'Tipo', value: formatTipoPedido(tipo) },
      { label: 'Total cobrado', value: formatGuaranies(total) }
    ]

    if (cliente) {
      successDetails.push({ label: 'Cliente', value: cliente.nombre })
    }

    if (cliente && puntosGenerados > 0) {
      successDetails.push({ label: 'Puntos sumados', value: `${puntosGenerados} ⭐` })
    }

    return {
      pedido,
      successDetails
    }
  }
}
