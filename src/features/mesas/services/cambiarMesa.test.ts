import { describe, expect, it } from 'vitest'
import type { Mesa } from '../types/mesas.types'
import {
  esMesaVirtualParaLlevar,
  mensajeErrorCambioMesa,
  mensajeExitoCambioMesa,
  mesasDestinoDisponibles,
  parsearResultadoCambioMesa,
  puedeCambiarDeMesa,
  validarCambioMesa,
} from './cambiarMesa'

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

describe('esMesaVirtualParaLlevar', () => {
  it('detecta la mesa virtual de para llevar', () => {
    expect(esMesaVirtualParaLlevar(mesa(9, { nombre: '__virtual_para_llevar__' }))).toBe(true)
    expect(esMesaVirtualParaLlevar(mesa(9, { nombre: '__VIRTUAL_PARA_LLEVAR__' }))).toBe(true)
  })
  it('no confunde mesas normales ni nulas', () => {
    expect(esMesaVirtualParaLlevar(mesa(1, { nombre: 'Terraza' }))).toBe(false)
    expect(esMesaVirtualParaLlevar(mesa(1))).toBe(false)
    expect(esMesaVirtualParaLlevar(null)).toBe(false)
  })
})

describe('puedeCambiarDeMesa', () => {
  it('solo una mesa ocupada, activa y física puede cambiar', () => {
    expect(puedeCambiarDeMesa(mesa(1, { estado: 'ocupada' }))).toBe(true)
    expect(puedeCambiarDeMesa(mesa(1, { estado: 'libre' }))).toBe(false)
    expect(puedeCambiarDeMesa(mesa(1, { estado: 'reservada' }))).toBe(false)
    expect(puedeCambiarDeMesa(mesa(1, { estado: 'bloqueada' }))).toBe(false)
    expect(puedeCambiarDeMesa(mesa(1, { estado: 'ocupada', activa: false }))).toBe(false)
    expect(puedeCambiarDeMesa(mesa(1, { estado: 'ocupada', nombre: '__virtual_para_llevar__' }))).toBe(false)
    expect(puedeCambiarDeMesa(null)).toBe(false)
  })
  it('una mesa en unión activa no puede cambiar', () => {
    const m = mesa(1, { estado: 'ocupada' })
    expect(puedeCambiarDeMesa(m, { mesasEnUnion: new Set([m.id]) })).toBe(false)
    expect(puedeCambiarDeMesa(m, { mesasEnUnion: new Set(['otra']) })).toBe(true)
  })
})

describe('validarCambioMesa', () => {
  const origen = mesa(1, { estado: 'ocupada' })
  const libre = mesa(2)

  it('acepta ocupada → libre del mismo local', () => {
    expect(validarCambioMesa(origen, libre)).toBeNull()
  })

  it.each([
    ['sin origen', null, libre, 'mesa actual'],
    ['sin destino', origen, null, 'Elegí la mesa'],
    ['misma mesa', origen, origen, 'no pueden ser la misma'],
    ['otro local', origen, mesa(2, { tenant_id: 'otro' }), 'no pertenece a este local'],
    ['destino ocupada', origen, mesa(2, { estado: 'ocupada' }), 'no está libre'],
    ['destino reservada', origen, mesa(2, { estado: 'reservada' }), 'no está libre'],
    ['destino bloqueada', origen, mesa(2, { estado: 'bloqueada' }), 'no está libre'],
    ['destino inactiva', origen, mesa(2, { activa: false }), 'inactiva'],
    ['origen libre', mesa(1), libre, 'no tiene una cuenta abierta'],
    ['origen para llevar', mesa(1, { estado: 'ocupada', nombre: '__virtual_para_llevar__' }), libre, 'para llevar'],
    ['destino para llevar', origen, mesa(2, { nombre: '__virtual_para_llevar__' }), 'para llevar'],
  ] as const)('rechaza %s', (_caso, o, d, esperado) => {
    expect(validarCambioMesa(o as Mesa | null, d as Mesa | null)).toContain(esperado)
  })

  it('rechaza si origen o destino están en una unión activa', () => {
    expect(validarCambioMesa(origen, libre, { mesasEnUnion: new Set([origen.id]) })).toContain('unión')
    expect(validarCambioMesa(origen, libre, { mesasEnUnion: new Set([libre.id]) })).toContain('unión')
  })

  it('el mensaje de destino no libre nombra la mesa', () => {
    expect(validarCambioMesa(origen, mesa(7, { estado: 'ocupada' }))).toBe('La mesa #7 no está libre (ocupada).')
  })
})

describe('mesasDestinoDisponibles', () => {
  const mesas = [
    mesa(5, { orden: 1 }),
    mesa(1, { estado: 'ocupada', orden: 0 }),
    mesa(3, { estado: 'reservada' }),
    mesa(4, { estado: 'bloqueada' }),
    mesa(2, { orden: 1 }),
    mesa(6, { activa: false }),
    mesa(7, { nombre: '__virtual_para_llevar__' }),
    mesa(8, { tenant_id: 'otro' }),
    mesa(9, { orden: 0 }),
  ]

  it('devuelve solo libres, activas, físicas, del mismo local y distintas al origen', () => {
    const ids = mesasDestinoDisponibles(mesas, 'mesa-1').map((m) => m.numero)
    expect(ids).toEqual([9, 2, 5])
  })

  it('respeta el orden del salón (orden y luego número)', () => {
    const r = mesasDestinoDisponibles(mesas, 'mesa-1')
    expect(r.map((m) => [m.orden, m.numero])).toEqual([[0, 9], [1, 2], [1, 5]])
  })

  it('excluye mesas en unión activa', () => {
    const r = mesasDestinoDisponibles(mesas, 'mesa-1', { mesasEnUnion: new Set(['mesa-2']) })
    expect(r.map((m) => m.numero)).toEqual([9, 5])
  })

  it('lista vacía si no hay libres', () => {
    expect(mesasDestinoDisponibles([mesa(1, { estado: 'ocupada' })], 'mesa-1')).toEqual([])
  })

  it('no muta el arreglo original', () => {
    const copia = mesas.map((m) => m.numero)
    mesasDestinoDisponibles(mesas, 'mesa-1')
    expect(mesas.map((m) => m.numero)).toEqual(copia)
  })
})

describe('parsearResultadoCambioMesa', () => {
  const ok = {
    pedidos_movidos: 2,
    pedido_ids: ['p1', 'p2'],
    total: 80000,
    mesa_origen_numero: 1,
    mesa_destino_numero: 2,
  }

  it('normaliza el JSON de la RPC', () => {
    expect(parsearResultadoCambioMesa(ok)).toEqual({
      pedidosMovidos: 2,
      pedidoIds: ['p1', 'p2'],
      total: 80000,
      mesaOrigenNumero: 1,
      mesaDestinoNumero: 2,
    })
  })

  it('acepta el JSON como string (algunos clientes devuelven jsonb serializado)', () => {
    expect(parsearResultadoCambioMesa(JSON.stringify(ok)).pedidosMovidos).toBe(2)
  })

  it('acepta total numérico como string (numeric de Postgres)', () => {
    expect(parsearResultadoCambioMesa({ ...ok, total: '80000.00' }).total).toBe(80000)
  })

  it('mesa sin pedidos: 0 movidos y lista vacía', () => {
    const r = parsearResultadoCambioMesa({ ...ok, pedidos_movidos: 0, pedido_ids: [], total: 0 })
    expect(r.pedidosMovidos).toBe(0)
    expect(r.pedidoIds).toEqual([])
  })

  it('rechaza respuestas vacías o mal formadas', () => {
    expect(() => parsearResultadoCambioMesa(null)).toThrow('vacía')
    expect(() => parsearResultadoCambioMesa('no-json')).toThrow('vacía')
    expect(() => parsearResultadoCambioMesa({ ...ok, mesa_destino_numero: undefined })).toThrow('formato')
  })
})

describe('mensajeErrorCambioMesa', () => {
  it('limpia el prefijo de las excepciones de la RPC', () => {
    expect(mensajeErrorCambioMesa({ message: 'CAMBIAR_MESA: la mesa #3 no está libre (estado: ocupada).' })).toBe(
      'La mesa #3 no está libre (estado: ocupada).'
    )
  })

  it('avisa si falta aplicar la migración', () => {
    expect(mensajeErrorCambioMesa({ code: 'PGRST202', message: 'Could not find the function public.cambiar_mesa' })).toContain(
      '33_cambiar_mesa.sql'
    )
    expect(
      mensajeErrorCambioMesa({ message: 'Could not find the function public.cambiar_mesa(p_mesa_destino_id) in the schema cache' })
    ).toContain('migración')
  })

  it('traduce errores de red', () => {
    expect(mensajeErrorCambioMesa(new TypeError('Failed to fetch'))).toContain('Sin conexión')
  })

  it('deja pasar otros mensajes y tiene un genérico', () => {
    expect(mensajeErrorCambioMesa(new Error('otra cosa'))).toBe('otra cosa')
    expect(mensajeErrorCambioMesa('texto')).toBe('texto')
    expect(mensajeErrorCambioMesa(undefined)).toBe('No se pudo cambiar la mesa.')
    expect(mensajeErrorCambioMesa({})).toBe('No se pudo cambiar la mesa.')
  })
})

describe('mensajeExitoCambioMesa', () => {
  const base = { pedidoIds: [], total: 0, mesaOrigenNumero: 1, mesaDestinoNumero: 4 }
  it('singular, plural y sin pedidos', () => {
    expect(mensajeExitoCambioMesa({ ...base, pedidosMovidos: 1 })).toBe('Cuenta movida de la mesa #1 a la mesa #4 (1 pedido).')
    expect(mensajeExitoCambioMesa({ ...base, pedidosMovidos: 3 })).toContain('(3 pedidos)')
    expect(mensajeExitoCambioMesa({ ...base, pedidosMovidos: 0 })).toContain('sin pedidos todavía')
  })
})
