/**
 * Logo Sistema 2026 para jsPDF (navegador): fetch desde `public/` + caché en memoria.
 */

import type { jsPDF } from 'jspdf'
import { LOGO_SISTEMA_2026_PATH } from '@/config/branding'

export interface PdfSistemaLogoPayload {
  /** Base64 PNG (sin prefijo data:) para doc.addImage */
  base64: string
  widthMm: number
  heightMm: number
}

let cached: PdfSistemaLogoPayload | null | undefined

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function measurePngFromBase64(base64: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve({ w: 1, h: 1 })
      return
    }
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 })
    img.onerror = () => resolve({ w: 1, h: 1 })
    img.src = `data:image/png;base64,${base64}`
  })
}

/** Altura máxima del logo en la franja del encabezado (el ancho escala con la proporción del PNG). */
const LOGO_MAX_HEIGHT_MM = 12

/**
 * Carga el PNG del logo (una vez por sesión de página) y calcula tamaño en mm manteniendo proporción.
 */
export async function loadPdfSistemaLogo(): Promise<PdfSistemaLogoPayload | null> {
  if (cached !== undefined) return cached
  if (typeof window === 'undefined') {
    cached = null
    return null
  }
  try {
    const res = await fetch(new URL(LOGO_SISTEMA_2026_PATH, window.location.origin).toString())
    if (!res.ok) {
      cached = null
      return null
    }
    const base64 = arrayBufferToBase64(await res.arrayBuffer())
    const { w, h } = await measurePngFromBase64(base64)
    const heightMm = LOGO_MAX_HEIGHT_MM
    const widthMm = (w / h) * heightMm
    cached = { base64, widthMm, heightMm }
    return cached
  } catch {
    cached = null
    return null
  }
}

const TITLE_GAP_MM = 3

/**
 * Dibuja el logo sobre la franja del header (después del rect de fondo). Devuelve desplazamiento X para el título.
 */
export function drawPdfSistemaLogo(
  doc: jsPDF,
  logo: PdfSistemaLogoPayload | null | undefined,
  opts: { headerHeightMm: number; marginLeftMm: number }
): number {
  if (!logo) return 0
  const { headerHeightMm, marginLeftMm } = opts
  const y = Math.max(0.5, (headerHeightMm - logo.heightMm) / 2)
  try {
    doc.addImage(logo.base64, 'PNG', marginLeftMm, y, logo.widthMm, logo.heightMm)
  } catch {
    return 0
  }
  return logo.widthMm + TITLE_GAP_MM
}
