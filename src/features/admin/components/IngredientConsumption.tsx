/**
 * Admin Module - Ingredient Consumption Section
 * Consumo estimado de ingredientes
 */

import { Droplet, Activity } from 'lucide-react'
import type { IngredientUsage } from '../types/admin.types'

interface IngredientConsumptionProps {
  ingredientsUsage: IngredientUsage[]
}

export const IngredientConsumption = ({ ingredientsUsage }: IngredientConsumptionProps) => {
  return (
    <div className="rounded-3xl border border-white/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Droplet className="w-5 h-5 text-orange-500" />
          Consumo estimado
        </h3>
        <Activity className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-3">
        {ingredientsUsage.slice(0, 5).map((ingredient) => (
          <div key={ingredient.slug}>
            <div className="flex items-center justify-between">
              <p className="font-semibold">{ingredient.label}</p>
              <p className="text-sm text-gray-500">
                {ingredient.total.toFixed(ingredient.unit === 'unidad' ? 0 : 1)} {ingredient.unit}
              </p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-300"
                style={{ width: '75%' }}
              />
            </div>
          </div>
        ))}
        {!ingredientsUsage.length && (
          <p className="text-sm text-gray-500">
            Todavía no hay suficientes pedidos para calcular el consumo de insumos.
          </p>
        )}
      </div>
    </div>
  )
}
