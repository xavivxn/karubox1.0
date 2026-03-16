/**
 * Clientes Module - Search Component
 * Barra de búsqueda de clientes
 */

import { Search } from 'lucide-react'

interface ClientesSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  onSearch: () => void
  onClear: () => void
}

export const ClientesSearch = ({
  searchTerm,
  onSearchChange,
  onSearch,
  onClear
}: ClientesSearchProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-3 sm:p-6 mb-4 sm:mb-6 min-w-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 min-w-0">
        <div className="flex-1 relative min-w-0 max-w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 shrink-0"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, CI o teléfono..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-9 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onSearch}
            className="flex-1 sm:flex-none min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-700 dark:bg-gray-600 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-500 active:scale-[0.98] transition-all font-semibold touch-manipulation"
          >
            Buscar
          </button>
          {searchTerm && (
            <button
              onClick={onClear}
              className="min-h-[44px] px-4 py-2.5 sm:py-3 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-[0.98] transition-all font-medium touch-manipulation"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
