import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mesa, ResumenMesa } from '../types/mesas.types'

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }))
vi.mock('../hooks/useRealtimeMesaDetalle', () => ({ useRealtimeMesaDetalle: () => undefined }))

import { DetalleMesaModal, type DetalleMesaModalProps } from './DetalleMesaModal'

function mesa(numero: number, patch: Partial<Mesa> = {}): Mesa {
  return {
    id: `mesa-${numero}`,
    tenant_id: 'tenant-1',
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

const ocupada = mesa(3, { estado: 'ocupada' })
const resumen: ResumenMesa = { mesa_id: ocupada.id, pedidos: [], total_items: 0, total_acumulado: 120000 }

function renderModal(over: Partial<DetalleMesaModalProps> = {}) {
  const props: DetalleMesaModalProps = {
    tenantId: 'tenant-1',
    mesa: ocupada,
    reservasMesa: [],
    resumenPedido: resumen,
    loadingResumen: false,
    feedback: null,
    onClose: vi.fn(),
    onCambiarMesa: vi.fn().mockResolvedValue(undefined),
    cargarMesasCambio: vi.fn().mockResolvedValue([ocupada, mesa(7), mesa(8, { estado: 'reservada' })]),
    ...over,
  }
  render(<DetalleMesaModal {...props} />)
  return { props, user: userEvent.setup() }
}

const botonCambiar = () => screen.queryByRole('button', { name: /^Cambiar mesa$/ }) as HTMLButtonElement | null

describe('DetalleMesaModal › Cambiar mesa', () => {
  it('muestra "Cambiar mesa" en una mesa ocupada cuando hay handler', () => {
    renderModal()
    expect(botonCambiar()).not.toBeNull()
    expect(botonCambiar()!.disabled).toBe(false)
  })

  it('no lo muestra si la pantalla no pasa el handler', () => {
    renderModal({ onCambiarMesa: undefined })
    expect(botonCambiar()).toBeNull()
  })

  it('no lo muestra en cuentas para llevar', () => {
    renderModal({ takeawayAccountMode: true })
    expect(botonCambiar()).toBeNull()
  })

  it('lo deshabilita si la mesa no está ocupada o está en una unión', () => {
    renderModal({ mesa: mesa(3, { estado: 'libre' }) })
    expect(botonCambiar()!.disabled).toBe(true)
  })

  it('lo deshabilita si la mesa está en una unión activa', () => {
    renderModal({ mesasEnUnion: new Set([ocupada.id]) })
    expect(botonCambiar()!.disabled).toBe(true)
  })

  it('abre el selector, elige destino y llama a onCambiarMesa(origen, destino)', async () => {
    const { props, user } = renderModal()
    await user.click(botonCambiar()!)
    expect(props.cargarMesasCambio).toHaveBeenCalledTimes(1)
    const opciones = await screen.findAllByRole('radio')
    expect(opciones).toHaveLength(1)
    expect(screen.getByText(/Gs\. 120\.000/, { exact: false })).toBeTruthy()

    await user.click(opciones[0])
    await user.click(screen.getByRole('button', { name: 'Mover a mesa #7' }))

    expect(props.onCambiarMesa).toHaveBeenCalledWith(ocupada, expect.objectContaining({ id: 'mesa-7' }))
    // Al terminar, el selector se cierra y vuelve el botón.
    expect(await screen.findByRole('button', { name: /^Cambiar mesa$/ })).toBeTruthy()
  })

  it('si el cambio falla, el selector queda abierto con el error', async () => {
    const { user } = renderModal({
      onCambiarMesa: vi.fn().mockRejectedValue(new Error('CAMBIAR_MESA: la mesa #7 tiene una cuenta abierta.')),
    })
    await user.click(botonCambiar()!)
    await user.click((await screen.findAllByRole('radio'))[0])
    await user.click(screen.getByRole('button', { name: 'Mover a mesa #7' }))
    expect((await screen.findByRole('alert')).textContent).toBe('La mesa #7 tiene una cuenta abierta.')
    expect(screen.getByRole('region', { name: 'Cambiar mesa' })).toBeTruthy()
  })

  it('cancelar vuelve al botón sin cambiar nada', async () => {
    const { props, user } = renderModal()
    await user.click(botonCambiar()!)
    await screen.findAllByRole('radio')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(botonCambiar()).not.toBeNull()
    expect(props.onCambiarMesa).not.toHaveBeenCalled()
  })
})
