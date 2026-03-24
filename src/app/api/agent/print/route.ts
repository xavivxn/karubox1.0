import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prepareAgentPrint, postToAgentPrint } from '@/features/impresion/agentPrintServer'

/**
 * Reimpresión manual: reenvía al agente local POST /print.
 * El servidor Next debe poder alcanzar agent_ip (misma LAN si es IP privada).
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  const { data: usuario, error: uErr } = await supabase
    .from('usuarios')
    .select('id, tenant_id, activo')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (uErr || !usuario || !(usuario as { activo: boolean }).activo) {
    return NextResponse.json({ success: false, error: 'Usuario no válido' }, { status: 403 })
  }

  const tenantId = (usuario as { tenant_id: string }).tenant_id

  let bodyJson: unknown
  try {
    bodyJson = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 })
  }

  const pedidoId =
    bodyJson && typeof bodyJson === 'object' && 'pedidoId' in bodyJson
      ? String((bodyJson as { pedidoId: unknown }).pedidoId)
      : ''
  const tipoRaw =
    bodyJson && typeof bodyJson === 'object' && 'tipo' in bodyJson
      ? (bodyJson as { tipo: unknown }).tipo
      : ''

  if (!pedidoId) {
    return NextResponse.json({ success: false, error: 'pedidoId es requerido' }, { status: 400 })
  }

  const tipo = tipoRaw === 'factura' ? 'factura' : tipoRaw === 'cocina' ? 'cocina' : null
  if (!tipo) {
    return NextResponse.json(
      { success: false, error: 'tipo debe ser cocina o factura' },
      { status: 400 }
    )
  }

  const prepared = await prepareAgentPrint(supabase, {
    pedidoId,
    tenantId,
    tipo,
  })

  if (!prepared.ok) {
    return NextResponse.json(
      { success: false, error: prepared.error },
      { status: prepared.status }
    )
  }

  const agentResult = await postToAgentPrint(prepared.url, prepared.body)

  if (!agentResult.ok) {
    return NextResponse.json({ success: false, error: agentResult.error }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    message: agentResult.message ?? 'Impreso correctamente',
  })
}
