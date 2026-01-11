import { createClient } from '@/lib/supabase/client'
import { descontarIngredientesPorPedido } from '@/lib/inventory/consumption'
import type { CartItem } from '@/store/cartStore'
import type { Cliente } from '@/types/supabase'
import type { TipoPedido, FeedbackDetail } from '../types/pos.types'
import { calcularPuntos, formatTipoPedido } from '../utils/pos.utils'
import { formatGuaranies } from '@/lib/utils/format'
import { printService } from './printService'

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

    // Crear pedido
    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .insert({
        tenant_id: tenantId,
        cliente_id: cliente?.id || null,
        usuario_id: usuarioId,
        tipo,
        total,
        puntos_generados: cliente ? puntosGenerados : 0,
        estado_pedido: 'FACT' // ← Dispara impresión automática vía Realtime
      })
      .select()
      .single()

    if (errorPedido) throw errorPedido

    // Insertar items del pedido
    const itemsToInsert = items.map((item) => ({
      pedido_id: pedido.id,
      producto_id: item.producto_id,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.subtotal
    }))

    const { data: itemsInsertados, error: errorItems } = await supabase
      .from('items_pedido')
      .insert(itemsToInsert)
      .select()

    if (errorItems) throw errorItems

    // Mapear los CartItems con sus IDs reales de items_pedido para la customización
    const cartItemsConId = items.map((item, index) => ({
      ...item,
      id: itemsInsertados?.[index]?.id || item.id
    }))

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

    // Descontar ingredientes o inventario según tipo de producto
    const resultadoInventario = await descontarIngredientesPorPedido({
      tenantId,
      items: cartItemsConId,
      pedidoId: pedido.id,
      pedidoNumero: pedido.numero_pedido,
      usuarioId
    }).catch((consumptionError) => {
      console.warn('Error al descontar inventario:', consumptionError)
      return { success: false, errores: ['Error al procesar inventario'] }
    })

    // Si hubo errores de stock, registrar advertencia
    if (!resultadoInventario.success && resultadoInventario.errores.length > 0) {
      console.warn('Advertencias de inventario:', resultadoInventario.errores)
      // El pedido ya fue creado, solo notificamos los errores
    }

    // Imprimir ticket de cocina (no crítico - si falla, el pedido se guarda igual)
    printService
      .printKitchenTicket(tenantId, pedido, items, tenantNombre)
      .catch((printError) => {
        console.warn('No se pudo imprimir el ticket de cocina', printError)
      })

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
