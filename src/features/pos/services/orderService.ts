import { createClient } from '@/lib/supabase/client'
import type { PostgrestError } from '@supabase/supabase-js'
import { descontarIngredientesPorPedido } from '@/lib/inventory/consumption'
import type { CartItem } from '@/store/cartStore'
import type { Cliente } from '@/types/supabase'
import type { TipoPedido, FeedbackDetail } from '../types/pos.types'
import { calcularPuntos, formatTipoPedido, formatItemModificacionesForTicket } from '../utils/pos.utils'
import { formatGuaranies } from '@/lib/utils/format'
import { printService } from './printService'
import { registrarCanjePuntos, registrarPuntosGanados } from '@/lib/db/puntos'

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

    const puntosAuto = calcularPuntos(total)
    const puntosBonus = items.reduce((sum, item) => sum + ((item.puntos_extra ?? 0) * item.cantidad), 0)
    const puntosGenerados = puntosAuto + puntosBonus

    const canjeItems = items.filter((i) => i.modo === 'canje' && i.tipo === 'producto')
    const puntosCosteCanje = canjeItems.reduce((sum, item) => sum + ((item.puntos_canje ?? 0) * item.cantidad), 0)

    if (canjeItems.length > 0) {
      if (!cliente) {
        throw new Error('Se requiere un cliente para canjear puntos')
      }
      if (puntosCosteCanje <= 0) {
        throw new Error('El canje debe tener puntos asociados')
      }
      if (puntosCosteCanje > cliente.puntos_totales) {
        throw new Error('El cliente no tiene suficientes puntos para el canje')
      }
    }

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
      producto_nombre:
        item.modo === 'canje' && item.tipo === 'producto' ? `CANJE: ${item.nombre}` : item.nombre,
      cantidad: item.cantidad,
      // En canje el total se cobra con puntos, por eso evitamos mostrar precios en tickets (manteniendo total=0).
      precio_unitario: item.modo === 'canje' && item.tipo === 'producto' ? 0 : item.precio,
      subtotal: item.subtotal,
      notas: (() => {
        const baseNotas = formatItemModificacionesForTicket(item)
        if (!(item.modo === 'canje' && item.tipo === 'producto')) return baseNotas ?? null

        const puntosLinea = (item.puntos_canje ?? 0) * item.cantidad
        const canjeNota =
          puntosLinea > 0 ? `CANJE DE PUNTOS (${puntosLinea} pts)` : 'CANJE DE PUNTOS'

        return baseNotas ? `${baseNotas} · ${canjeNota}` : canjeNota
      })()
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

    // Canje de puntos: descontar solo el costo solicitado antes de acreditar puntos ganados
    let puntosSaldoConsumidos = 0
    if (cliente && canjeItems.length > 0) {
      puntosSaldoConsumidos = puntosCosteCanje
      await registrarCanjePuntos(
        tenantId,
        cliente.id,
        puntosSaldoConsumidos,
        pedido.id,
        `Canje de puntos: costo ${puntosCosteCanje} pts`
      )
    }

    // Acreditar puntos generados por la venta (solo sobre productos de venta)
    if (cliente && puntosGenerados > 0) {
      await registrarPuntosGanados(
        tenantId,
        cliente.id,
        puntosGenerados,
        pedido.id,
        `Puntos ganados por pedido #${pedido.numero_pedido}`
      )
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

    if (canjeItems.length > 0 && cliente) {
      const nombreCanjeado = canjeItems[0]?.nombre ?? '—'
      successDetails.push({
        label: 'Puntos canjeados',
        value: `${puntosSaldoConsumidos} pts`
      })
      successDetails.push({ label: 'Producto canjeado', value: nombreCanjeado })
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
