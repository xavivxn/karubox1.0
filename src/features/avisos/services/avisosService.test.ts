import { describe, it, expect } from 'vitest'
import { combinarVistos, contarNoVistos } from './avisosService'

const base = { cuerpo: 'x', tipo: 'actualizacion', publicado_at: '2026-11-03T18:00:00Z', expira_at: '2026-11-13T18:00:00Z' }

describe('avisos: tilde de visto', () => {
  it('marca como visto solo los avisos que el usuario ya abrió', () => {
    const avisos = combinarVistos(
      [
        { id: 'a', titulo: 'A', ...base },
        { id: 'b', titulo: 'B', ...base },
      ],
      ['b']
    )
    expect(avisos.map((a) => a.visto)).toEqual([false, true])
    expect(contarNoVistos(avisos)).toBe(1)
  })

  it('sin avisos no hay número en la campanita', () => {
    expect(contarNoVistos(combinarVistos([], []))).toBe(0)
  })
})
