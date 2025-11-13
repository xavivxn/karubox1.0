'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'
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

  const { addItem, items, cliente, tipo, clearCart, getTotal } = useCartStore()

  // Cargar categorías y productos
  useEffect(() => {
    async function loadData() {
      try {
        // Cargar categorías
        const { data: cats, error: errorCats } = await supabase
          .from('categorias')
          .select('*')
          .eq('activa', true)
          .order('orden')

        if (errorCats) throw errorCats
        setCategorias(cats || [])

        // Cargar productos
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
  }, [])

  // Filtrar productos por categoría
  const filteredProducts = selectedCategory
    ? productos.filter((p) => p.categoria_id === selectedCategory)
    : productos

  // Calcular puntos (1 punto por cada $100)
  const calcularPuntos = (total: number): number => {
    return Math.floor(total / 100)
  }

  // Confirmar pedido
  const handleConfirmOrder = async () => {
    if (!tipo) {
      alert('Selecciona el tipo de pedido')
      return
    }

    if (items.length === 0) {
      alert('Agrega productos al pedido')
      return
    }

    setIsProcessing(true)

    try {
      const total = getTotal()
      const puntosGenerados = calcularPuntos(total)

      // Crear pedido
      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: cliente?.id || null,
          tipo,
          total,
          puntos_generados: cliente ? puntosGenerados : 0,
          estado: 'pendiente'
        })
        .select()
        .single()

      if (errorPedido) throw errorPedido

      // Crear items del pedido
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

      // Si hay cliente, sumar puntos
      if (cliente && puntosGenerados > 0) {
        const nuevosPuntos = cliente.puntos_totales + puntosGenerados

        // Actualizar puntos del cliente
        const { error: errorCliente } = await supabase
          .from('clientes')
          .update({ puntos_totales: nuevosPuntos })
          .eq('id', cliente.id)

        if (errorCliente) throw errorCliente

        // Registrar transacción de puntos
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

      // Mostrar confirmación
      alert(
        `✅ Pedido #${pedido.numero_pedido} confirmado!\n` +
        `Total: $${total.toLocaleString()}\n` +
        (cliente ? `Puntos ganados: ${puntosGenerados} ⭐` : '')
      )

      // Limpiar carrito
      clearCart()
    } catch (error) {
      console.error('Error confirmando pedido:', error)
      alert('Error al confirmar pedido')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🖥️ Punto de Venta (POS)
            </h1>
            <a
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ← Volver
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categorías y Productos */}
            <div className="lg:col-span-2 space-y-4">
              <CategoryList
                categories={categorias}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              <ProductGrid
                products={filteredProducts}
                onAddProduct={(product) => addItem(product)}
                loading={loading}
              />
            </div>

            {/* Carrito */}
            <div className="lg:col-span-1">
              <Cart
                onOpenClientModal={() => setIsClientModalOpen(true)}
                onConfirmOrder={handleConfirmOrder}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cliente */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
      />
    </div>
  )
}

