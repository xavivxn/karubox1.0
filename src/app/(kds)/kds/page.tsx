export default function KDSPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">
              🍳 Pantalla de Cocina (KDS)
            </h1>
            <div className="text-2xl font-mono text-white">
              {new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pedido de ejemplo */}
            <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-2xl font-bold">#1001</div>
                  <div className="text-sm text-gray-700">🏠 DELIVERY</div>
                </div>
                <div className="text-sm text-gray-700">⏰ 14:20</div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="bg-white rounded p-2">
                  <div className="font-semibold">Lomito Completo x2</div>
                  <div className="text-sm text-gray-600">+ Cebolla, + Queso</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="font-semibold">Coca Cola 500ml x2</div>
                </div>
              </div>

              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded transition-colors">
                ✓ Marcar como Listo
              </button>
            </div>

            {/* Espacio para más pedidos */}
            <div className="bg-gray-700 border-4 border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center text-gray-500">
              Esperando pedidos...
            </div>
          </div>

          <div className="mt-6 flex gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Urgente (&gt;15min)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Preparando</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Listo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

