'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Info } from 'lucide-react'
import { PrinterConfigForm } from '../components/PrinterConfigForm'
import type { PrinterConfig } from '@/types/supabase'

interface PrinterConfigViewProps {
  tenant: {
    id: string
    nombre: string
    slug: string
  }
  initialConfig: PrinterConfig | null
  configError: string | null
}

export function PrinterConfigView({ tenant, initialConfig, configError }: PrinterConfigViewProps) {
  const router = useRouter()

  const handleSaved = () => {
    router.refresh()
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest text-orange-500 dark:text-orange-400 font-medium">
              Configuración de impresora
            </p>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">{tenant.nombre}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">/{tenant.slug}</p>
          </div>
        </div>
      </div>

      {/* Banner de error al cargar config */}
      {configError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Error al cargar configuración</p>
          <p className="text-xs text-red-500 dark:text-red-400 font-mono mt-1">{configError}</p>
        </div>
      )}

      {/* Card informativo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-5 flex gap-4">
        <div className="shrink-0">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-blue-900 dark:text-blue-100">
            Sobre el agente de impresión
          </p>
          <p className="text-blue-700 dark:text-blue-300">
            El agente de impresión es una aplicación de escritorio que se conecta a Supabase y escucha automáticamente los pedidos confirmados. Cuando un pedido se marca como facturado, el agente lo detecta e imprime el ticket en la impresora configurada.
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            Para que funcione correctamente:
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 ml-2">
            <li>El <code className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded text-xs font-mono">printer_id</code> debe coincidir con el configurado en el agente</li>
            <li>El agente debe estar ejecutándose en la máquina con la impresora</li>
            <li>La impresora debe estar conectada y encendida</li>
          </ul>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-3">
            Consulta la documentación en <code className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded font-mono">/docs</code> para más información sobre cómo configurar el agente.
          </p>
        </div>
      </div>

      {/* Card principal con formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
            <Printer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {initialConfig ? 'Editar configuración' : 'Configurar impresora'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {initialConfig
                ? 'Actualiza los datos de la impresora de este negocio.'
                : 'Configura la impresora térmica para este negocio.'
              }
            </p>
          </div>
        </div>

        <PrinterConfigForm
          tenantId={tenant.id}
          tenantSlug={tenant.slug}
          initialConfig={initialConfig}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </div>

      {/* Footer informativo */}
      <div className="text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {initialConfig
            ? 'Esta configuración fue creada automáticamente al crear el negocio. Puedes editarla según tus necesidades.'
            : 'Una vez guardada la configuración, el agente podrá imprimir automáticamente.'
          }
        </p>
      </div>
    </div>
  )
}
