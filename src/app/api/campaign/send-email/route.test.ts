// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { resolveSessionTenant, send } = vi.hoisted(() => ({
  resolveSessionTenant: vi.fn(),
  send: vi.fn(),
}))
vi.mock('@/lib/auth/actionAuth', () => ({ resolveSessionTenant: () => resolveSessionTenant() }))
// Clase real (no vi.fn) para que `restoreMocks` de vitest.config no la resetee entre tests.
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: (...a: unknown[]) => send(...a) }
  },
}))

import { POST } from './route'

function req(body: unknown) {
  return new Request('http://localhost/api/campaign/send-email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const body = {
  tenantNombre: 'Local Falso',
  destinatarios: [{ email: 'cliente@test.com', nombre: 'Cliente' }],
  subject: 'Hola',
  mensajeConVariables: 'Hola {{nombre_cliente}} de {{nombre_lomiteria}}',
}

function tenantSupabase(nombre: string) {
  return {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { nombre } }) }) }) }),
  }
}

describe('POST /api/campaign/send-email', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-key'
    delete process.env.RESEND_FROM
    send.mockResolvedValue({ error: null })
  })

  it('sin sesión responde 401 y no envía', async () => {
    resolveSessionTenant.mockResolvedValue({ supabase: tenantSupabase('x'), tenantId: null, rol: null, usuarioId: null })
    const res = await POST(req(body))
    expect(res.status).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })

  it('un cajero recibe 403 y no envía', async () => {
    resolveSessionTenant.mockResolvedValue({ supabase: tenantSupabase('Mi Local'), tenantId: 't1', rol: 'cajero', usuarioId: 'u1' })
    const res = await POST(req(body))
    expect(res.status).toBe(403)
    expect(send).not.toHaveBeenCalled()
  })

  it('un admin envía a nombre de SU local, no del que viene en el body', async () => {
    resolveSessionTenant.mockResolvedValue({ supabase: tenantSupabase('Mi Local'), tenantId: 't1', rol: 'admin', usuarioId: 'u1' })
    const res = await POST(req(body))
    expect(res.status).toBe(200)
    expect(send).toHaveBeenCalledTimes(1)
    const arg = send.mock.calls[0][0] as { from: string; html: string }
    expect(arg.from).toBe('Mi Local <onboarding@resend.dev>')
    expect(arg.html).not.toContain('Local Falso')
  })
})
