interface POSLoadingProps {
  darkMode: boolean
}

export function POSLoading({ darkMode }: POSLoadingProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-orange-50 via-white to-orange-50'
    }`}>
      <div className="text-center">
        <div className="text-7xl mb-6 animate-bounce">🍔</div>
        <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Cargando...
        </p>
      </div>
    </div>
  )
}
