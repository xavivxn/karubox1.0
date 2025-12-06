import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/contexts/TenantContext'
import { orderService } from '../services/orderService'
import type { FeedbackState, FeedbackDetail } from '../types/pos.types'
import { buildUnexpectedErrorState } from '../utils/error.utils'

export function useOrderConfirmation() {
  const [isProcessing, setIsProcessing] = useState(false)

  const { usuario, tenant } = useTenant()
  const { items, cliente, tipo, clearCart, getTotal } = useCartStore()

  const showInlineError = (title: string, message: string, details?: FeedbackDetail[]) => {
    return {
      type: 'error' as const,
      title,
      message,
      details
    }
  }

  const handleConfirmOrder = async (): Promise<FeedbackState | null> => {
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
        total
      })

      clearCart()

      return {
        type: 'success',
        title: `Pedido #${pedido.numero_pedido} confirmado`,
        message: 'Venta registrada y stock actualizado.',
        details: successDetails
      }
    } catch (error) {
      console.error('Error confirmando pedido:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      })
      return buildUnexpectedErrorState('No pudimos confirmar el pedido', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    handleConfirmOrder,
    isProcessing
  }
}
