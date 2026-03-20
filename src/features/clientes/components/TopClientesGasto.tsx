/**
 * Panel de Clientes - Top 10 por ventas
 * Lista rápida de los mejores clientes por total vendido; clic abre el drawer.
 */

'use client'

import { Award } from 'lucide-react'
import type { ClienteConVisita, NivelCliente } from '../types/clientes.types'
import { getNivel } from '../utils/clientes.utils'
import { formatGuaranies } from '@/lib/utils/format'

interface TopClientesGastoProps {
  clientes: ClienteConVisita[]
  onClienteClick: (cliente: ClienteConVisita) => void
  loading?: boolean
}

const NIVEL_CLS: Record<NivelCliente, string> = {
  oro: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  plata: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  bronce: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
}

export const TopClientesGasto = ({ clientes, onClienteClick, loading }: TopClientesGastoProps) => {
  const safe = clientes ?? []

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800/80 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 dark:bg-gray-700/40 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 dark:bg-gray-700/40 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Award size={18} className="text-amber-500 dark:text-amber-400" />
          Top 10 por ventas
        </h3>
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {safe.slice(0, 10).map((cliente, index) => {
          const nivelInfo = getNivel(cliente.total_gastado ?? 0)
          return (
            <li key={cliente.id}>
              <button
                type="button"
                onClick={() => onClienteClick(cliente)}
                className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 w-5 text-xs font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                    {index + 1}
                  </span>
                  <span className="truncate font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</span>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      NIVEL_CLS[nivelInfo.nivel] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {nivelInfo.nombre}
                  </span>
                </div>
                <span className="flex-shrink-0 text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                  {formatGuaranies(cliente.total_gastado ?? 0)}
                </span>
              </button>
            </li>
          )
        })}
        {safe.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">Sin datos</li>
        )}
      </ul>
    </div>
  )
}

