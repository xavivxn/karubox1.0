/**
 * KDS Module - Empty State Component
 * Tarjeta de estado vacío cuando no hay pedidos
 */

export const EmptyOrderCard = () => {
  return (
    <div className="bg-gray-700 border-4 border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center text-gray-500">
      Esperando pedidos...
    </div>
  )
}
