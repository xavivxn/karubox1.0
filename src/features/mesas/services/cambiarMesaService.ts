import { createClient } from '@/lib/supabase/client'
import { broadcastMesasChanged } from './mesasRealtimeBroadcast'
import {
  mensajeErrorCambioMesa,
  parsearResultadoCambioMesa,
  validarCambioMesa,
  type ContextoCambioMesa,
  type ResultadoCambioMesa,
} from './cambiarMesa'
import type { Mesa } from '../types/mesas.types'

export interface CambiarMesaParams {
  tenantId: string
  mesaOrigen: Mesa
  mesaDestino: Mesa
  usuarioId?: string | null
  contexto?: ContextoCambioMesa
}

/**
 * Mueve la cuenta abierta de una mesa a otra mesa libre.
 *
 * Todo el trabajo (pedidos, eventos y estados de ambas mesas) lo hace la RPC
 * `cambiar_mesa` en una sola transacción con lock de las dos mesas: si dos
 * personas cambian a la vez, una gana y la otra recibe un error claro.
 * No reimprime cocina ni toca factura, puntos o inventario.
 */
export const cambiarMesaService = {
  async cambiarMesa(params: CambiarMesaParams): Promise<ResultadoCambioMesa> {
    if (!params.tenantId) throw new Error('No hay un local activo.')
    if (params.mesaOrigen.tenant_id !== params.tenantId) {
      throw new Error('La mesa actual no pertenece a este local.')
    }

    const invalido = validarCambioMesa(params.mesaOrigen, params.mesaDestino, params.contexto)
    if (invalido) throw new Error(invalido)

    const supabase = createClient()
    let respuesta: { data: unknown; error: unknown }
    try {
      respuesta = await supabase.rpc('cambiar_mesa', {
        p_tenant_id: params.tenantId,
        p_mesa_origen_id: params.mesaOrigen.id,
        p_mesa_destino_id: params.mesaDestino.id,
        p_usuario_id: params.usuarioId ?? null,
      })
    } catch (e) {
      throw new Error(mensajeErrorCambioMesa(e))
    }

    const { data, error } = respuesta
    if (error) throw new Error(mensajeErrorCambioMesa(error))

    const resultado = parsearResultadoCambioMesa(data)
    // Avisa a otros dispositivos del local (picker de mozos, panel Mesas).
    void broadcastMesasChanged(params.tenantId, 'cambiarMesa')
    return resultado
  },
}
