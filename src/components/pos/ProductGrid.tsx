'use client'

interface Product {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  disponible: boolean
}

interface Props {
  products: Product[]
  onAddProduct: (product: Product) => void
  loading?: boolean
}

export default function ProductGrid({ products, onAddProduct, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Productos</h2>
        <div className="text-center py-8 text-gray-500">
          Cargando productos...
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Productos</h2>
        <div className="text-center py-8 text-gray-500">
          No hay productos en esta categoría
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">
        Productos ({products.length})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddProduct(product)}
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all hover:shadow-md text-left group"
          >
            <div className="font-semibold text-gray-900 mb-1 group-hover:text-green-700">
              {product.nombre}
            </div>
            {product.descripcion && (
              <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                {product.descripcion}
              </div>
            )}
            <div className="text-lg font-bold text-green-600">
              ${product.precio.toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

