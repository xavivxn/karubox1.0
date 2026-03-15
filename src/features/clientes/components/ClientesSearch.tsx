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
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, CI o teléfono..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSearch}
            className="flex-1 sm:flex-none px-6 py-3 bg-gray-700 dark:bg-gray-600 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors font-semibold"
          >
            Buscar
          </button>
          {searchTerm && (
            <button
              onClick={onClear}
              className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
