import type { SupabaseClient } from '@supabase/supabase-js'

/** Aviso de KarúBox que se muestra en la campanita del POS. */
export interface Aviso {
  id: string
  titulo: string
  cuerpo: string
  tipo: string
  publicado_at: string
  expira_at: string
  visto: boolean
}

type AvisoRow = Omit<Aviso, 'visto'>

/** Marca cada aviso con `visto` según los ids que el usuario ya abrió. */
export function combinarVistos(avisos: AvisoRow[], vistosIds: Iterable<string>): Aviso[] {
  const vistos = new Set(vistosIds)
  return avisos.map((a) => ({ ...a, visto: vistos.has(a.id) }))
}

export function contarNoVistos(avisos: Aviso[]): number {
  return avisos.reduce((n, a) => (a.visto ? n : n + 1), 0)
}

/**
 * Trae los avisos vigentes del usuario. RLS ya filtra: solo los globales o de su local,
 * publicados y sin vencer.
 */
export async function fetchAvisos(supabase: SupabaseClient, usuarioId: string): Promise<Aviso[]> {
  const [avisosRes, vistosRes] = await Promise.all([
    supabase
      .from('avisos')
      .select('id, titulo, cuerpo, tipo, publicado_at, expira_at')
      .order('publicado_at', { ascending: false })
      .limit(20),
    supabase.from('avisos_vistos').select('aviso_id').eq('usuario_id', usuarioId),
  ])
  if (avisosRes.error) throw avisosRes.error
  if (vistosRes.error) throw vistosRes.error
  return combinarVistos(
    (avisosRes.data ?? []) as AvisoRow[],
    (vistosRes.data ?? []).map((v) => v.aviso_id as string)
  )
}

/** Guarda el tilde de visto. Repetirlo no falla (ignora duplicados). */
export async function marcarAvisosVistos(
  supabase: SupabaseClient,
  usuarioId: string,
  avisoIds: string[]
): Promise<void> {
  if (avisoIds.length === 0) return
  const { error } = await supabase
    .from('avisos_vistos')
    .upsert(
      avisoIds.map((aviso_id) => ({ aviso_id, usuario_id: usuarioId })),
      { onConflict: 'aviso_id,usuario_id', ignoreDuplicates: true }
    )
  if (error) throw error
}

const fechaCorta = new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short', year: 'numeric' })
const fechaSinAnio = new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' })

export function formatearFechaAviso(iso: string): string {
  return fechaCorta.format(new Date(iso)).replace(/\./g, '')
}

export function formatearVencimientoAviso(iso: string): string {
  return fechaSinAnio.format(new Date(iso)).replace(/\./g, '')
}
