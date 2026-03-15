/**
 * Campañas de Fidelización - Service
 * Gestiona: clientes con visita, config de campañas, log de envíos, regalo de puntos
 */

import { createClient } from '@/lib/supabase/client'
import type { ClienteConVisita, CampanaConfig, TipoCampana } from '../types/clientes.types'
import { DEFAULT_TEMPLATES } from '../types/clientes.types'

// ============================================
// Clientes con última visita
// ============================================

export async function getClientesConVisita(tenantId: string): Promise<ClienteConVisita[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('vista_clientes_con_ultima_visita')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('puntos_totales', { ascending: false })

  if (error) throw error

  const now = Date.now()

  return (data ?? []).map((c: any) => ({
    ...c,
    total_pedidos: Number(c.total_pedidos) || 0,
    total_gastado: Number(c.total_gastado) || 0,
    dias_sin_visita: c.ultima_visita
      ? Math.floor((now - new Date(c.ultima_visita).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  })) as ClienteConVisita[]
}

// ============================================
// Configuración de campañas
// ============================================

const DEFAULT_CONFIG = (tenantId: string): CampanaConfig => ({
  tenant_id: tenantId,
  auto_15_dias: false,
  auto_30_dias: false,
  template_wa_15dias: DEFAULT_TEMPLATES.wa_15dias,
  template_wa_30dias: DEFAULT_TEMPLATES.wa_30dias,
  template_wa_personalizado: DEFAULT_TEMPLATES.wa_personalizado,
  puntos_regalo_15dias: 0,
  puntos_regalo_30dias: 0,
  puntos_regalo_personalizado: 0,
})

export async function getCampanaConfig(tenantId: string): Promise<CampanaConfig> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('campanas_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error) throw error

  return data ? (data as CampanaConfig) : DEFAULT_CONFIG(tenantId)
}

export async function upsertCampanaConfig(config: CampanaConfig): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('campanas_config')
    .upsert(
      { ...config, updated_at: new Date().toISOString() },
      { onConflict: 'tenant_id' }
    )

  if (error) throw error
}

// ============================================
// Registrar campaña (log + gift points)
// ============================================

export async function registrarCampana(
  tenantId: string,
  tipo: TipoCampana,
  clienteIds: string[],
  puntosRegalo: number,
  mensaje: string
): Promise<void> {
  const supabase = createClient()

  // 1. Acreditar puntos regalo via RPC (si aplica)
  if (puntosRegalo > 0 && clienteIds.length > 0) {
    const { error: rpcError } = await supabase.rpc('regalar_puntos_campana', {
      p_tenant_id: tenantId,
      p_cliente_ids: clienteIds,
      p_puntos: puntosRegalo,
      p_descripcion: `Campaña de fidelización: ${TIPO_LABELS[tipo]}`,
    })
    if (rpcError) throw rpcError
  }

  // 2. Registrar log de campaña
  const { error: logError } = await supabase.from('campanas_envios').insert({
    tenant_id: tenantId,
    tipo,
    total_destinatarios: clienteIds.length,
    puntos_regalados_por_cliente: puntosRegalo,
    puntos_regalados_total: puntosRegalo * clienteIds.length,
    mensaje,
  })

  if (logError) throw logError
}

// ============================================
// Regalar puntos a un cliente individual
// ============================================

export async function regalarPuntosIndividual(
  tenantId: string,
  clienteId: string,
  puntos: number,
  descripcion: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.rpc('regalar_puntos_campana', {
    p_tenant_id: tenantId,
    p_cliente_ids: [clienteId],
    p_puntos: puntos,
    p_descripcion: descripcion,
  })

  if (error) throw error
}

// ============================================
// Helpers
// ============================================

export const TIPO_LABELS: Record<TipoCampana, string> = {
  inactivos_15: 'Inactivos +15 días',
  inactivos_30: 'Inactivos +30 días',
  personalizado: 'Mensaje personalizado',
}
