/**
 * Genera un PDF con el reporte de clientes (tabla).
 * Plantilla estilizada: barra naranja, listado con total y footer.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ClienteLocal } from '../types/clientes.types'
import { formatearFecha } from './clientes.utils'
import { PDF_FOOTER_TEXT } from './pdf.constants'

const MARGIN = 16
const HEADER_HEIGHT = 32
const PAGE_WIDTH = 210
const TABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN

// Colores (mismos que cierre de caja + acentos)
const ORANGE_HEADER = [234, 88, 12] as [number, number, number]
const ORANGE_LIGHT = [254, 243, 199] as [number, number, number]
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
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE CLIENTES', MARGIN, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 248, 240)
  if (fechaReporte) doc.text(`Generado: ${fechaReporte}`, MARGIN, 22)

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

  let startY = HEADER_HEIGHT + 12

  // Título de sección
  doc.setFontSize(12)
  doc.setTextColor(...GRAY_TEXT)
  doc.setFont('helvetica', 'bold')
  doc.text('Listado de clientes', MARGIN, startY)
  startY += 10

  const rows = clientes.map((c) => [
    limpia(c.nombre),
    limpia(c.ci),
    limpia(c.telefono),
    limpia(c.email),
    String(c.puntos_totales ?? 0),
    c.created_at ? formatearFecha(c.created_at) : '-',
  ])

  // Anchos que suman TABLE_WIDTH (178 mm). Fecha más ancha para que dd/mm/yyyy quepa en una línea.
  const colNombre = 43
  const colCI = 22
  const colTelefono = 26
  const colEmail = 47
  const colPuntos = 16
  const colRegistrado = 24

  const headersCortos = ['Nombre', 'CI', 'Teléfono', 'Email', 'Pts', 'Fecha']

  autoTable(doc, {
    head: [headersCortos],
    body: rows,
    startY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: TABLE_WIDTH,
    theme: 'plain',
    styles: {
      fontSize: 8,
      textColor: GRAY_TEXT,
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
      overflow: 'linebreak',
      halign: 'left',
    },
    headStyles: {
      fillColor: ORANGE_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: colNombre },
      1: { cellWidth: colCI },
      2: { cellWidth: colTelefono },
      3: { cellWidth: colEmail },
      4: { cellWidth: colPuntos, halign: 'right' },
      5: { cellWidth: colRegistrado, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: GRAY_LIGHT,
    },
  })

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? startY + 20
  const pageHeight = doc.internal.pageSize.getHeight()
  let boxY = finalY + 14

  // Si no hay espacio para la caja de resumen, pasar a nueva página
  if (boxY + 14 > pageHeight - 22) {
    doc.addPage()
    boxY = 20
  }

  // Caja de resumen (total clientes)
  doc.setDrawColor(...GRAY_BORDER)
  doc.setFillColor(...ORANGE_LIGHT)
  doc.setLineWidth(0.2)
  doc.roundedRect(MARGIN, boxY, TABLE_WIDTH, 12, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GRAY_TEXT)
  doc.text(`Total: ${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`, MARGIN + 8, boxY + 8)

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    addFooter(doc, p, totalPages)
  }

  const fecha = new Date().toISOString().slice(0, 10)
  doc.save(`reporte-clientes-${fecha}.pdf`)
}
