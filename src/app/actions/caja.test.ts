// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { resolveSessionTenant, calcularTotalesTurno, getSesionAbierta } = vi.hoisted(() => ({
  resolveSessionTenant: vi.fn(),
  calcularTotalesTurno: vi.fn(),
  getSesionAbierta: vi.fn(),
}))
vi.mock('@/lib/auth/actionAuth', () => ({ resolveSessionTenant: () => resolveSessionTenant() }))
vi.mock('@/features/caja/services/cajaService', () => ({
  calcularTotalesTurno: (...a: unknown[]) => calcularTotalesTurno(...a),
  getSesionAbierta: (...a: unknown[]) => getSesionAbierta(...a),
  getSesionCerradaMasReciente: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { getTotalesTurnoAction, getSesionAbiertaAction } from './caja'

const supabaseFake = { tag: 'supabase' }

describe('acciones de caja: el local sale de la sesión (anti-IDOR)', () => {
  beforeEach(() => {
    resolveSessionTenant.mockResolvedValue({ supabase: supabaseFake, tenantId: 'LOCAL-PROPIO', rol: 'admin', usuarioId: 'u1' })
    calcularTotalesTurno.mockResolvedValue({ total_ventas: 1, total_costo_estimado: 0, cantidad_pedidos: 1 })
    getSesionAbierta.mockResolvedValue(null)
  })

  it('getTotalesTurnoAction ignora el tenantId que manda el cliente', async () => {
    const res = await getTotalesTurnoAction('LOCAL-AJENO', '2026-11-03T00:00:00Z')
    expect(res.success).toBe(true)
    expect(calcularTotalesTurno).toHaveBeenCalledWith(supabaseFake, 'LOCAL-PROPIO', '2026-11-03T00:00:00Z')
  })

  it('getTotalesTurnoAction sin sesión devuelve error y no consulta', async () => {
    resolveSessionTenant.mockResolvedValue({ supabase: supabaseFake, tenantId: null, rol: null, usuarioId: null })
    const res = await getTotalesTurnoAction('LOCAL-AJENO', '2026-11-03T00:00:00Z')
    expect(res.success).toBe(false)
    expect(calcularTotalesTurno).not.toHaveBeenCalled()
  })

  it('getSesionAbiertaAction usa el local de la sesión', async () => {
    await getSesionAbiertaAction('LOCAL-AJENO')
    expect(getSesionAbierta).toHaveBeenCalledWith(supabaseFake, 'LOCAL-PROPIO')
  })
})
