/**
 * KDS Module - Status Legend Component
 * Leyenda de estados con colores
 */

import { ESTADOS_CONFIG } from '../constants/kds.constants'

export const StatusLegend = () => {
  const estados = Object.entries(ESTADOS_CONFIG)

  return (
    <div className="mt-6 flex gap-4 text-sm text-gray-400">
      {estados.map(([key, config]) => (
        <div key={key} className="flex items-center gap-2">
          <div className={`w-4 h-4 ${config.bgColor} rounded`}></div>
          <span>{config.label}</span>
        </div>
      ))}
    </div>
  )
}
