import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-gray-900">
          🍔 POS Lomitería
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Sistema integral de punto de venta con gestión de pedidos en tiempo real
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link
            href="/pos"
            className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🖥️</div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              POS
            </h2>
            <p className="text-gray-600">
              Punto de venta para toma de pedidos
            </p>
          </Link>

          <Link
            href="/kds"
            className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🍳</div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              Cocina (KDS)
            </h2>
            <p className="text-gray-600">
              Pantalla de pedidos para cocina
            </p>
          </Link>

          <Link
            href="/admin"
            className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">
              Admin
            </h2>
            <p className="text-gray-600">
              Panel de administración y reportes
            </p>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          Next.js 14 + TypeScript + Tailwind CSS + Supabase
        </div>
      </div>
    </main>
  );
}

