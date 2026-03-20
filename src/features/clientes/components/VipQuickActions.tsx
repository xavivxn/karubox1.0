/**
 * Panel de Clientes - Acciones VIP rápidas
 * Tarjeta con 2 accesos directos a campañas VIP: Oro y Top 10 por ventas.
 */

'use client'

import { Crown, Trophy } from 'lucide-react'

interface VipQuickActionsProps {
  countOro: number
  countTop10: number
  onCampanaOro: () => void
  onCampanaTop10: () => void
}

export const VipQuickActions = ({
  countOro,
  countTop10,
  onCampanaOro,
  onCampanaTop10,
}: VipQuickActionsProps) => {
  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40">
              <Crown size={18} className="text-amber-600 dark:text-amber-400" />
            </span>
            Acciones VIP
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
            Envíos y regalos para tus mejores clientes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCampanaOro}
          className="group w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 flex-shrink-0">
              👑
            </span>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-200 truncate">Solo Oro</span>
          </span>
          <span className="flex-shrink-0 text-xs font-bold text-gray-700 dark:text-gray-200 tabular-nums">
            {countOro}
          </span>
        </button>

        <button
          type="button"
          onClick={onCampanaTop10}
          className="group w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 flex-shrink-0">
              🏆
            </span>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 truncate">Top 10</span>
          </span>
          <span className="flex-shrink-0 text-xs font-bold text-gray-700 dark:text-gray-200 tabular-nums">
            {countTop10}
          </span>
        </button>
      </div>
    </div>
  )
}

