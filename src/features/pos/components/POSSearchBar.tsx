'use client'

import { Search, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  darkMode?: boolean
  disabled?: boolean
  /** Cuando true, la barra está "pegada" (sticky) y se muestra compacta para dar más visibilidad al operador */
  compact?: boolean
  /** Cuando se provee, muestra botón "Cerrar búsqueda" (modo overlay) */
  onClose?: () => void
}

export default function POSSearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar producto...',
  darkMode,
  disabled,
  compact = false,
  onClose
}: Props) {
  return (
    <div className={compact ? 'py-2' : 'pb-3'}>
      <div
        className={`flex flex-1 items-center gap-2 border transition-all duration-300 ease-out
          ${compact ? 'rounded-full pl-3 pr-2.5 py-2' : 'rounded-2xl pl-3 pr-2 py-2.5'}
          ${compact ? 'animate-pos-search-stuck' : ''}
          ${darkMode
            ? compact
              ? 'border-orange-500/30 bg-gray-800/90 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(249,115,22,0.2),0_0_0_1px_rgba(249,115,22,0.06),inset_0_1px_0_0_rgba(255,255,255,0.03)] focus-within:border-orange-500/60 focus-within:shadow-[0_6px_24px_-2px_rgba(249,115,22,0.25),0_0_0_1px_rgba(249,115,22,0.12)]'
              : 'border-gray-600 bg-gray-800/95 shadow-lg shadow-black/20 backdrop-blur-sm focus-within:border-orange-500/50'
            : compact
              ? 'border-orange-300/80 bg-white/90 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(249,115,22,0.18),0_0_0_1px_rgba(249,115,22,0.06),inset_0_1px_0_0_rgba(255,255,255,0.6)] focus-within:border-orange-400 focus-within:shadow-[0_6px_24px_-2px_rgba(249,115,22,0.22),0_0_0_1px_rgba(249,115,22,0.1)]'
              : 'border-gray-200 bg-white/95 shadow-md shadow-gray-200/80 backdrop-blur-sm focus-within:border-orange-400 focus-within:shadow-orange-100'
          }`}
      >
        <Search
          className={`shrink-0 ${compact ? 'h-4 w-4' : 'h-5 w-5'} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          aria-hidden
        />
        <input
          type="search"
          data-pos-search-input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Buscar producto por nombre o categoría"
          className={`flex-1 min-w-0 bg-transparent outline-none placeholder:italic ${
            compact ? 'text-sm' : 'text-base'
          } ${darkMode
            ? 'text-white placeholder:text-gray-500'
            : 'text-gray-900 placeholder:text-gray-400'
          }`}
        />
        {value.trim().length > 0 && !onClose && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpiar búsqueda"
            className={`shrink-0 rounded-lg transition-colors ${compact ? 'p-0.5' : 'p-1'} ${
              darkMode
                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <X className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar búsqueda"
            className={`shrink-0 rounded-lg p-1.5 transition-colors ${
              darkMode
                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
