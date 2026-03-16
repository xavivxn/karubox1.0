/**
 * Genera un PDF con el reporte de clientes (tabla).
 * Misma plantilla que el reporte de cierre de caja: barra naranja, colores y footer.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ClienteLocal } from '../types/clientes.types'
import { formatearFecha } from './clientes.utils'
import { PDF_FOOTER_TEXT } from './pdf.constants'

const MARGIN = 1 // Sin márgenes en los 4 sentidos
const TABLE_MARGIN = 0
const HEADER_HEIGHT = 28
const PAGE_HEIGHT = 297
const PAGE_WIDTH = 210
const TABLE_WIDTH = PAGE_WIDTH // 210 mm, tabla a todo el ancho

// Colores (mismos que cierre de caja)
const ORANGE_HEADER = [234, 88, 12] as [number, number, number]
const GRAY_LIGHT = [248, 250, 252] as [number, number, number]
const GRAY_BORDER = [226, 232, 240] as [number, number, number]
const GRAY_TEXT = [71, 85, 105] as [number, number, number]
const GRAY_MUTED = [148, 163, 184] as [number, number, number]

export interface OpcionesPdfClientes {
  tenantNombre?: string
}

function formatFechaReporte() {
  return new Date().toLocaleString('es-PY', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function addHeader(doc: jsPDF, tenantNombre?: string, fechaReporte?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...ORANGE_HEADER)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE CLIENTES', 0, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  if (fechaReporte) doc.text(`Fecha: ${fechaReporte}`, 0, 21)

  if (tenantNombre) {
    doc.setFontSize(10)
    doc.text(tenantNombre, pageWidth, 14, { align: 'right' })
    doc.setFontSize(8)
    doc.text('Lomitería', pageWidth, 21, { align: 'right' })
  }

  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.3)
  doc.line(0, HEADER_HEIGHT, pageWidth, HEADER_HEIGHT)
}

function addFooter(doc: jsPDF, pageNumber?: number, totalPages?: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.2)
  doc.line(0, pageHeight - 18, pageWidth, pageHeight - 18)

  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MUTED)
  doc.text(PDF_FOOTER_TEXT, pageWidth / 2, pageHeight - 12, { align: 'center' })
  doc.text(
    `Generado: ${formatFechaReporte()}`,
    totalPages && totalPages > 1 ? 0 : pageWidth / 2,
    pageHeight - 8,
    totalPages && totalPages > 1 ? { align: 'left' } : { align: 'center' }
  )
  if (totalPages != null && totalPages > 1 && pageNumber != null) {
    doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth,
      pageHeight - 8,
      { align: 'right' }
    )
  }
}

/**
 * Genera el PDF del reporte de clientes y dispara la descarga.
 */
export function generarPdfClientes(
  clientes: ClienteLocal[],
  opciones: OpcionesPdfClientes = {}
): void {
  const { tenantNombre } = opciones
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const fechaReporteStr = formatFechaReporte()
  addHeader(doc, tenantNombre, fechaReporteStr)

  /** Quita saltos de línea en celdas para que no se rompan en varias líneas */
  const limpia = (s: string | null | undefined) => String(s ?? '').replace(/\r?\n/g, ' ').trim() || '-'

  const headers = ['Nombre', 'CI', 'Teléfono', 'Email', 'Puntos', 'Registrado']
  const rows = clientes.map((c) => [
    limpia(c.nombre),
    limpia(c.ci),
    limpia(c.telefono),
    limpia(c.email),
    String(c.puntos_totales ?? 0),
    c.created_at ? formatearFecha(c.created_at) : '-',
  ])

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: HEADER_HEIGHT,
    margin: { left: 0, right: 0, top: 0, bottom: 0 },
    tableWidth: TABLE_WIDTH,
    theme: 'plain',
    styles: {
      fontSize: 9,
      textColor: GRAY_TEXT,
      cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
      overflow: 'linebreak',
      halign: 'left',
    },
    headStyles: {
      fillColor: ORANGE_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
      halign: 'left',
    },
    columnStyles: {
      // Anchos que suman TABLE_WIDTH (210 mm), sin márgenes
      0: { cellWidth: 56 },  // Nombre
      1: { cellWidth: 26 },  // CI
      2: { cellWidth: 28 },  // Teléfono
      3: { cellWidth: 56 },  // Email
      4: { cellWidth: 22, minCellWidth: 22 },  // Puntos
      5: { cellWidth: 22, minCellWidth: 22 },  // Registrado
    },
    alternateRowStyles: {
      fillColor: GRAY_LIGHT,
    },
  })

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    addFooter(doc, p, totalPages)
  }

  const fecha = new Date().toISOString().slice(0, 10)
  doc.save(`reporte-clientes-${fecha}.pdf`)
}
