'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
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
  // Alineado al POS: nombre + (telefono o CI o RUC)
  if (!clean.nombre || (!clean.telefono && !clean.ci && !clean.ruc)) {
    return {
      ok: false,
      error: 'Por favor completa nombre y al menos telefono, CI o RUC',
      created: false,
    }
  }

  const sessionClient = await createServerClient()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()
  const supabase = user ? sessionClient : createAdminClient()

  const { error } = await supabase
    .from('clientes')
    .insert({
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
      details: error.details,
      hint: error.hint,
      tenantId,
    })
    const rawMessage = (error.message || '').toLowerCase()
    if (rawMessage.includes('permission denied') || rawMessage.includes('row-level security')) {
      return {
        ok: false,
        error: 'No hay permisos para registrar clientes desde carta QR. Revisá políticas de Supabase.',
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
}

