import { createClient } from '@/lib/supabase/client'
import type { PrinterConfig } from '@/types/supabase'
import type { CartItem } from '@/store/cartStore'
import type { Pedido } from '@/types/supabase'

/**
 * ============================================
 * SERVICIO DE IMPRESIÓN - SISTEMA REALTIME
 * ============================================
 * 
 * Este servicio usa Supabase Realtime para impresión automática.
 * 
 * FLUJO:
 * 1. Frontend guarda pedido con estado_pedido = 'FACT'
 * 2. Agente escucha cambios en Supabase Realtime
 * 3. Agente detecta e imprime automáticamente
 * 
 * NO SE REQUIERE comunicación HTTP directa con el agente.
 * El agente debe estar configurado con ENABLE_SUPABASE_LISTENER=true
 * 
 * ============================================
 */

/**
 * Respuesta del servicio de impresión
 */
interface PrintResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Servicio para manejar la impresión de tickets vía Realtime
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
   * Valida que existe configuración de impresora para tickets de cocina
   * La impresión real la hace el agente automáticamente vía Realtime
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
        console.warn('⚠️ No hay impresora configurada para esta lomitería')
        console.warn('💡 El pedido se guardó correctamente, pero no se imprimirá automáticamente')
        return
      }

      console.log('✅ Impresora configurada:', {
        printer_id: printerConfig.printer_id,
        nombre: printerConfig.nombre_impresora,
        lomiteria_id: lomiteriaId
      })
      console.log('🔔 El agente Realtime imprimirá automáticamente cuando detecte el pedido')
      console.log('📋 Pedido #' + pedido.numero_pedido + ' con estado_pedido = FACT')
    } catch (error) {
      // No lanzamos el error - la impresión es opcional
      console.warn('Error al validar configuración de impresora:', error)
    }
  },

  /**
   * Valida que existe configuración de impresora para tickets de cliente
   * La impresión real la hace el agente automáticamente vía Realtime
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
        console.warn('⚠️ No hay impresora configurada para esta lomitería')
        return
      }

      console.log('✅ Configuración de impresora validada para ticket de cliente')
      console.log('🔔 El agente Realtime imprimirá automáticamente')
    } catch (error) {
      console.warn('Error al validar configuración de impresora:', error)
    }
  },

  /**
   * Valida configuración para facturas
   * La impresión real la hace el agente automáticamente vía Realtime
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

      console.log('✅ Configuración de impresora validada para factura')
      console.log('🔔 El agente Realtime imprimirá automáticamente')
      
      return {
        success: true,
        message: 'Factura enviada a cola de impresión (Realtime)'
      }
    } catch (error) {
      console.error('❌ Error al validar configuración para factura:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al validar configuración'
      }
    }
  }
}
