import { createClient } from '@/lib/supabase/client'
import type { PrinterConfig } from '@/types/supabase'
import type { CartItem } from '@/store/cartStore'
import type { Pedido } from '@/types/supabase'
import type { TipoPedido } from '../types/pos.types'
import axios from 'axios'

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
 * Construye la URL del agente de impresión
 * Detecta automáticamente si debe usar HTTP (IP local) o HTTPS (túnel público)
 * 
 * - IP Local (puerto 3001): http://192.168.100.2:3001/print
 * - Túnel Público (puerto 443): https://abc123.loca.lt/print
 */
function buildAgentUrl(agentIp: string, agentPort: number): string {
  // Limpiar agent_ip si ya tiene protocolo o barras al final
  let cleanIp = agentIp.trim()
  cleanIp = cleanIp.replace(/^https?:\/\//, '') // Remover http:// o https://
  cleanIp = cleanIp.replace(/\/$/, '') // Remover / al final
  
  // Si el puerto es 3001, es IP local (HTTP)
  // Si el puerto es 443, es túnel público (HTTPS)
  // Si agent_ip contiene dominios de túnel, es túnel (HTTPS)
  const isTunnel =
    agentPort === 443 ||
    cleanIp.includes('.loca.lt') || // localtunnel
    cleanIp.includes('.serveo.net') || // serveo
    cleanIp.includes('.trycloudflare.com') || // cloudflare tunnel
    cleanIp.includes('.lhr.life') // localhost.run

  const protocol = isTunnel ? 'https' : 'http'

  // Para HTTPS en puerto 443, no incluir el puerto (es el default)
  // Para HTTP en puerto 3001 u otros, sí incluirlo
  const port = isTunnel && agentPort === 443 ? '' : `:${agentPort}`

  return `${protocol}://${cleanIp}${port}/print`
}

/**
 * Servicio para manejar la impresión de tickets
 */
export const printService = {
  /**
   * Obtiene la configuración de impresora para una lomitería
   */
  async getPrinterConfig(lomiteriaId: string): Promise<PrinterConfig | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('printer_config')
      .select('*')
      .eq('lomiteria_id', lomiteriaId)
      .eq('activo', true)
      .single()

    if (error) {
      console.warn('⚠️ No se encontró configuración de impresora:', error.message)
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
    // Validar que agent_ip no esté vacío
    if (!printerConfig.agent_ip || printerConfig.agent_ip.trim() === '') {
      console.error('❌ agent_ip no configurado en printer_config')
      return {
        success: false,
        error: 'La IP del agente no está configurada'
      }
    }

    // Asegurar que agent_port sea un número
    const port = typeof printerConfig.agent_port === 'number'
      ? printerConfig.agent_port
      : parseInt(String(printerConfig.agent_port), 10)

    // Construir URL del agente usando la función helper
    const agentUrl = buildAgentUrl(printerConfig.agent_ip, port)

    // Log para debugging
    console.log('🔧 Configuración de impresión:', {
      agent_ip: printerConfig.agent_ip,
      agent_port: printerConfig.agent_port,
      port_parsed: port,
      agentUrl
    })

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
              telefono: undefined,
              direccion: undefined
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

      // Usar API route de Next.js como proxy para evitar problemas de CORS
      // El servidor de Next.js hace la petición al agente, no el navegador
      const response = await axios.post<PrintResponse>('/api/print', {
        lomiteriaId: printerConfig.lomiteria_id,
        pedido,
        items,
        tipoImpresion,
        tenantNombre
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // Timeout más largo porque pasa por el servidor
      })

      console.log('respuesta de api/print: ', response)
      // La respuesta del API route ya viene en el formato correcto
      const responseData = response.data

      if (!responseData.success) {
        console.error('❌ Error del agente de impresión:', {
          url: agentUrl,
          printerId: printData.printerId,
          response: responseData
        })
        
        return {
          success: false,
          error: responseData.error || 'Error al imprimir'
        }
      }

      console.log('✅ Respuesta del agente:', responseData)
      return {
        success: true,
        message: responseData.message || 'Ticket impreso correctamente'
      }
    } catch (error) {
      // Si el agente no está disponible, no es crítico
      // El pedido se guarda igual, solo falla la impresión
      console.error('❌ Error al enviar orden de impresión:', error)
      
      let errorMessage = 'Error de conexión con el agente de impresión'
      
      // Si es un error de axios, extraer el mensaje del API route
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data
        if (apiError?.error) {
          errorMessage = apiError.error
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Timeout al conectar con el agente. El túnel puede estar inactivo.'
        } else {
          errorMessage = error.message || 'Error de conexión con el agente'
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      console.error('📋 Detalles del error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: errorMessage,
        axiosError: axios.isAxiosError(error) ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        } : undefined
      })
      
      return {
        success: false,
        error: errorMessage
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

      // Validar que agent_ip esté configurado
      if (!printerConfig.agent_ip || printerConfig.agent_ip.trim() === '') {
        return {
          success: false,
          error: 'La IP del agente no está configurada'
        }
      }

      // Asegurar que agent_port sea un número
      const port = typeof printerConfig.agent_port === 'number'
        ? printerConfig.agent_port
        : parseInt(String(printerConfig.agent_port), 10)

      // Construir URL del agente usando la función helper
      const agentUrl = buildAgentUrl(printerConfig.agent_ip, port)

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
                direccion: facturaData.cliente.direccion || undefined,
                ci: facturaData.cliente.ci || undefined,
                telefono: facturaData.cliente.telefono || undefined
              }
            : null,
          subtotal: facturaData.subtotal,
          impuestos: facturaData.impuestos,
          total: facturaData.total,
          metodoPago: facturaData.metodoPago,
          fecha: (facturaData.pedido as any).created_at || new Date().toISOString(),
          lomiteriaName: facturaData.lomiteria.nombre,
          lomiteriaAddress: facturaData.lomiteria.direccion || undefined,
          lomiteriaTaxId: facturaData.lomiteria.cuit || undefined
        }
      }

      console.log('🧾 Enviando factura a imprimir:', {
        url: agentUrl,
        printerId: printData.printerId,
        numeroFactura: printData.data.numeroFactura
      })

      // Usar API route de Next.js como proxy para evitar problemas de CORS
      const response = await axios.post<any>('/api/print', {
        lomiteriaId,
        pedido: facturaData.pedido,
        items: facturaData.items,
        tipoImpresion: 'factura',
        tenantNombre: facturaData.lomiteria.nombre,
        facturaData: {
          numeroFactura: facturaData.numeroFactura,
          cliente: facturaData.cliente,
          subtotal: facturaData.subtotal,
          impuestos: facturaData.impuestos,
          total: facturaData.total,
          metodoPago: facturaData.metodoPago,
          lomiteria: facturaData.lomiteria
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // La respuesta del API route ya viene en el formato correcto
      const responseData = response.data

      if (!responseData.success) {
        console.error('❌ Error del agente al imprimir factura:', {
          response: responseData
        })
        return {
          success: false,
          error: responseData.error || 'Error al imprimir factura'
        }
      }

      console.log('✅ Factura impresa:', responseData)
      return {
        success: true,
        message: responseData.message || 'Factura impresa correctamente'
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

