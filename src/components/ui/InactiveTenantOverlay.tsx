'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, MessageCircle, Mail, LogOut } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'

const WHATSAPP_NUMBER = '595971172266'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
const CONTACT_EMAIL = 'ardentium.sotware@corporation.com'
const AUTO_SHOW_DELAY_MS = 3000

export function InactiveTenantOverlay() {
  const { isTenantActive, signOut, usuario, loading } = useTenant()
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const shouldBlock = !loading && usuario && !isTenantActive

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-mostrar modal después de unos segundos
  useEffect(() => {
    if (!shouldBlock) return

    const timer = setTimeout(() => {
      setShowModal(true)
    }, AUTO_SHOW_DELAY_MS)

    return () => clearTimeout(timer)
  }, [shouldBlock])

  const handleOverlayClick = useCallback(() => {
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])

  if (!shouldBlock || !mounted) return null

  return (
    <>
      {/* Overlay invisible que intercepta clicks */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                    Cuenta suspendida
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Acceso limitado
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-5 space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3">
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Su cuenta se encuentra actualmente suspendida. Si desea seguir utilizando el sistema, contáctese con nosotros.
                </p>
              </div>

              {/* WhatsApp */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition"
              >
                <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    WhatsApp
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    +{WHATSAPP_NUMBER}
                  </p>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
              >
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Correo electrónico
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {CONTACT_EMAIL}
                  </p>
                </div>
              </a>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
