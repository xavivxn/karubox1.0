'use client'

import { AlertTriangle } from 'lucide-react'

export function OwnerCashMovementsStub() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 text-xs text-gray-600 dark:text-gray-300">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500" />
        <div>
          <p className="font-semibold mb-1">Próximo paso: registro manual de caja</p>
          <p>
            Acá vamos a listar todas las inversiones, gastos, pagos a proveedores y retiros de socios
            que carguen a mano, más un panel de deudas pendientes. Por ahora solo se muestra el
            resumen mensual/anual arriba.
          </p>
        </div>
      </div>
    </div>
  )
}

