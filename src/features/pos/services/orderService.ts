import { createClient } from '@/lib/supabase/client'
import type { PostgrestError } from '@supabase/supabase-js'
import { descontarIngredientesPorPedido } from '@/lib/inventory/consumption'
import type { CartItem } from '@/store/cartStore'
import type { Cliente } from '@/types/supabase'
import type { TipoPedido, FeedbackDetail } from '../types/pos.types'
import { calcularPuntos, formatTipoPedido, formatItemModificacionesForTicket } from '../utils/pos.utils'
import { formatGuaranies } from '@/lib/utils/format'
import { printService } from './printService'

/** Convierte error de Supabase en Error con mensaje legible para el usuario y la consola */
function toError(err: PostgrestError | Error, context: string): Error {
  if (err instanceof Error) return err
  const e = err as PostgrestError
  const msg = e?.message ?? 'Error desconocido'
  const detail = e?.details != null ? ` (${e.details})` : ''
  return new Error(`${context}: ${msg}${detail}`)
}

interface ConfirmOrderParams {
  tenantId: string
  usuarioId: string
  tenantNombre: string
  usuarioNombre: string
  cliente: Cliente | null
  tipo: TipoPedido
  items: CartItem[]
  total: number
  /** Si se debe emitir factura fiscal (requiere cliente y config de facturación) */
  conFactura?: boolean
}

export const orderService = {
  async confirmOrder(params: ConfirmOrderParams) {
    const supabase = createClient()
    const { tenantId, usuarioId, tenantNombre, usuarioNombre, cliente, tipo, items, total, conFactura } = params

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

    if (errorPedido) throw toError(errorPedido, 'Error al crear el pedido')

    // Insertar items del pedido (notas = texto de modificaciones para el ticket de cocina)
    const itemsToInsert = items.map((item) => ({
      pedido_id: pedido.id,
      producto_id: item.producto_id,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.subtotal,
      notas: formatItemModificacionesForTicket(item) ?? null
    }))

    const { data: itemsInsertados, error: errorItems } = await supabase
      .from('items_pedido')
      .insert(itemsToInsert)
      .select()

    if (errorItems) throw toError(errorItems, 'Error al guardar los ítems del pedido')

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

      if (errorCliente) throw toError(errorCliente, 'Error al actualizar puntos del cliente')

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

    let facturaEmitida = false
    if (conFactura && cliente) {
      try {
        const { data: config } = await supabase
          .from('tenant_facturacion')
          .select('timbrado, establecimiento, punto_expedicion, ultimo_numero')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (config) {
          const siguiente = (config.ultimo_numero ?? 0) + 1
          const numeroFactura = `${config.establecimiento}-${config.punto_expedicion}-${String(siguiente).padStart(7, '0')}`

          const totalIva10 = Math.round((total / 1.1) * 0.1 * 100) / 100
          const totalExento = Math.round((total - totalIva10) * 100) / 100

          const { error: errFactura } = await supabase.from('facturas').insert({
            tenant_id: tenantId,
            pedido_id: pedido.id,
            numero_factura: numeroFactura,
            timbrado: config.timbrado,
            cliente_id: cliente.id,
            total,
            total_iva_10: totalIva10,
            total_iva_5: 0,
            total_exento: totalExento
          })

          if (!errFactura) {
            facturaEmitida = true
            await supabase
              .from('tenant_facturacion')
              .update({ ultimo_numero: siguiente, updated_at: new Date().toISOString() })
              .eq('tenant_id', tenantId)
          }
        }
      } catch (facturaErr) {
        console.warn('No se pudo emitir factura (config puede no existir):', facturaErr)
      }
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

    if (facturaEmitida) {
      successDetails.push({ label: 'Factura', value: 'Emitida' })
    }

    return {
      pedido,
      successDetails
    }
  }
}
