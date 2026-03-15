/**
 * Genera un PDF con el reporte de clientes (tabla).
 * Header: logo del sistema (o emoji 🍔 si PDF_LOGO_URL es null) + título + nombre del negocio.
 * Footer: "ARDENTIUM Software Technologies" + número de página.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ClienteLocal } from '../types/clientes.types'
import { formatearFecha } from './clientes.utils'
import { PDF_LOGO_URL, PDF_FOOTER_TEXT } from './pdf.constants'

const LOGO_PLACEHOLDER = '🍔'
const HEADER_TITLE = 'Reporte de Clientes'
const MARGIN = 14
const HEADER_HEIGHT = 22
const FOOTER_HEIGHT = 14
const PAGE_HEIGHT = 297 // A4
const PAGE_WIDTH = 210

export interface OpcionesPdfClientes {
  tenantNombre?: string
}

/**
 * Dibuja header y footer en cada página del PDF.
 */
function addHeaderFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  tenantNombre?: string
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)

  if (PDF_LOGO_URL) {
    try {
      doc.addImage(PDF_LOGO_URL, 'PNG', MARGIN, 8, 14, 14)
      doc.text(HEADER_TITLE, MARGIN + 18, 15)
    } catch {
      doc.text(LOGO_PLACEHOLDER, MARGIN, 15)
      doc.text(HEADER_TITLE, MARGIN + 12, 15)
    }
  } else {
    doc.text(LOGO_PLACEHOLDER, MARGIN, 15)
    doc.text(HEADER_TITLE, MARGIN + 12, 15)
  }

  if (tenantNombre) {
    doc.setFontSize(9)
    doc.text(tenantNombre, pageWidth - MARGIN, 15, { align: 'right' })
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, HEADER_HEIGHT, pageWidth - MARGIN, HEADER_HEIGHT)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(
    PDF_FOOTER_TEXT,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  )
  doc.text(
    `Página ${pageNumber} de ${totalPages}`,
    pageWidth - MARGIN,
    pageHeight - 8,
    { align: 'right' }
  )
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

  const headers = ['Nombre', 'CI', 'Teléfono', 'Email', 'Puntos', 'Registrado']
  const rows = clientes.map((c) => [
    c.nombre ?? '',
    c.ci ?? '-',
    c.telefono ?? '-',
    c.email ?? '-',
    String(c.puntos_totales ?? 0),
    c.created_at ? formatearFecha(c.created_at) : '-',
  ])

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: HEADER_HEIGHT + 6,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    addHeaderFooter(doc, p, totalPages, tenantNombre)
  }

  const fecha = new Date().toISOString().slice(0, 10)
  doc.save(`reporte-clientes-${fecha}.pdf`)
}
