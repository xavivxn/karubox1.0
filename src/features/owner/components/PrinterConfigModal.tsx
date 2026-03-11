'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, Info } from 'lucide-react'
import { PrinterConfigForm } from './PrinterConfigForm'
import { getPrinterConfigOwner } from '@/app/actions/owner'
import type { PrinterConfig } from '@/types/supabase'

interface Tenant {
  id: string
  nombre: string
  slug: string
}

interface PrinterConfigModalProps {
  open: boolean
  onClose: () => void
  tenant: Tenant
}

export function PrinterConfigModal({ open, onClose, tenant }: PrinterConfigModalProps) {
  const [mounted, setMounted] = useState(false)
  const [config, setConfig] = useState<PrinterConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setConfig(null)
      setConfigError(null)
      setLoading(true)
      getPrinterConfigOwner(tenant.id).then((result) => {
        setConfig(result.config)
        setConfigError(result.error ?? null)
        setLoading(false)
      })
    }
  }, [open, tenant.id])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-orange-500 dark:text-orange-400 font-medium">
                Configuración de impresora
              </p>
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{tenant.nombre}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {configError && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Error al cargar configuración</p>
                  <p className="text-xs text-red-500 dark:text-red-400 font-mono mt-1">{configError}</p>
                </div>
              )}

              {/* Card informativo */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Sobre el agente de impresión
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    El agente es una aplicación de escritorio que escucha automáticamente los pedidos confirmados e imprime el ticket en la impresora configurada.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 ml-1">
                    <li>El <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded text-xs font-mono">printer_id</code> debe coincidir con el configurado en el agente</li>
                    <li>El agente debe estar ejecutándose en la máquina con la impresora</li>
                    <li>La impresora debe estar conectada y encendida</li>
                  </ul>
                </div>
              </div>

              {/* Formulario */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {config ? 'Editar configuración' : 'Configurar impresora'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {config
                        ? 'Actualiza los datos de la impresora de este negocio.'
                        : 'Configura la impresora térmica para este negocio.'
                      }
                    </p>
                  </div>
                </div>

                <PrinterConfigForm
                  tenantId={tenant.id}
                  tenantSlug={tenant.slug}
                  initialConfig={config}
                  onSaved={onClose}
                  onCancel={onClose}
                />
              </div>

              {config && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Esta configuración fue creada automáticamente al crear el negocio. Puedes editarla según tus necesidades.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
