import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/contexts/TenantContext'
import { orderService } from '../services/orderService'
import type { FeedbackState, FeedbackDetail } from '../types/pos.types'
import { buildUnexpectedErrorState } from '../utils/error.utils'

export function useOrderConfirmation() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [facturaPrefModalOpen, setFacturaPrefModalOpen] = useState(false)

  const { usuario, tenant } = useTenant()
  const { items, cliente, tipo, clearCart, getTotal } = useCartStore()

  const showInlineError = (title: string, message: string, details?: FeedbackDetail[]) => {
    return {
      type: 'error' as const,
      title,
      message,
      details,
    }
  }

  /** Validaciones previas; si pasa, abre el modal “¿Desea factura?”. */
  const prepareConfirmOrder = (): FeedbackState | null => {
    if (!tipo) {
      return showInlineError(
        'Seleccioná el tipo de pedido',
        'Elegí si es consumo local, delivery o para llevar antes de cobrar.'
      )
    }

    if (items.length === 0) {
      return showInlineError(
        'Tu carrito está vacío',
        'Agregá al menos un producto antes de confirmar.'
      )
    }

    if (!usuario || !tenant) {
      return showInlineError(
        'No encontramos el usuario',
        'Volvé a iniciar sesión para poder registrar ventas.'
      )
    }

    setFacturaPrefModalOpen(true)
    return null
  }

  const cancelFacturaModal = () => {
    if (!isProcessing) setFacturaPrefModalOpen(false)
  }

  const confirmOrderWithFacturaChoice = async (
    facturaALNombreDelCliente: boolean,
    comprobanteNombreYCI: boolean
  ): Promise<FeedbackState | null> => {
    if (!usuario || !tenant || !tipo) {
      setFacturaPrefModalOpen(false)
      return showInlineError(
        'No encontramos el usuario',
        'Volvé a iniciar sesión para poder registrar ventas.'
      )
    }

    setIsProcessing(true)

    try {
      const total = getTotal()

      const { pedido, successDetails } = await orderService.confirmOrder({
        tenantId: tenant.id,
        usuarioId: usuario.id,
        tenantNombre: tenant.nombre,
        usuarioNombre: usuario.nombre,
        cliente,
        tipo,
        items,
        total,
        emitirFactura: true,
        facturaALNombreDelCliente,
        facturaMostrarNombreYCI: !facturaALNombreDelCliente && comprobanteNombreYCI,
      })

      setFacturaPrefModalOpen(false)
      clearCart()

      return {
        type: 'success',
        title: `Pedido #${pedido.numero_pedido} confirmado`,
        message: 'Venta registrada y stock actualizado.',
        details: successDetails,
      }
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(String((error as { message?: string })?.message ?? 'Error desconocido'))
      console.error('Error confirmando pedido:', err.message, error)
      return buildUnexpectedErrorState('No pudimos confirmar el pedido', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    prepareConfirmOrder,
    confirmOrderWithFacturaChoice,
    cancelFacturaModal,
    facturaPrefModalOpen,
    isProcessing,
  }
}
