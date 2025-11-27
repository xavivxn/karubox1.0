/**
 * KDS Module - Header Component
 * Encabezado con título y reloj en tiempo real
 */

'use client'

import { useState, useEffect } from 'react'
import { formatearHoraActual } from '../utils/kds.utils'

export const KDSHeader = () => {
  const [horaActual, setHoraActual] = useState(formatearHoraActual())

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(formatearHoraActual())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold text-white">
        🍳 Pantalla de Cocina (KDS)
      </h1>
      <div className="text-2xl font-mono text-white">
        {horaActual}
      </div>
    </div>
  )
}
