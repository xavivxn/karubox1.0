import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios, { AxiosError } from 'axios'

interface PrintResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * API Route que actúa como proxy para el agente de impresión
 * Esto evita problemas de CORS porque el servidor hace la petición, no el navegador
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lomiteriaId, pedido, items, tipoImpresion, tenantNombre, facturaData } = body

    if (!lomiteriaId) {
      return NextResponse.json(
        { success: false, error: 'lomiteriaId es requerido' },
        { status: 400 }
      )
    }

    // Obtener configuración de impresora desde Supabase
    const { data: printerConfig, error: configError } = await supabase
      .from('printer_config')
      .select('*')
      .eq('lomiteria_id', lomiteriaId)
      .eq('activo', true)
      .single()

    if (configError || !printerConfig) {
      return NextResponse.json(
        { success: false, error: 'No se encontró configuración de impresora' },
        { status: 404 }
      )
    }

    // Validar que agent_ip esté configurado
    if (!printerConfig.agent_ip || printerConfig.agent_ip.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'La IP del agente no está configurada' },
        { status: 400 }
      )
    }

    // Construir URL del agente
    // Limpiar agent_ip si ya tiene protocolo o barras al final
    let cleanIp = printerConfig.agent_ip.trim()
    cleanIp = cleanIp.replace(/^https?:\/\//, '') // Remover http:// o https://
    cleanIp = cleanIp.replace(/\/$/, '') // Remover / al final
    
    // Si el puerto es 3001, es IP local (HTTP)
    // Si el puerto es 443, es túnel público (HTTPS)
    // Si agent_ip contiene dominios de túnel, es túnel (HTTPS)
    const port = typeof printerConfig.agent_port === 'number'
      ? printerConfig.agent_port
      : parseInt(String(printerConfig.agent_port), 10)

    const isTunnel =
      port === 443 ||
      cleanIp.includes('.loca.lt') || // localtunnel
      cleanIp.includes('.serveo.net') || // serveo
      cleanIp.includes('.trycloudflare.com') || // cloudflare tunnel
      cleanIp.includes('.lhr.life') // localhost.run

    const protocol = isTunnel ? 'https' : 'http'
    // Para HTTPS en puerto 443, no incluir el puerto (es el default)
    // Para HTTP en puerto 3001 u otros, sí incluirlo
    const portStr = isTunnel && port === 443 ? '' : `:${port}`
    const agentUrl = `${protocol}://${cleanIp}${portStr}/print`

    // 🔧 Logs de debugging detallados
    console.log('🔧 Configuración de impresión:', {
      agent_ip_original: printerConfig.agent_ip,
      agent_ip_cleaned: cleanIp,
      agent_port: printerConfig.agent_port,
      port_parsed: port,
      isTunnel,
      protocol,
      portStr,
      agentUrl,
      printer_id: printerConfig.printer_id,
      lomiteria_id: printerConfig.lomiteria_id
    })

    // Formatear datos para el agente
    const formatCustomizations = (item: any) => {
      if (!item.customization) return null

      const customizations: string[] = []

      if (item.customization.extras && item.customization.extras.length > 0) {
        const extras = item.customization.extras
          .map((extra: any) => `+${extra.label}`)
          .join(', ')
        customizations.push(extras)
      }

      if (item.customization.removedIngredients && item.customization.removedIngredients.length > 0) {
        const sin = item.customization.removedIngredients.map((ing: any) => ing.label).join(', ')
        customizations.push(`SIN: ${sin}`)
      }

      if (item.customization.notes) {
        customizations.push(`NOTA: ${item.customization.notes}`)
      }

      return customizations.length > 0 ? customizations.join(' | ') : null
    }

    // Construir printData según el tipo de impresión
    let printData: any

    if (tipoImpresion === 'factura' && facturaData) {
      // Para facturas, usar los datos de facturaData
      printData = {
        printerId: printerConfig.printer_id,
        tipo: 'factura',
        data: {
          numeroFactura: facturaData.numeroFactura,
          items: items.map((item: any) => ({
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
          fecha: pedido.created_at || new Date().toISOString(),
          lomiteriaName: facturaData.lomiteria.nombre,
          lomiteriaAddress: facturaData.lomiteria.direccion || undefined,
          lomiteriaTaxId: facturaData.lomiteria.cuit || undefined
        }
      }
    } else {
      // Para tickets de cocina o cliente
      printData = {
        printerId: printerConfig.printer_id,
        tipo: tipoImpresion || 'cocina',
        data: {
          numeroPedido: pedido.numero_pedido,
          tipoPedido: pedido.tipo,
          lomiteriaNombre: tenantNombre || printerConfig.nombre_impresora || 'Lomitería',
          items: items.map((item: any) => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            personalizaciones: formatCustomizations(item),
            notasItem: item.notas || null
          })),
          cliente: pedido.tipo === 'delivery' && pedido.cliente_id
            ? {
                nombre: '',
                telefono: undefined,
                direccion: undefined
              }
            : null,
          fecha: pedido.created_at || new Date().toISOString(),
          notas: pedido.notas || null
        }
      }
    }

    // Hacer petición al agente desde el servidor (sin problemas de CORS)
    // IMPORTANTE: Usar agentUrl (URL del agente externo), NO '/api/print'
    console.log('📡 Intentando conectar al agente:', {
      agentUrl,
      printerId: printData.printerId,
      tipo: printData.tipo,
      itemsCount: printData.data.items?.length || 0
    })
    
    // Log del payload completo (sin datos sensibles)
    console.log('📦 Payload a enviar:', {
      printerId: printData.printerId,
      tipo: printData.tipo,
      dataKeys: Object.keys(printData.data),
      itemsCount: printData.data.items?.length || 0
    })

    try {
      console.log('🔄 Enviando petición POST a:', agentUrl)
      const response = await axios.post<any>(agentUrl, printData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos
        validateStatus: (status) => status < 600 // Aceptar todos los códigos para manejar errores
      })
      
      console.log('✅ Respuesta recibida del agente:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      })

      const responseData = response.data

      // Si el agente responde con error, retornarlo
      if (response.status >= 400 || (responseData && !responseData.success)) {
        console.error('❌ Agente respondió con error:', {
          status: response.status,
          data: responseData
        })
        return NextResponse.json(
          {
            success: false,
            error: responseData?.error || responseData?.message || `Error HTTP ${response.status}: El agente no está disponible`
          },
          { status: response.status >= 400 ? response.status : 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: responseData?.message || 'Ticket impreso correctamente'
      })
    } catch (axiosError) {
      // Manejar errores específicos de axios
      if (axios.isAxiosError(axiosError)) {
        const status = axiosError.response?.status || 503
        const statusText = axiosError.response?.statusText || 'Service Unavailable'
        
        console.error('❌ Error de conexión con el agente:', {
          agentUrl,
          status,
          statusText,
          message: axiosError.message,
          code: axiosError.code,
          responseData: axiosError.response?.data
        })

        // Mensajes más descriptivos según el tipo de error
        let errorMessage = 'Error de conexión con el agente de impresión'
        
        if (status === 503) {
          // Mensaje más específico según si es IP local o túnel
          if (port === 3001) {
            errorMessage = `El agente de impresión no está disponible (503). Verifica que:\n` +
              `1. El agente esté corriendo en ${printerConfig.agent_ip}:${port}\n` +
              `2. El celular/PC esté en la misma red WiFi\n` +
              `3. El firewall no esté bloqueando el puerto ${port}`
          } else {
            errorMessage = `El agente de impresión no está disponible (503). Verifica que:\n` +
              `1. El túnel esté activo (ejecuta: npx localtunnel --port 3001)\n` +
              `2. El agente esté corriendo\n` +
              `3. La URL del agente en Supabase sea correcta: ${agentUrl}`
          }
        } else if (axiosError.code === 'ECONNREFUSED') {
          errorMessage = `No se pudo conectar con el agente en ${agentUrl}. Verifica que:\n` +
            `1. El agente esté corriendo\n` +
            `2. La IP/puerto sea correcto: ${printerConfig.agent_ip}:${port}\n` +
            `3. Si es IP local, que estés en la misma red WiFi`
        } else if (axiosError.code === 'ETIMEDOUT') {
          errorMessage = `Timeout al conectar con el agente (${agentUrl}). El agente puede estar lento o inactivo.`
        } else if (axiosError.code === 'ENOTFOUND') {
          errorMessage = `No se pudo resolver la URL del agente: ${printerConfig.agent_ip}. Verifica la configuración en Supabase.`
        } else if (axiosError.code === 'ECONNABORTED') {
          errorMessage = `La conexión con el agente fue cancelada o excedió el timeout.`
        } else if (axiosError.response?.data) {
          // Si el agente responde con un mensaje de error, usarlo
          errorMessage = axiosError.response.data.error || axiosError.response.data.message || axiosError.message
        } else {
          errorMessage = `${axiosError.message || 'Error desconocido'} (código: ${axiosError.code || 'N/A'})`
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            agentUrl, // Incluir la URL para debugging
            status
          },
          { status }
        )
      }
      
      // Re-lanzar si no es un error de axios para que lo capture el catch externo
      throw axiosError
    }
  } catch (error: unknown) {
    // Este catch maneja errores no relacionados con axios (validación, Supabase, etc.)
    console.error('❌ Error inesperado en API route de impresión:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al procesar la solicitud de impresión'
      },
      { status: 500 }
    )
  }
}

