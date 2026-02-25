'use client'

interface Category {
  id: string
  nombre: string
  orden: number
}

interface Props {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  darkMode?: boolean
}

function ChipButton({
  active,
  darkMode,
  onClick,
  children
}: {
  active: boolean
  darkMode?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
          : darkMode
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

export default function CategoryList({ categories, selectedCategory, onSelectCategory, darkMode }: Props) {
  return (
    <div className={`rounded-2xl shadow-lg p-3 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
        <ChipButton active={selectedCategory === null} darkMode={darkMode} onClick={() => onSelectCategory(null)}>
          Todos
        </ChipButton>
        {categories.map((cat) => (
          <ChipButton
            key={cat.id}
            active={selectedCategory === cat.id}
            darkMode={darkMode}
            onClick={() => onSelectCategory(cat.id)}
          >
            {cat.nombre}
          </ChipButton>
        ))}
      </div>
    </div>
  )
}
