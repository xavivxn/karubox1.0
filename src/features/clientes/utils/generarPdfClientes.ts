/**
 * Genera un PDF con el reporte de clientes.
 * Diseño tipo dashboard: filas con bordes sutiles, nombre destacado, contacto/identificación
 * agrupados, badges de nivel y moneda alineada a la derecha. Optimizado para lectura y exportación.
 */

import { jsPDF } from 'jspdf'
import type { ClienteLocal } from '../types/clientes.types'
import type { ClienteConVisita } from '../types/clientes.types'
import { formatearFecha, getNivel } from './clientes.utils'
import { formatGuaranies } from '@/lib/utils/format'
import { PDF_FOOTER_TEXT } from './pdf.constants'
import {
  drawPdfSistemaLogo,
  loadPdfSistemaLogo,
  type PdfSistemaLogoPayload,
} from './pdfLogo'

const MARGIN = 16
const HEADER_HEIGHT = 32
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
const ROW_HEIGHT = 24
/** Espacio reservado a la derecha para el monto (evita solapamiento con texto secundario) */
const GASTADO_ZONE_MM = 44

// Paleta profesional: acento naranja, gris pizarra, fondos suaves
const ORANGE_HEADER = [234, 88, 12] as [number, number, number]
const ORANGE_LIGHT = [254, 243, 199] as [number, number, number]
const GRAY_BORDER = [226, 232, 240] as [number, number, number]
const GRAY_TEXT = [71, 85, 105] as [number, number, number]
const GRAY_MUTED = [148, 163, 184] as [number, number, number]

// Badges de fidelidad (fondo y texto)
const BADGE_ORO = { fill: [254, 243, 199] as [number, number, number], text: [180, 83, 9] as [number, number, number] }
const BADGE_PLATA = { fill: [248, 250, 252] as [number, number, number], text: [71, 85, 105] as [number, number, number] }
const BADGE_BRONCE = { fill: [255, 237, 213] as [number, number, number], text: [194, 65, 12] as [number, number, number] }

export interface OpcionesPdfClientes {
  tenantNombre?: string
}

function formatFechaReporte() {
  return new Date().toLocaleString('es-PY', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function addHeader(
  doc: jsPDF,
  tenantNombre?: string,
  fechaReporte?: string,
  logo?: PdfSistemaLogoPayload | null
) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...ORANGE_HEADER)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')

  const titleX = MARGIN + drawPdfSistemaLogo(doc, logo ?? null, {
    headerHeightMm: HEADER_HEIGHT,
    marginLeftMm: MARGIN,
  })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE CLIENTES', titleX, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 248, 240)
  if (fechaReporte) doc.text(`Generado: ${fechaReporte}`, titleX, 22)

  if (tenantNombre) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(tenantNombre, pageWidth - MARGIN, 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Lomitería', pageWidth - MARGIN, 22, { align: 'right' })
  }

  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.4)
  doc.line(0, HEADER_HEIGHT, pageWidth, HEADER_HEIGHT)
}

function addFooter(doc: jsPDF, pageNumber?: number, totalPages?: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, pageHeight - 20, pageWidth - MARGIN, pageHeight - 20)

  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MUTED)
  doc.text(PDF_FOOTER_TEXT, pageWidth / 2, pageHeight - 13, { align: 'center' })
  doc.text(
    `Generado: ${formatFechaReporte()}`,
    totalPages && totalPages > 1 ? MARGIN : pageWidth / 2,
    pageHeight - 8,
    totalPages && totalPages > 1 ? { align: 'left' } : { align: 'center' }
  )
  if (totalPages != null && totalPages > 1 && pageNumber != null) {
    doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth - MARGIN,
      pageHeight - 8,
      { align: 'right' }
    )
  }
}

/** Sin saltos de línea ni caracteres problemáticos para PDF */
function limpia(s: string | null | undefined): string {
  return String(s ?? '').replace(/\r?\n/g, ' ').trim() || '-'
}

/** Trunca texto si excede ancho máximo en mm (aproximado con fontSize 8) */
function truncar(doc: jsPDF, texto: string, maxMm: number, fontSize: number): string {
  doc.setFontSize(fontSize)
  const approxPerMm = 0.35
  const maxChars = Math.floor(maxMm * approxPerMm)
  if (texto.length <= maxChars) return texto
  return texto.slice(0, maxChars - 2) + '…'
}

/** Dibuja un badge de nivel (Oro/Plata/Bronce) */
function drawBadgeNivel(
  doc: jsPDF,
  nombreNivel: string,
  x: number,
  y: number
) {
  const nivel = nombreNivel.toLowerCase()
  const cfg =
    nivel === 'oro'
      ? BADGE_ORO
      : nivel === 'plata'
        ? BADGE_PLATA
        : BADGE_BRONCE

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  const w = Math.min(doc.getTextWidth(nombreNivel) + 6, 22)
  const h = 5

  doc.setFillColor(...cfg.fill)
  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.1)
  doc.roundedRect(x, y - 3.5, w, h, 1.2, 1.2, 'FD')
  doc.setTextColor(...cfg.text)
  doc.text(nombreNivel, x + 3, y + 0.5)
  doc.setTextColor(...GRAY_TEXT)
  doc.setFont('helvetica', 'normal')
}

/**
 * Genera el PDF del reporte de clientes y dispara la descarga.
 * Acepta ClienteLocal o ClienteConVisita; si tiene total_gastado/ultima_visita/total_pedidos los muestra.
 */
export async function generarPdfClientes(
  clientes: (ClienteLocal | ClienteConVisita)[],
  opciones: OpcionesPdfClientes = {}
): Promise<void> {
  const { tenantNombre } = opciones
  const logo = await loadPdfSistemaLogo()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const fechaReporteStr = formatFechaReporte()
  addHeader(doc, tenantNombre, fechaReporteStr, logo)

  let y = HEADER_HEIGHT + 12

  // Título de sección
  doc.setFontSize(12)
  doc.setTextColor(...GRAY_TEXT)
  doc.setFont('helvetica', 'bold')
  doc.text('Listado de clientes', MARGIN, y)
  y += 10

  const pageHeight = doc.internal.pageSize.getHeight()
  const yMax = pageHeight - 24

  for (let i = 0; i < clientes.length; i++) {
    if (y + ROW_HEIGHT > yMax) {
      doc.addPage()
      addHeader(doc, tenantNombre, fechaReporteStr, logo)
      y = HEADER_HEIGHT + 10
    }

    const c = clientes[i]
    const conVisita = c && 'total_gastado' in c ? (c as ClienteConVisita) : null
    const totalGastado = conVisita?.total_gastado ?? 0
    const nivelInfo = getNivel(totalGastado)
    const totalPedidos = conVisita?.total_pedidos ?? null

    // ── Nombre (destacado)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRAY_TEXT)
    const nombre = truncar(doc, limpia(c.nombre), CONTENT_WIDTH - 50, 11)
    doc.text(nombre, MARGIN, y + 5)

    // ── Contacto (tel · email) a la izquierda
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_MUTED)
    const tel = limpia(c.telefono)
    const email = limpia(c.email)
    const contacto = [tel !== '-' ? tel : '', email !== '-' ? email : ''].filter(Boolean).join(' · ') || '-'
    doc.text(truncar(doc, contacto, 75, 8), MARGIN, y + 11)

    // ── Identificación (CI / RUC) a la derecha de la segunda línea
    const ci = limpia(c.ci)
    const ruc = limpia(c.ruc ?? '')
    const ident = [ci !== '-' ? `CI ${ci}` : '', ruc !== '-' ? `RUC ${ruc}` : ''].filter(Boolean).join(' · ') || '-'
    doc.text(truncar(doc, ident, 55, 8), MARGIN + 80, y + 11)

    // ── Badge de nivel
    drawBadgeNivel(doc, nivelInfo.nombre, MARGIN, y + 17)

    // ── Gastado (zona fija a la derecha, sin solapamiento)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_TEXT)
    const gastoStr = formatGuaranies(totalGastado)
    doc.text(gastoStr, MARGIN + CONTENT_WIDTH, y + 17, { align: 'right' })

    // ── Opcional: pedidos (termina antes de la zona del gasto)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY_MUTED)
    if (totalPedidos != null) {
      const extrasMaxWidth = CONTENT_WIDTH - GASTADO_ZONE_MM - 26
      doc.text(`Ped. ${totalPedidos}`, MARGIN + CONTENT_WIDTH - GASTADO_ZONE_MM, y + 17, { align: 'right' })
    }

    // ── Borde inferior sutil
    doc.setDrawColor(...GRAY_BORDER)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, y + ROW_HEIGHT - 2, MARGIN + CONTENT_WIDTH, y + ROW_HEIGHT - 2)

    y += ROW_HEIGHT
  }

  // Caja de resumen (total clientes)
  let boxY = y + 12
  if (boxY + 14 > pageHeight - 22) {
    doc.addPage()
    addHeader(doc, tenantNombre, fechaReporteStr, logo)
    boxY = HEADER_HEIGHT + 10
  }

  doc.setDrawColor(...GRAY_BORDER)
  doc.setFillColor(...ORANGE_LIGHT)
  doc.setLineWidth(0.2)
  doc.roundedRect(MARGIN, boxY, CONTENT_WIDTH, 12, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GRAY_TEXT)
  doc.text(
    `Total: ${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`,
    MARGIN + 8,
    boxY + 8
  )

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    addFooter(doc, p, totalPages)
  }

  const fecha = new Date().toISOString().slice(0, 10)
  doc.save(`reporte-clientes-${fecha}.pdf`)
}
