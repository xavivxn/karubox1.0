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
}

export default function CategoryList({ categories, selectedCategory, onSelectCategory }: Props) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Categorías</h2>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}

