/**
 * Llama al Route Handler que reenvía POST /print al agente local.
 */
export async function requestAgentPrint(
  pedidoId: string,
  tipo: 'cocina' | 'factura'
): Promise<string> {
  const res = await fetch('/api/agent/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ pedidoId, tipo }),
  })
  const data = (await res.json()) as { success?: boolean; error?: string; message?: string }
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Error ${res.status}`)
  }
  return data.message ?? 'Listo'
}
