import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mesa } from '../types/mesas.types'

const { rpc, broadcastMesasChanged } = vi.hoisted(() => ({
  rpc: vi.fn(),
  broadcastMesasChanged: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ rpc }),
}))

vi.mock('./mesasRealtimeBroadcast', () => ({
  broadcastMesasChanged,
}))

import { cambiarMesaService } from './cambiarMesaService'

const TENANT = 'tenant-1'

function mesa(numero: number, patch: Partial<Mesa> = {}): Mesa {
  return {
    id: `mesa-${numero}`,
    tenant_id: TENANT,
    numero,
    nombre: null,
    capacidad: 4,
    estado: 'libre',
    activa: true,
    orden: numero,
    created_at: '2026-10-31T10:00:00Z',
    updated_at: '2026-10-31T10:00:00Z',
    ...patch,
  }
}

const origen = mesa(1, { estado: 'ocupada' })
const destino = mesa(5)

const respuestaOk = {
  pedidos_movidos: 2,
  pedido_ids: ['p1', 'p2'],
  total: 125000,
  mesa_origen_numero: 1,
  mesa_destino_numero: 5,
}

describe('cambiarMesaService.cambiarMesa', () => {
  beforeEach(() => {
    rpc.mockReset()
    broadcastMesasChanged.mockReset()
  })

  it('llama a la RPC cambiar_mesa con los parámetros correctos', async () => {
    rpc.mockResolvedValue({ data: respuestaOk, error: null })

    const r = await cambiarMesaService.cambiarMesa({
      tenantId: TENANT,
      mesaOrigen: origen,
      mesaDestino: destino,
      usuarioId: 'user-9',
    })

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('cambiar_mesa', {
      p_tenant_id: TENANT,
      p_mesa_origen_id: 'mesa-1',
      p_mesa_destino_id: 'mesa-5',
      p_usuario_id: 'user-9',
    })
    expect(r).toEqual({
      pedidosMovidos: 2,
      pedidoIds: ['p1', 'p2'],
      total: 125000,
      mesaOrigenNumero: 1,
      mesaDestinoNumero: 5,
    })
  })

  it('manda usuario null cuando no hay usuario', async () => {
    rpc.mockResolvedValue({ data: respuestaOk, error: null })
    await cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: origen, mesaDestino: destino })
    expect(rpc.mock.calls[0][1].p_usuario_id).toBeNull()
  })

  it('avisa a los otros dispositivos del local solo si salió bien', async () => {
    rpc.mockResolvedValue({ data: respuestaOk, error: null })
    await cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: origen, mesaDestino: destino })
    expect(broadcastMesasChanged).toHaveBeenCalledWith(TENANT, 'cambiarMesa')

    broadcastMesasChanged.mockReset()
    rpc.mockResolvedValue({ data: null, error: { message: 'CAMBIAR_MESA: la mesa #5 no está libre (estado: ocupada).' } })
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: origen, mesaDestino: destino })
    ).rejects.toThrow('La mesa #5 no está libre (estado: ocupada).')
    expect(broadcastMesasChanged).not.toHaveBeenCalled()
  })

  it('no llama al servidor si la validación local falla', async () => {
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: origen, mesaDestino: mesa(5, { estado: 'ocupada' }) })
    ).rejects.toThrow('no está libre')
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: origen, mesaDestino: origen })
    ).rejects.toThrow('no pueden ser la misma')
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: mesa(1), mesaDestino: destino })
    ).rejects.toThrow('no tiene una cuenta abierta')
    await expect(
      cambiarMesaService.cambiarMesa({
        tenantId: TENANT,
        mesaOrigen: origen,
        mesaDestino: destino,
        contexto: { mesasEnUnion: new Set(['mesa-5']) },
      })
    ).rejects.toThrow('unión')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('rechaza mesas de otro local o sin local activo', async () => {
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: 'otro', mesaOrigen: origen, mesaDestino: destino })
    ).rejects.toThrow('no pertenece a este local')
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: '', mesaOrigen: origen, mesaDestino: destino })
    ).rejects.toThrow('No hay un local activo')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('explica que falta la migración si la función no existe en la base', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.cambiar_mesa(...) in the schema cache' },
    })
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: origen, mesaDestino: destino })
    ).rejects.toThrow('33_cambiar_mesa.sql')
  })

  it('propaga errores de red con un mensaje entendible', async () => {
    rpc.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: origen, mesaDestino: destino })
    ).rejects.toThrow('Sin conexión')
    expect(broadcastMesasChanged).not.toHaveBeenCalled()
  })

  it('falla si la RPC responde algo inesperado', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    await expect(
      cambiarMesaService.cambiarMesa({ tenantId: TENANT, mesaOrigen: origen, mesaDestino: destino })
    ).rejects.toThrow('vacía')
    expect(broadcastMesasChanged).not.toHaveBeenCalled()
  })
})
