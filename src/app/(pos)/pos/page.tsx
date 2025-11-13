export default function POSPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🖥️ Punto de Venta (POS)
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categorías y Productos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Categorías</h2>
                <div className="flex gap-2 flex-wrap">
                  {['Lomitos', 'Hamburguesas', 'Bebidas', 'Extras', 'Promos'].map((cat) => (
                    <button
                      key={cat}
                      className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Productos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Lomito Completo', 'Lomito Especial', 'Hamburguesa Simple', 'Hamburguesa Doble'].map((prod) => (
                    <button
                      key={prod}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                    >
                      <div className="font-semibold">{prod}</div>
                      <div className="text-sm text-gray-600">$0.00</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pedido Actual */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Pedido Actual</h2>
              <div className="space-y-3 mb-4">
                <div className="text-center text-gray-500 py-8">
                  Selecciona productos para comenzar
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>$0.00</span>
                </div>

                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    🏠 Delivery
                  </button>
                  <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    🍽️ Comer en local
                  </button>
                  <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    📦 Para llevar
                  </button>
                </div>

                <button className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold">
                  Confirmar Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

