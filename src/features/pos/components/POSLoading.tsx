interface POSLoadingProps {
  darkMode: boolean
}

export function POSLoading({ darkMode }: POSLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl mb-6 animate-bounce">🍔</div>
        <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Cargando...
        </p>
      </div>
    </div>
  )
}
