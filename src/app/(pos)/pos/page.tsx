'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Moon, Sun } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/contexts/TenantContext'
import CategoryList from '@/components/pos/CategoryList'
import ProductGrid from '@/components/pos/ProductGrid'
import Cart from '@/components/pos/Cart'
import ClientModal from '@/components/pos/ClientModal'

interface Categoria {
  id: string
  nombre: string
  orden: number
}

interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria_id?: string
  disponible: boolean
}

export default function POSPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { usuario, tenant, loading: tenantLoading, darkMode, toggleDarkMode, signOut } = useTenant()
  const { addItem, items, cliente, tipo, clearCart, getTotal } = useCartStore()

  // Cargar categorías y productos
  useEffect(() => {
    async function loadData() {
      if (tenantLoading || !tenant) return

      try {
        const { data: cats, error: errorCats } = await supabase
          .from('categorias')
          .select('*')
          .eq('activa', true)
          .order('orden')

        if (errorCats) throw errorCats
        setCategorias(cats || [])

        const { data: prods, error: errorProds } = await supabase
          .from('productos')
          .select('*')
          .eq('disponible', true)
          .order('nombre')

        if (errorProds) throw errorProds
        setProductos(prods || [])
      } catch (error) {
        console.error('Error cargando datos:', error)
        alert('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [tenant, tenantLoading])

  const filteredProducts = selectedCategory
    ? productos.filter((p) => p.categoria_id === selectedCategory)
    : productos

  const calcularPuntos = (total: number): number => {
    return Math.floor(total / 100)
  }

  const handleConfirmOrder = async () => {
    if (!tipo) {
      alert('Selecciona el tipo de pedido')
      return
    }

    if (items.length === 0) {
      alert('Agrega productos al pedido')
      return
    }

    if (!usuario || !tenant) {
      alert('Error: No hay usuario autenticado')
      return
    }

    setIsProcessing(true)

    try {
      const total = getTotal()
      const puntosGenerados = calcularPuntos(total)

      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: cliente?.id || null,
          usuario_id: usuario.id,
          tipo,
          total,
          puntos_generados: cliente ? puntosGenerados : 0,
          estado: 'pendiente'
        })
        .select()
        .single()

      if (errorPedido) throw errorPedido

      const itemsToInsert = items.map((item) => ({
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        producto_nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.subtotal
      }))

      const { error: errorItems } = await supabase
        .from('items_pedido')
        .insert(itemsToInsert)

      if (errorItems) throw errorItems

      if (cliente && puntosGenerados > 0) {
        const nuevosPuntos = cliente.puntos_totales + puntosGenerados

        const { error: errorCliente } = await supabase
          .from('clientes')
          .update({ puntos_totales: nuevosPuntos })
          .eq('id', cliente.id)

        if (errorCliente) throw errorCliente

        await supabase.from('transacciones_puntos').insert({
          cliente_id: cliente.id,
          pedido_id: pedido.id,
          tipo: 'ganado',
          puntos: puntosGenerados,
          saldo_anterior: cliente.puntos_totales,
          saldo_nuevo: nuevosPuntos,
          descripcion: `Puntos ganados por pedido #${pedido.numero_pedido}`
        })
      }

      alert(
        `✅ Pedido #${pedido.numero_pedido} confirmado!\n` +
        `Lomitería: ${tenant.nombre}\n` +
        `Cajero: ${usuario.nombre}\n` +
        `Total: $${total.toLocaleString()}\n` +
        (cliente ? `Puntos ganados: ${puntosGenerados} ⭐` : '')
      )

      clearCart()
    } catch (error) {
      console.error('Error confirmando pedido:', error)
      alert('Error al confirmar pedido')
    } finally {
      setIsProcessing(false)
    }
  }

  if (tenantLoading) {
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

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-orange-50 via-white to-orange-50'
    }`}>
      <div className="max-w-7xl mx-auto mb-6">
        <div className={`rounded-2xl shadow-2xl p-6 ${
          darkMode
            ? 'bg-gradient-to-r from-orange-600 to-orange-700'
            : 'bg-gradient-to-r from-orange-500 to-orange-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl drop-shadow-lg">🖥️</div>
              <div className="text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">
                  Punto de Venta
                </h1>
                {tenant && usuario && (
                  <p className="text-orange-100 text-sm md:text-base">
                    {tenant.nombre} • {usuario.nombre}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all hover:scale-105"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all hover:scale-105 font-medium"
              >
                ← Volver
              </Link>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all hover:scale-105 font-medium shadow-lg"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CategoryList
              categories={categorias}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              darkMode={darkMode}
            />

            <ProductGrid
              products={filteredProducts}
              onAddProduct={(product) => addItem(product)}
              loading={loading}
              darkMode={darkMode}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Cart
                onOpenClientModal={() => setIsClientModalOpen(true)}
                onConfirmOrder={handleConfirmOrder}
                isProcessing={isProcessing}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
      />
    </div>
  )
}
