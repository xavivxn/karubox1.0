import Link from 'next/link'
import { formatGuaranies } from '@/lib/utils/format'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            📊 Panel de Administración
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Tarjetas de estadísticas */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="text-blue-600 text-sm font-semibold mb-2">
                PEDIDOS HOY
              </div>
              <div className="text-4xl font-bold text-blue-900">0</div>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="text-green-600 text-sm font-semibold mb-2">
                VENTAS HOY
              </div>
              <div className="text-4xl font-bold text-green-900">{formatGuaranies(0)}</div>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
              <div className="text-purple-600 text-sm font-semibold mb-2">
                CLIENTES ACTIVOS
              </div>
              <div className="text-4xl font-bold text-purple-900">0</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Clientes */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🏆 Top Clientes</h2>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Sin clientes registrados</div>
                    <div className="text-sm text-gray-600">Comienza a registrar clientes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos más vendidos */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📈 Productos Populares</h2>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4">
                  <div className="font-semibold">Sin datos aún</div>
                  <div className="text-sm text-gray-600">Los productos más vendidos aparecerán aquí</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Gestionar Productos
            </button>
            <Link 
              href="/admin/clientes"
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Gestionar Clientes
            </Link>
            <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Configurar Promociones
            </button>
            <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Ver Reportes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

