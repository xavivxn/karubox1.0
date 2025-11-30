import { supabase } from '@/lib/supabase'
import type { PrinterConfig } from '@/types/supabase'
import type { CartItem } from '@/store/cartStore'
import type { Pedido } from '@/types/supabase'
import type { TipoPedido } from '../types/pos.types'

/**
 * Datos que se envían al agente de impresión
 */
interface PrintRequest {
  printerId: string
  tipo: 'cocina' | 'factura' | 'cliente' // 'factura' es alias de 'cliente' para facturas fiscales
  data: {
    // Para tickets de cocina
    numeroPedido?: number
    tipoPedido?: TipoPedido
    lomiteriaNombre?: string
    items: Array<{
      nombre: string
      cantidad: number
      personalizaciones?: string | null // Formateado como texto legible para cocina
      notasItem?: string | null
      // Para facturas
      precioUnitario?: number
      subtotal?: number
    }>
    // Solo para delivery: datos del cliente
    cliente?: {
      nombre: string
      telefono?: string | null
      direccion?: string | null
      ci?: string | null // Para facturas
    } | null
    fecha: string
    notas?: string | null
    // Para facturas
    numeroFactura?: number
    subtotal?: number
    impuestos?: number
    total?: number
    metodoPago?: string
    lomiteriaName?: string
    lomiteriaAddress?: string
    lomiteriaTaxId?: string
  }
}

/**
 * Respuesta del agente de impresión
 */
interface PrintResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Servicio para manejar la impresión de tickets
 */
export const printService = {
  /**
   * Obtiene la configuración de impresora para una lomitería
   */
  async getPrinterConfig(lomiteriaId: string): Promise<PrinterConfig | null> {
    const { data, error } = await supabase
      .from('printer_config')
      .select('*')
      .eq('lomiteria_id', lomiteriaId)
      .eq('activo', true)
      .single()

    if (error) {
      console.warn('No se encontró configuración de impresora:', error.message)
      return null
    }

    return data
  },

  /**
   * Envía una orden de impresión al agente local
   */
  async sendPrintRequest(
    printerConfig: PrinterConfig,
    pedido: Pedido,
    items: CartItem[],
    tipoImpresion: 'cocina' | 'cliente' = 'cocina',
    tenantNombre?: string
  ): Promise<PrintResponse> {
    const agentUrl = `http://${printerConfig.agent_ip}:${printerConfig.agent_port}/print`

    // Formatear personalizaciones para cocina (solo lo esencial)
    const formatCustomizations = (item: CartItem) => {
      if (!item.customization) return null

      const customizations: string[] = []

      // Ingredientes extra (solo nombre, sin cantidades complicadas)
      if (item.customization.extras && item.customization.extras.length > 0) {
        const extras = item.customization.extras
          .map((extra) => `+${extra.label}`)
          .join(', ')
        customizations.push(extras)
      }

      // Ingredientes removidos
      if (item.customization.removedIngredients && item.customization.removedIngredients.length > 0) {
        const sin = item.customization.removedIngredients.map((ing) => ing.label).join(', ')
        customizations.push(`SIN: ${sin}`)
      }

      // Notas del item (solo si hay)
      if (item.customization.notes) {
        customizations.push(`NOTA: ${item.customization.notes}`)
      }

      return customizations.length > 0 ? customizations.join(' | ') : null
    }

    // Para cocina: solo datos esenciales, sin precios ni totales
    const printData: PrintRequest = {
      printerId: printerConfig.printer_id,
      tipo: tipoImpresion,
      data: {
        numeroPedido: pedido.numero_pedido,
        tipoPedido: pedido.tipo as TipoPedido,
        lomiteriaNombre: tenantNombre || printerConfig.nombre_impresora || 'Lomitería',
        items: items.map((item) => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          personalizaciones: formatCustomizations(item),
          notasItem: item.notas || null
        })),
        // Solo incluir cliente si es delivery (necesita dirección)
        cliente: pedido.tipo === 'delivery' && pedido.cliente_id
          ? {
              nombre: '', // Se puede obtener del pedido si es necesario
              telefono: null,
              direccion: null
            }
          : null,
        fecha: (pedido as any).created_at || new Date().toISOString(),
        notas: pedido.notas || null
      }
    }

    try {
      // Log del request que se envía (para debugging)
      console.log('🖨️ Enviando orden de impresión:', {
        url: agentUrl,
        printerId: printData.printerId,
        tipo: printData.tipo,
        numeroPedido: printData.data.numeroPedido,
        itemsCount: printData.data.items.length
      })
      console.log('📦 Datos completos del request:', JSON.stringify(printData, null, 2))

      const response = await fetch(agentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printData),
        // Timeout de 5 segundos
        signal: AbortSignal.timeout(5000)
      })

      // Intentar leer la respuesta (puede ser JSON o texto)
      let responseText = ''
      let responseData: any = null

      try {
        responseText = await response.text()
        if (responseText) {
          try {
            responseData = JSON.parse(responseText)
          } catch (parseError) {
            // Si no es JSON válido, usar el texto como mensaje
            responseData = { 
              message: responseText,
              rawResponse: responseText 
            }
          }
        } else {
          responseData = { message: 'Respuesta vacía del servidor' }
        }
      } catch (readError) {
        // Error al leer la respuesta
        console.error('❌ Error al leer respuesta del agente:', readError)
        responseData = { 
          message: 'Error al leer respuesta del servidor',
          readError: readError instanceof Error ? readError.message : String(readError)
        }
      }

      if (!response.ok) {
        const errorInfo = {
          status: response.status,
          statusText: response.statusText,
          url: agentUrl,
          printerId: printData.printerId,
          response: responseData,
          responseText: responseText || '(vacía)'
        }
        
        console.error('❌ Error del agente de impresión:', errorInfo)
        
        // Construir mensaje de error más descriptivo
        let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`
        
        if (responseData) {
          if (responseData.error) {
            errorMessage = responseData.error
          } else if (responseData.message) {
            errorMessage = responseData.message
          } else if (typeof responseData === 'string') {
            errorMessage = responseData
          }
        } else if (responseText) {
          errorMessage = responseText
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      console.log('✅ Respuesta del agente:', responseData)
      return {
        success: true,
        message: responseData?.message || 'Ticket impreso correctamente'
      }
    } catch (error) {
      // Si el agente no está disponible, no es crítico
      // El pedido se guarda igual, solo falla la impresión
      console.error('❌ Error al enviar orden de impresión:', error)
      console.error('📋 Detalles del error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión con el agente'
      }
    }
  },

  /**
   * Imprime un ticket de cocina cuando se confirma un pedido
   * Esta función no lanza errores - si falla la impresión, el pedido se guarda igual
   */
  async printKitchenTicket(
    lomiteriaId: string,
    pedido: Pedido,
    items: CartItem[],
    tenantNombre?: string
  ): Promise<void> {
    try {
      const printerConfig = await this.getPrinterConfig(lomiteriaId)

      if (!printerConfig) {
        console.warn('No hay impresora configurada para esta lomitería')
        return
      }

      const result = await this.sendPrintRequest(printerConfig, pedido, items, 'cocina', tenantNombre)

      if (result.success) {
        console.log('✅ Ticket de cocina impreso:', result.message)
      } else {
        console.warn('⚠️ No se pudo imprimir el ticket:', result.error)
      }
    } catch (error) {
      // No lanzamos el error - la impresión es opcional
      console.warn('Error al imprimir ticket de cocina:', error)
    }
  },

  /**
   * Imprime un ticket para el cliente (recibo simple)
   */
  async printCustomerTicket(
    lomiteriaId: string,
    pedido: Pedido,
    items: CartItem[],
    tenantNombre?: string
  ): Promise<void> {
    try {
      const printerConfig = await this.getPrinterConfig(lomiteriaId)

      if (!printerConfig) {
        console.warn('No hay impresora configurada para esta lomitería')
        return
      }

      const result = await this.sendPrintRequest(printerConfig, pedido, items, 'cliente', tenantNombre)

      if (result.success) {
        console.log('✅ Ticket de cliente impreso:', result.message)
      } else {
        console.warn('⚠️ No se pudo imprimir el ticket:', result.error)
      }
    } catch (error) {
      console.warn('Error al imprimir ticket de cliente:', error)
    }
  },

  /**
   * Imprime una factura fiscal para el cliente
   * Incluye todos los datos necesarios para facturación fiscal
   */
  async printInvoice(
    lomiteriaId: string,
    facturaData: {
      numeroFactura: number
      pedido: Pedido
      items: CartItem[]
      cliente: {
        nombre: string
        direccion?: string | null
        ci?: string | null
        telefono?: string | null
      } | null
      subtotal: number
      impuestos: number
      total: number
      metodoPago: string
      lomiteria: {
        nombre: string
        direccion?: string | null
        cuit?: string | null
      }
    }
  ): Promise<PrintResponse> {
    try {
      const printerConfig = await this.getPrinterConfig(lomiteriaId)

      if (!printerConfig) {
        return {
          success: false,
          error: 'No hay impresora configurada para esta lomitería'
        }
      }

      const agentUrl = `http://${printerConfig.agent_ip}:${printerConfig.agent_port}/print`

      const printData: PrintRequest = {
        printerId: printerConfig.printer_id,
        tipo: 'factura',
        data: {
          numeroFactura: facturaData.numeroFactura,
          items: facturaData.items.map((item) => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            subtotal: item.subtotal
          })),
          cliente: facturaData.cliente
            ? {
                nombre: facturaData.cliente.nombre,
                direccion: facturaData.cliente.direccion || null,
                ci: facturaData.cliente.ci || null,
                telefono: facturaData.cliente.telefono || null
              }
            : null,
          subtotal: facturaData.subtotal,
          impuestos: facturaData.impuestos,
          total: facturaData.total,
          metodoPago: facturaData.metodoPago,
          fecha: (facturaData.pedido as any).created_at || new Date().toISOString(),
          lomiteriaName: facturaData.lomiteria.nombre,
          lomiteriaAddress: facturaData.lomiteria.direccion || null,
          lomiteriaTaxId: facturaData.lomiteria.cuit || null
        }
      }

      console.log('🧾 Enviando factura a imprimir:', {
        url: agentUrl,
        printerId: printData.printerId,
        numeroFactura: printData.data.numeroFactura
      })

      const response = await fetch(agentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printData),
        signal: AbortSignal.timeout(5000)
      })

      let responseText = ''
      let responseData: any = null

      try {
        responseText = await response.text()
        if (responseText) {
          responseData = JSON.parse(responseText)
        }
      } catch (parseError) {
        responseData = { message: responseText || 'Sin respuesta del servidor' }
      }

      if (!response.ok) {
        console.error('❌ Error del agente al imprimir factura:', {
          status: response.status,
          statusText: response.statusText,
          response: responseData
        })
        return {
          success: false,
          error: responseData?.error || responseData?.message || `Error HTTP ${response.status}: ${response.statusText}`
        }
      }

      console.log('✅ Factura impresa:', responseData)
      return {
        success: true,
        message: responseData?.message || 'Factura impresa correctamente'
      }
    } catch (error) {
      console.error('❌ Error al imprimir factura:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión con el agente'
      }
    }
  }
}

