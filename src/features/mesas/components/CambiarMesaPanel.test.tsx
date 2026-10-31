import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mesa } from '../types/mesas.types'
import { CambiarMesaPanel } from './CambiarMesaPanel'

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

const origen = mesa(1, { estado: 'ocupada' })
const salon = [origen, mesa(2), mesa(3, { estado: 'ocupada' }), mesa(4, { estado: 'reservada' }), mesa(5)]

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup(over: Partial<ComponentProps<typeof CambiarMesaPanel>> = {}) {
  const props = {
    mesaOrigen: origen,
    totalCuenta: 85000,
    cargarMesas: vi.fn().mockResolvedValue(salon),
    onConfirmar: vi.fn().mockResolvedValue(undefined),
    onCancelar: vi.fn(),
    ...over,
  }
  const user = userEvent.setup()
  render(<CambiarMesaPanel {...props} />)
  return { props, user }
}

const botonMover = () => screen.getByRole('button', { name: /mover a mesa|elegí una mesa|moviendo/i }) as HTMLButtonElement

describe('CambiarMesaPanel', () => {
  it('carga las mesas al abrir y muestra solo las libres (sin la de origen)', async () => {
    const { props } = setup()
    expect(screen.getByRole('status').textContent).toContain('Buscando mesas libres')
    const opciones = await screen.findAllByRole('radio')
    expect(props.cargarMesas).toHaveBeenCalledTimes(1)
    expect(opciones.map((o) => o.textContent)).toEqual([expect.stringContaining('Mesa #2'), expect.stringContaining('Mesa #5')])
    expect(screen.queryByText(/Mesa #3/)).toBeNull()
    expect(screen.queryByText(/Mesa #4/)).toBeNull()
  })

  it('el botón de mover está deshabilitado hasta elegir destino', async () => {
    const { user } = setup()
    await screen.findAllByRole('radio')
    expect(botonMover().disabled).toBe(true)
    expect(botonMover().textContent).toContain('Elegí una mesa')

    await user.click(screen.getByRole('radio', { name: /Mesa #5/ }))
    expect(screen.getByRole('radio', { name: /Mesa #5/ }).getAttribute('aria-checked')).toBe('true')
    expect(botonMover().disabled).toBe(false)
    expect(botonMover().textContent).toContain('Mover a mesa #5')
    expect(screen.getByText(/Se mueven todos los pedidos abiertos de la mesa #1/).textContent).toContain('Gs. 85.000')
  })

  it('confirma con la mesa elegida', async () => {
    const { user, props } = setup()
    await user.click(await screen.findByRole('radio', { name: /Mesa #2/ }))
    await user.click(botonMover())
    expect(props.onConfirmar).toHaveBeenCalledTimes(1)
    expect(props.onConfirmar).toHaveBeenCalledWith(expect.objectContaining({ id: 'mesa-2', numero: 2 }))
  })

  it('evita el doble envío mientras está moviendo', async () => {
    const d = deferred<void>()
    const { user, props } = setup({ onConfirmar: vi.fn(() => d.promise) })
    await user.click(await screen.findByRole('radio', { name: /Mesa #2/ }))
    await user.click(botonMover())
    expect(botonMover().textContent).toContain('Moviendo')
    expect(botonMover().disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true)
    await user.click(botonMover())
    expect(props.onConfirmar).toHaveBeenCalledTimes(1)
    await act(async () => d.resolve())
  })

  it('si falla muestra el error traducido y recarga la lista', async () => {
    const cargarMesas = vi
      .fn()
      .mockResolvedValueOnce(salon)
      // Otra persona ocupó la mesa 2 mientras tanto.
      .mockResolvedValueOnce(salon.map((m) => (m.numero === 2 ? { ...m, estado: 'ocupada' as const } : m)))
    const onConfirmar = vi.fn().mockRejectedValue(new Error('CAMBIAR_MESA: la mesa #2 no está libre (estado: ocupada).'))
    const { user } = setup({ cargarMesas, onConfirmar })

    await user.click(await screen.findByRole('radio', { name: /Mesa #2/ }))
    await user.click(botonMover())

    expect((await screen.findByRole('alert')).textContent).toBe('La mesa #2 no está libre (estado: ocupada).')
    await waitFor(() => expect(cargarMesas).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('radio', { name: /Mesa #2/ })).toBeNull())
    // La selección se limpia porque la mesa ya no está disponible.
    expect(botonMover().disabled).toBe(true)
  })

  it('sin mesas libres muestra el aviso y no ofrece mover', async () => {
    setup({ cargarMesas: vi.fn().mockResolvedValue([origen, mesa(2, { estado: 'ocupada' })]) })
    expect(await screen.findByText(/No hay mesas libres/)).toBeTruthy()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(botonMover().disabled).toBe(true)
  })

  it('si falla la carga permite reintentar', async () => {
    const cargarMesas = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValueOnce(salon)
    const { user } = setup({ cargarMesas })
    expect((await screen.findByRole('alert')).textContent).toContain('Sin conexión')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findAllByRole('radio')).toHaveLength(2)
  })

  it('el botón actualizar vuelve a pedir las mesas', async () => {
    const { user, props } = setup()
    await screen.findAllByRole('radio')
    await user.click(screen.getByRole('button', { name: 'Actualizar mesas libres' }))
    await waitFor(() => expect(props.cargarMesas).toHaveBeenCalledTimes(2))
  })

  it('cancelar llama a onCancelar sin confirmar', async () => {
    const { user, props } = setup()
    await screen.findAllByRole('radio')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(props.onCancelar).toHaveBeenCalledTimes(1)
    expect(props.onConfirmar).not.toHaveBeenCalled()
  })

  it('excluye mesas en unión activa', async () => {
    setup({ mesasEnUnion: new Set(['mesa-5']) })
    const opciones = await screen.findAllByRole('radio')
    expect(opciones).toHaveLength(1)
    expect(opciones[0].textContent).toContain('Mesa #2')
  })

  it('no rompe si se desmonta mientras carga', async () => {
    const d = deferred<Mesa[]>()
    const { unmount } = render(
      <CambiarMesaPanel mesaOrigen={origen} cargarMesas={() => d.promise} onConfirmar={vi.fn()} onCancelar={vi.fn()} />
    )
    unmount()
    await act(async () => d.resolve(salon))
  })
})
