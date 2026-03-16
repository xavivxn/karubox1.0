'use client'

import { Wallet } from 'lucide-react'

interface CajaCerradaBlockerProps {
  darkMode?: boolean
  /** Si es true, el mensaje indica que es vista admin/cocina y puede ir a Administración */
  esAdmin?: boolean
}

export function CajaCerradaBlocker({ darkMode = false, esAdmin = false }: CajaCerradaBlockerProps) {
  const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50'
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const text = darkMode ? 'text-gray-100' : 'text-gray-900'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border ${border} ${bg} p-8 text-center`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 mb-4">
        <Wallet className="h-8 w-8" />
      </div>
      <h2 className={`text-xl font-bold ${text} mb-2`}>Caja cerrada</h2>
      <p className={`text-sm ${muted} max-w-sm`}>
        {esAdmin
          ? 'Un administrador debe iniciar el día desde el panel de Administración para habilitar POS y Cocina.'
          : 'La caja está cerrada. Un administrador debe iniciar el día para que puedas operar.'}
      </p>
    </div>
  )
}
