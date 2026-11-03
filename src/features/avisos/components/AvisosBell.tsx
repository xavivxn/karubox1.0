'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Check, MessageCircle, X } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { createClient } from '@/lib/supabase/client'
import { getWhatsAppSoporteHref } from '@/lib/whatsapp'
import {
  contarNoVistos,
  fetchAvisos,
  formatearFechaAviso,
  formatearVencimientoAviso,
  marcarAvisosVistos,
  type Aviso,
} from '../services/avisosService'

/** Cada cuánto se buscan avisos nuevos con el POS abierto. */
const REFRESCO_MS = 10 * 60 * 1000

/**
 * Campanita de avisos de KarúBox en la barra superior.
 * El número rojo aparece solo si el usuario tiene avisos sin abrir; al abrir el panel
 * quedan marcados como vistos (por usuario, no por equipo).
 */
export function AvisosBell() {
  const { tenant, usuario, darkMode } = useTenant()
  const supabase = useMemo(() => createClient(), [])
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const usuarioId = usuario?.id ?? null

  const cargar = useCallback(async () => {
    if (!usuarioId) return
    try {
      setAvisos(await fetchAvisos(supabase, usuarioId))
    } catch (e) {
      console.error('[AvisosBell] no se pudieron cargar los avisos', e)
    }
  }, [supabase, usuarioId])

  useEffect(() => {
    if (!usuarioId) return
    cargar()
    const id = window.setInterval(cargar, REFRESCO_MS)
    return () => window.clearInterval(id)
  }, [cargar, usuarioId])

  useEffect(() => {
    if (!abierto) return
    const alClickAfuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false)
    }
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alClickAfuera)
    document.addEventListener('keydown', alEscape)
    return () => {
      document.removeEventListener('mousedown', alClickAfuera)
      document.removeEventListener('keydown', alEscape)
    }
  }, [abierto])

  const noVistos = contarNoVistos(avisos)

  const alternar = () => {
    const abrir = !abierto
    setAbierto(abrir)
    if (!abrir || !usuarioId || noVistos === 0) return
    const ids = avisos.filter((a) => !a.visto).map((a) => a.id)
    setAvisos((prev) => prev.map((a) => ({ ...a, visto: true })))
    marcarAvisosVistos(supabase, usuarioId, ids).catch((e) =>
      console.error('[AvisosBell] no se pudo guardar el visto', e)
    )
  }

  if (!tenant?.id || !usuarioId) return null

  const whatsappHref = getWhatsAppSoporteHref(
    `Hola KarúBox, soy ${usuario?.nombre ?? ''} de ${tenant.nombre ?? 'mi local'}. Quiero avisar un problema: `
  )

  return (
    <div className="relative flex items-center" ref={contenedorRef}>
      <button
        type="button"
        onClick={alternar}
        aria-label={noVistos > 0 ? `Avisos de KarúBox: ${noVistos} sin leer` : 'Avisos de KarúBox'}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border md:h-11 md:w-11 ${
          darkMode
            ? 'border-orange-500/50 text-gray-200 hover:bg-gray-800/80'
            : 'border-orange-200 text-gray-700 hover:bg-orange-50/80'
        }`}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {noVistos > 0 && (
          <span
            className={`absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 bg-red-600 px-1 text-[11px] font-bold leading-none text-white ${
              darkMode ? 'border-gray-950' : 'border-white'
            }`}
            aria-hidden="true"
          >
            {noVistos > 9 ? '9+' : noVistos}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Novedades de KarúBox"
          className={`absolute right-0 top-full z-50 mt-2 w-[min(380px,calc(100vw-1rem))] overflow-hidden rounded-2xl border shadow-xl ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <span className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Novedades de KarúBox
            </span>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar avisos"
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[min(70vh,560px)] overflow-y-auto">
            {avisos.length === 0 ? (
              <p className={`px-4 py-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No hay novedades por ahora.
              </p>
            ) : (
              avisos.map((aviso) => (
                <article
                  key={aviso.id}
                  className={`flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                      Actualización · {formatearFechaAviso(aviso.publicado_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                      Visto
                    </span>
                  </div>
                  <h2 className={`text-lg font-bold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {aviso.titulo}
                  </h2>
                  <p
                    className={`whitespace-pre-line text-sm leading-relaxed ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {aviso.cuerpo}
                  </p>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-orange-600 dark:hover:bg-orange-500"
                  >
                    <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                    Avisar un problema por WhatsApp
                  </a>
                  <span className={`text-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Este aviso se borra solo el {formatearVencimientoAviso(aviso.expira_at)}.
                  </span>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
