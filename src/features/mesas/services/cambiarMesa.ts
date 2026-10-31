/**
 * "Cambiar mesa": reglas puras (sin Supabase) compartidas por la UI y el servicio.
 *
 * La fuente de verdad es la RPC `public.cambiar_mesa` (database/33_cambiar_mesa.sql),
 * que vuelve a validar todo con locks. Estas reglas existen para:
 *  - mostrar solo destinos válidos en el selector,
 *  - cortar temprano con un mensaje claro sin ir al servidor,
 *  - traducir los errores de la RPC a texto para el mozo/cajero.
 */
import type { Mesa } from '../types/mesas.types'

export const NOMBRE_MESA_VIRTUAL_PARA_LLEVAR = '__virtual_para_llevar__'

/** Prefijo de todas las excepciones de la RPC (ver migración 33). */
const PREFIJO_ERROR_RPC = 'CAMBIAR_MESA:'

export function esMesaVirtualParaLlevar(mesa: Pick<Mesa, 'nombre'> | null | undefined): boolean {
  const nombre = (mesa?.nombre ?? '').toLowerCase()
  return nombre === NOMBRE_MESA_VIRTUAL_PARA_LLEVAR || nombre.includes('virtual_para_llevar')
}

export interface ContextoCambioMesa {
  /** IDs de mesas que pertenecen a una unión activa (si se conocen). */
  mesasEnUnion?: ReadonlySet<string>
}

/** ¿Se puede ofrecer "Cambiar mesa" para esta mesa? */
export function puedeCambiarDeMesa(
  mesa: Pick<Mesa, 'id' | 'estado' | 'activa' | 'nombre'> | null | undefined,
  ctx: ContextoCambioMesa = {}
): boolean {
  if (!mesa) return false
  if (!mesa.activa) return false
  if (mesa.estado !== 'ocupada') return false
  if (esMesaVirtualParaLlevar(mesa)) return false
  if (ctx.mesasEnUnion?.has(mesa.id)) return false
  return true
}

/**
 * Valida un cambio origen → destino con los datos que tiene el cliente.
 * Devuelve el mensaje de error para mostrar, o `null` si es válido.
 */
export function validarCambioMesa(
  origen: Mesa | null | undefined,
  destino: Mesa | null | undefined,
  ctx: ContextoCambioMesa = {}
): string | null {
  if (!origen) return 'No se encontró la mesa actual.'
  if (!destino) return 'Elegí la mesa a la que se mudan.'
  if (origen.id === destino.id) return 'La mesa origen y destino no pueden ser la misma.'
  if (origen.tenant_id !== destino.tenant_id) return 'La mesa destino no pertenece a este local.'
  if (esMesaVirtualParaLlevar(origen) || esMesaVirtualParaLlevar(destino)) {
    return 'Las cuentas para llevar no se pueden cambiar de mesa.'
  }
  if (!origen.activa || !destino.activa) return 'Una de las mesas está inactiva.'
  if (origen.estado !== 'ocupada') return `La mesa #${origen.numero} no tiene una cuenta abierta.`
  if (destino.estado !== 'libre') {
    return `La mesa #${destino.numero} no está libre (${destino.estado}).`
  }
  if (ctx.mesasEnUnion?.has(origen.id) || ctx.mesasEnUnion?.has(destino.id)) {
    return 'Una de las mesas está en una unión activa. Cerrá la unión primero.'
  }
  return null
}

/** Mesas a las que se puede mudar la cuenta de `origenId`, en el orden del salón. */
export function mesasDestinoDisponibles(
  mesas: Mesa[],
  origenId: string,
  ctx: ContextoCambioMesa = {}
): Mesa[] {
  const origen = mesas.find((m) => m.id === origenId)
  return mesas
    .filter((m) => m.id !== origenId)
    .filter((m) => !origen || m.tenant_id === origen.tenant_id)
    .filter((m) => m.activa && m.estado === 'libre')
    .filter((m) => !esMesaVirtualParaLlevar(m))
    .filter((m) => !ctx.mesasEnUnion?.has(m.id))
    .sort((a, b) => a.orden - b.orden || a.numero - b.numero)
}

export interface ResultadoCambioMesa {
  pedidosMovidos: number
  pedidoIds: string[]
  total: number
  mesaOrigenNumero: number
  mesaDestinoNumero: number
}

/** Normaliza el JSON que devuelve la RPC. Lanza si viene algo inesperado. */
export function parsearResultadoCambioMesa(data: unknown): ResultadoCambioMesa {
  const raw = (typeof data === 'string' ? safeJson(data) : data) as Record<string, unknown> | null
  if (!raw || typeof raw !== 'object') {
    throw new Error('La respuesta del cambio de mesa vino vacía.')
  }
  const num = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : NaN
  }
  const resultado: ResultadoCambioMesa = {
    pedidosMovidos: num(raw.pedidos_movidos),
    pedidoIds: Array.isArray(raw.pedido_ids) ? raw.pedido_ids.map(String) : [],
    total: num(raw.total ?? 0),
    mesaOrigenNumero: num(raw.mesa_origen_numero),
    mesaDestinoNumero: num(raw.mesa_destino_numero),
  }
  if (
    !Number.isFinite(resultado.pedidosMovidos) ||
    !Number.isFinite(resultado.mesaOrigenNumero) ||
    !Number.isFinite(resultado.mesaDestinoNumero)
  ) {
    throw new Error('La respuesta del cambio de mesa no tiene el formato esperado.')
  }
  return resultado
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

/** Convierte cualquier error (PostgREST, RPC, red) en un mensaje para el usuario. */
export function mensajeErrorCambioMesa(err: unknown): string {
  const e = (err ?? {}) as { message?: unknown; code?: unknown; details?: unknown }
  const message = typeof e.message === 'string' ? e.message : typeof err === 'string' ? err : ''
  const code = typeof e.code === 'string' ? e.code : ''

  // La función no existe en esta base (migración 33 sin aplicar).
  if (code === 'PGRST202' || /could not find the function.*cambiar_mesa/i.test(message)) {
    return 'La función "cambiar mesa" todavía no está instalada en la base de datos (falta aplicar la migración 33_cambiar_mesa.sql).'
  }

  const idx = message.indexOf(PREFIJO_ERROR_RPC)
  if (idx >= 0) {
    const limpio = message.slice(idx + PREFIJO_ERROR_RPC.length).trim()
    if (limpio) return limpio.charAt(0).toUpperCase() + limpio.slice(1)
  }

  if (/failed to fetch|network|fetch failed/i.test(message)) {
    return 'Sin conexión: no se pudo cambiar la mesa. Revisá internet y reintentá.'
  }

  return message || 'No se pudo cambiar la mesa.'
}

/** Texto de confirmación para el feedback de la UI. */
export function mensajeExitoCambioMesa(r: ResultadoCambioMesa): string {
  const pedidos =
    r.pedidosMovidos === 0
      ? 'sin pedidos todavía'
      : r.pedidosMovidos === 1
        ? '1 pedido'
        : `${r.pedidosMovidos} pedidos`
  return `Cuenta movida de la mesa #${r.mesaOrigenNumero} a la mesa #${r.mesaDestinoNumero} (${pedidos}).`
}
