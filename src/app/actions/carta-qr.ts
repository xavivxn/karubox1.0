'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createCartaPublicSupabaseClient } from '@/lib/supabase/cartaPublic'
import { validarFormulario, limpiarFormData } from '@/features/clientes/utils/clientes.utils'
import type { ClienteFormData } from '@/features/clientes/types/clientes.types'

export interface CartaQrRegisterInput {
  tenantId: string
  nombre: string
  telefono: string
  ci: string
  ruc: string
  pasaporte: string
  email: string
  direccion: string
  fecha_nacimiento: string
}

export interface CartaQrRegisterResult {
  ok: boolean
  error: string | null
  created: boolean
}

type RpcInsertResult = { ok?: boolean; error?: string }

export async function registerClienteFromCartaQr(input: CartaQrRegisterInput): Promise<CartaQrRegisterResult> {
  const tenantId = input.tenantId?.trim()
  if (!tenantId) {
    return { ok: false, error: 'Local invalido', created: false }
  }

  const formData: ClienteFormData = {
    nombre: input.nombre ?? '',
    telefono: input.telefono ?? '',
    ci: input.ci ?? '',
    ruc: input.ruc ?? '',
    pasaporte: input.pasaporte ?? '',
    email: input.email ?? '',
    direccion: input.direccion ?? '',
    fecha_nacimiento: input.fecha_nacimiento ?? '',
  }

  const validation = validarFormulario(formData)
  if (!validation.valid) {
    return { ok: false, error: validation.error ?? 'Datos invalidos', created: false }
  }

  const clean = limpiarFormData(formData)
  if (!clean.nombre || (!clean.telefono && !clean.ci && !clean.ruc)) {
    return {
      ok: false,
      error: 'Por favor completa nombre y al menos telefono, CI o RUC',
      created: false,
    }
  }

  const pPayload = {
    tenant_id: tenantId,
    nombre: clean.nombre,
    telefono: clean.telefono ?? '',
    ci: clean.ci ?? '',
    ruc: clean.ruc ?? '',
    pasaporte: clean.pasaporte ?? '',
    email: clean.email ?? '',
    direccion: clean.direccion ?? '',
    fecha_nacimiento: clean.fecha_nacimiento ?? '',
  }

  const publicClient = createCartaPublicSupabaseClient()
  const { data: rpcData, error: rpcError } = await publicClient.rpc('insert_cliente_carta_qr', {
    p_payload: pPayload,
  })

  if (!rpcError && rpcData != null && typeof rpcData === 'object') {
    const r = rpcData as RpcInsertResult
    if (r.ok === true) {
      return { ok: true, error: null, created: true }
    }
    if (r.ok === false) {
      return { ok: false, error: r.error ?? 'No se pudo registrar', created: false }
    }
  }

  if (rpcError) {
    console.warn('[carta-qr] RPC insert_cliente_carta_qr:', rpcError.message, '→ fallback admin')
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('clientes').insert({
      tenant_id: tenantId,
      nombre: clean.nombre,
      ci: clean.ci,
      ruc: clean.ruc,
      pasaporte: clean.pasaporte,
      telefono: clean.telefono,
      email: clean.email,
      direccion: clean.direccion,
      fecha_nacimiento: clean.fecha_nacimiento,
      puntos_totales: 0,
      is_deleted: false,
    })

    if (error) {
      console.error('registerClienteFromCartaQr insert error:', {
        message: error.message,
        code: error.code,
        tenantId,
      })
      const rawMessage = (error.message || '').toLowerCase()
      if (rawMessage.includes('permission denied') || rawMessage.includes('row-level security')) {
        return {
          ok: false,
          error:
            'No se pudo registrar. Ejecutá en Supabase el script database/23_insert_cliente_carta_rpc.sql (o revisá SUPABASE_SERVICE_ROLE_KEY en el servidor).',
          created: false,
        }
      }
      return {
        ok: false,
        error: `No se pudo guardar tu registro: ${error.message || 'error desconocido'}`,
        created: false,
      }
    }

    return { ok: true, error: null, created: true }
  } catch (e) {
    console.error('registerClienteFromCartaQr:', e)
    return {
      ok: false,
      error:
        'No se pudo registrar. Ejecutá en Supabase database/23_insert_cliente_carta_rpc.sql y verificá las variables de entorno.',
      created: false,
    }
  }
}
