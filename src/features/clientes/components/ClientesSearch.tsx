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
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
          />
          <input
            type="text"
            placeholder="Buscar por nombre, CI o teléfono..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={onSearch}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          Buscar
        </button>
        {searchTerm && (
          <button
            onClick={onClear}
            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
