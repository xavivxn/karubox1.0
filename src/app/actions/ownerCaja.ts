'use server'

import { createClient } from '@/lib/supabase/server'

type OwnerCajaResult<T = void> = { success: true; data: T } | { success: false; error: string }

export type OwnerCashMovementType =
  | 'inversion'
  | 'gasto'
  | 'pago_proveedor'
  | 'retiro_socios'
  | 'ajuste'

export type OwnerSocio = 'naser' | 'ivan'

export interface OwnerCashMovementInput {
  tenantId?: string | null
  tipo: OwnerCashMovementType
  monto: number
  descripcion?: string
  categoria?: string
  socio?: OwnerSocio | null
  fecha?: string
  pagado?: boolean
  fecha_pago?: string | null
}

export interface OwnerCashMovement extends OwnerCashMovementInput {
  id: string
  owner_id: string | null
  created_at: string
  updated_at: string
}

export interface OwnerCashSummaryFilters {
  from: string
  to: string
  tenantId?: string | null
}

export interface OwnerCashSummary {
  totalInversion: number
  totalGastos: number
  totalPagosProveedores: number
  totalRetirosSocios: number
  totalAjustes: number
  gananciaOperativa: number
  gananciaNetaParaRepartir: number
  porSocio: {
    naser: {
      corresponde: number
      retirado: number
      saldo: number
    }
    ivan: {
      corresponde: number
      retirado: number
      saldo: number
    }
  }
}

export interface OwnerMonthlyExpense {
  id: string
  concepto: string
  monto: number
  fecha_inicio: string
  activo: boolean
  notas: string | null
  created_at: string
  updated_at: string
}

async function assertOwnerForCaja() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' as const, supabase: null }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, rol')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (!usuario || usuario.rol !== 'owner') {
    return { error: 'Sin permisos para caja de owners' as const, supabase: null }
  }

  return { error: null, supabase, ownerUserId: usuario.id as string }
}

export async function createOwnerCashMovement(
  input: OwnerCashMovementInput
): Promise<OwnerCajaResult<OwnerCashMovement>> {
  const { error, supabase, ownerUserId } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  if (!input.tipo) return { success: false, error: 'El tipo de movimiento es requerido.' }
  if (!Number.isFinite(input.monto) || input.monto <= 0) {
    return { success: false, error: 'El monto debe ser mayor a cero.' }
  }

  const fecha = input.fecha ? new Date(input.fecha) : new Date()
  if (Number.isNaN(fecha.getTime())) {
    return { success: false, error: 'La fecha no es válida.' }
  }

  const payload: Record<string, unknown> = {
    owner_id: ownerUserId,
    tenant_id: input.tenantId || null,
    tipo: input.tipo,
    monto: input.monto,
    descripcion: input.descripcion?.trim() || null,
    categoria: input.categoria?.trim() || null,
    socio: input.socio ?? null,
    fecha: fecha.toISOString().slice(0, 10),
    pagado: input.pagado ?? true,
    fecha_pago: input.fecha_pago ?? null,
  }

  const { data, error: insertError } = await supabase
    .from('owner_cash_movements')
    .insert(payload)
    .select('*')
    .single()

  if (insertError || !data) {
    console.error('[createOwnerCashMovement] error:', insertError)
    return { success: false, error: 'Error al crear el movimiento de caja.' }
  }

  return { success: true, data: data as OwnerCashMovement }
}

export interface ListOwnerCashMovementsFilters {
  from?: string
  to?: string
  tenantId?: string | null
  tipo?: OwnerCashMovementType | 'all'
  pagado?: boolean | 'all'
}

export async function listOwnerCashMovements(
  filters: ListOwnerCashMovementsFilters
): Promise<OwnerCajaResult<OwnerCashMovement[]>> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  let query = supabase
    .from('owner_cash_movements')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.from) {
    query = query.gte('fecha', filters.from)
  }
  if (filters.to) {
    query = query.lte('fecha', filters.to)
  }
  if (filters.tenantId) {
    query = query.eq('tenant_id', filters.tenantId)
  }
  if (filters.tipo && filters.tipo !== 'all') {
    query = query.eq('tipo', filters.tipo)
  }
  if (filters.pagado !== undefined && filters.pagado !== 'all') {
    query = query.eq('pagado', filters.pagado)
  }

  const { data, error: listError } = await query

  if (listError) {
    console.error('[listOwnerCashMovements] error:', listError)
    return { success: false, error: 'Error al listar movimientos de caja.' }
  }

  return { success: true, data: (data ?? []) as OwnerCashMovement[] }
}

export async function getOwnerDebts(
  filters: { tenantId?: string | null } = {}
): Promise<OwnerCajaResult<OwnerCashMovement[]>> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  let query = supabase
    .from('owner_cash_movements')
    .select('*')
    .eq('pagado', false)
    .order('fecha', { ascending: true })

  if (filters.tenantId) {
    query = query.eq('tenant_id', filters.tenantId)
  }

  const { data, error: listError } = await query

  if (listError) {
    console.error('[getOwnerDebts] error:', listError)
    return { success: false, error: 'Error al listar deudas.' }
  }

  return { success: true, data: (data ?? []) as OwnerCashMovement[] }
}

export async function markOwnerCashMovementPaid(id: string): Promise<OwnerCajaResult<OwnerCashMovement>> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  const today = new Date().toISOString().slice(0, 10)

  const { data, error: updateError } = await supabase
    .from('owner_cash_movements')
    .update({ pagado: true, fecha_pago: today })
    .eq('id', id)
    .select('*')
    .single()

  if (updateError || !data) {
    console.error('[markOwnerCashMovementPaid] error:', updateError)
    return { success: false, error: 'No se pudo marcar como pagado.' }
  }

  return { success: true, data: data as OwnerCashMovement }
}

export async function listOwnerInvestments(): Promise<OwnerCajaResult<OwnerCashMovement[]>> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  const { data, error: listError } = await supabase
    .from('owner_cash_movements')
    .select('*')
    .eq('tipo', 'inversion')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (listError) {
    console.error('[listOwnerInvestments] error:', listError)
    return { success: false, error: 'Error al listar inversiones.' }
  }

  return { success: true, data: (data ?? []) as OwnerCashMovement[] }
}

export async function getOwnerInvestmentsSummary(): Promise<
  OwnerCajaResult<{ totalInvertido: number; porSocio: { naser: number; ivan: number } }>
> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  const { data, error: listError } = await supabase
    .from('owner_cash_movements')
    .select('monto, socio')
    .eq('tipo', 'inversion')

  if (listError) {
    console.error('[getOwnerInvestmentsSummary] error:', listError)
    return { success: false, error: 'Error al calcular resumen de inversiones.' }
  }

  let totalInvertido = 0
  let totalNaser = 0
  let totalIvan = 0

  for (const row of (data ?? []) as { monto: number; socio: OwnerSocio | null }[]) {
    const monto = Number(row.monto) || 0
    totalInvertido += monto
    if (row.socio === 'naser') totalNaser += monto
    if (row.socio === 'ivan') totalIvan += monto
  }

  return {
    success: true,
    data: {
      totalInvertido,
      porSocio: { naser: totalNaser, ivan: totalIvan },
    },
  }
}

export async function getOwnerCashSummary(
  filters: OwnerCashSummaryFilters
): Promise<OwnerCajaResult<OwnerCashSummary>> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  if (!filters.from || !filters.to) {
    return { success: false, error: 'Rango de fechas inválido.' }
  }

  const sesionesQuery = supabase
    .from('sesiones_caja')
    .select('ganancia_neta, apertura_at')
    .gte('apertura_at', filters.from)
    .lte('apertura_at', filters.to)

  const movimientosQuery = supabase
    .from('owner_cash_movements')
    .select('*')
    .gte('fecha', filters.from)
    .lte('fecha', filters.to)

  const [sesionesRes, movimientosRes] = await Promise.all([sesionesQuery, movimientosQuery])

  if (sesionesRes.error) {
    console.error('[getOwnerCashSummary] sesiones error:', sesionesRes.error)
    return { success: false, error: 'No se pudo calcular la ganancia operativa.' }
  }

  let movimientos: OwnerCashMovement[] = []
  if (movimientosRes.error) {
    console.error('[getOwnerCashSummary] movimientos error:', movimientosRes.error)

    const code = (movimientosRes.error as any).code as string | undefined
    const message = movimientosRes.error.message || ''

    const isMissingTable =
      code === '42P01' ||
      message.toLowerCase().includes('owner_cash_movements') &&
        message.toLowerCase().includes('does not exist')

    if (!isMissingTable) {
      return { success: false, error: 'No se pudieron leer los movimientos de owners.' }
    }

    movimientos = []
  } else {
    movimientos = (movimientosRes.data ?? []) as OwnerCashMovement[]
  }

  const sesiones = (sesionesRes.data ?? []) as { ganancia_neta: number | null }[]

  const gananciaOperativa = sesiones.reduce(
    (acc, s) => acc + (Number(s.ganancia_neta) || 0),
    0
  )

  let totalInversion = 0
  let totalGastos = 0
  let totalPagosProveedores = 0
  let totalRetirosSocios = 0
  let totalAjustes = 0
  let retiradoNaser = 0
  let retiradoIvan = 0

  for (const m of movimientos) {
    const monto = Number(m.monto) || 0
    switch (m.tipo) {
      case 'inversion':
        totalInversion += monto
        break
      case 'gasto':
        totalGastos += monto
        break
      case 'pago_proveedor':
        totalPagosProveedores += monto
        break
      case 'retiro_socios':
        totalRetirosSocios += monto
        if (m.socio === 'naser') retiradoNaser += monto
        if (m.socio === 'ivan') retiradoIvan += monto
        break
      case 'ajuste':
        totalAjustes += monto
        break
      default:
        break
    }
  }

  const gastosOwners = totalGastos + totalPagosProveedores
  const gananciaNetaParaRepartir =
    gananciaOperativa - gastosOwners + totalAjustes - totalRetirosSocios

  const correspondeCadaSocio = gananciaNetaParaRepartir / 2

  const porSocio = {
    naser: {
      corresponde: correspondeCadaSocio,
      retirado: retiradoNaser,
      saldo: correspondeCadaSocio - retiradoNaser,
    },
    ivan: {
      corresponde: correspondeCadaSocio,
      retirado: retiradoIvan,
      saldo: correspondeCadaSocio - retiradoIvan,
    },
  }

  const summary: OwnerCashSummary = {
    totalInversion,
    totalGastos,
    totalPagosProveedores,
    totalRetirosSocios,
    totalAjustes,
    gananciaOperativa,
    gananciaNetaParaRepartir,
    porSocio,
  }

  return { success: true, data: summary }
}

export async function createOwnerMonthlyExpense(input: {
  concepto: string
  monto: number
  fecha_inicio: string
  notas?: string
}): Promise<OwnerCajaResult<OwnerMonthlyExpense>> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  if (!input.concepto.trim()) return { success: false, error: 'El concepto es obligatorio.' }
  if (!Number.isFinite(input.monto) || input.monto <= 0) {
    return { success: false, error: 'El monto debe ser mayor a cero.' }
  }

  const fecha = new Date(input.fecha_inicio)
  if (Number.isNaN(fecha.getTime())) return { success: false, error: 'La fecha no es válida.' }

  const { data, error: insertError } = await supabase
    .from('owner_monthly_expenses')
    .insert({
      concepto: input.concepto.trim(),
      monto: input.monto,
      fecha_inicio: fecha.toISOString().slice(0, 10),
      notas: input.notas?.trim() || null,
      activo: true,
    })
    .select('*')
    .single()

  if (insertError || !data) {
    console.error('[createOwnerMonthlyExpense] error:', insertError)
    return { success: false, error: 'No se pudo crear el gasto mensual.' }
  }

  return { success: true, data: data as OwnerMonthlyExpense }
}

export async function listOwnerMonthlyExpenses(): Promise<OwnerCajaResult<OwnerMonthlyExpense[]>> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  const { data, error: listError } = await supabase
    .from('owner_monthly_expenses')
    .select('*')
    .eq('activo', true)
    .order('concepto', { ascending: true })

  if (listError) {
    console.error('[listOwnerMonthlyExpenses] error:', listError)
    return { success: false, error: 'Error al listar pagos mensuales.' }
  }

  return { success: true, data: (data ?? []) as OwnerMonthlyExpense[] }
}

export async function deactivateOwnerMonthlyExpense(id: string): Promise<OwnerCajaResult<OwnerMonthlyExpense>> {
  const { error, supabase } = await assertOwnerForCaja()
  if (error || !supabase) return { success: false, error }

  const { data, error: updateError } = await supabase
    .from('owner_monthly_expenses')
    .update({ activo: false })
    .eq('id', id)
    .select('*')
    .single()

  if (updateError || !data) {
    console.error('[deactivateOwnerMonthlyExpense] error:', updateError)
    return { success: false, error: 'No se pudo desactivar el pago mensual.' }
  }

  return { success: true, data: data as OwnerMonthlyExpense }
}

