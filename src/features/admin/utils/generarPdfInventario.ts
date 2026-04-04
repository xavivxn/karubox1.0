/**
 * PDF de inventario de materias primas, ordenado por criticidad (más crítico primero).
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { InventoryRecord } from '../types/admin.types'
import { sortInventoryByCriticality } from './admin.utils'
import { PDF_FOOTER_TEXT } from '@/features/clientes/utils/pdf.constants'
import {
  drawPdfSistemaLogo,
  loadPdfSistemaLogo,
  type PdfSistemaLogoPayload,
} from '@/features/clientes/utils/pdfLogo'

const MARGIN = 16
const PAGE_WIDTH = 210
const HEADER_HEIGHT_MM = 28

const ORANGE_HEADER = [234, 88, 12] as [number, number, number]
const GRAY_LIGHT = [248, 250, 252] as [number, number, number]
const GRAY_BORDER = [226, 232, 240] as [number, number, number]
const GRAY_TEXT = [71, 85, 105] as [number, number, number]
const GRAY_MUTED = [148, 163, 184] as [number, number, number]
const RED_SOFT = [254, 226, 226] as [number, number, number]
const RED_TEXT = [185, 28, 28] as [number, number, number]
const AMBER_SOFT = [254, 243, 199] as [number, number, number]
const AMBER_TEXT = [180, 83, 9] as [number, number, number]
const GREEN_SOFT = [209, 250, 229] as [number, number, number]
const GREEN_TEXT = [5, 150, 105] as [number, number, number]

export interface OpcionesPdfInventario {
  tenantNombre?: string
}

function nombreItem(item: InventoryRecord): string {
  return item.nombre ?? item.productos?.nombre ?? 'Insumo sin nombre'
}

function estadoLabel(stock: number, minimo: number): 'Crítico' | 'En límite' | 'OK' {
  if (stock < minimo) return 'Crítico'
  if (stock === minimo) return 'En límite'
  return 'OK'
}

function addHeader(
  doc: jsPDF,
  tenantNombre?: string,
  fechaReporte?: string,
  logo?: PdfSistemaLogoPayload | null
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFillColor(...ORANGE_HEADER)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT_MM, 'F')

  const titleX = MARGIN + drawPdfSistemaLogo(doc, logo ?? null, {
    headerHeightMm: HEADER_HEIGHT_MM,
    marginLeftMm: MARGIN,
  })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INVENTARIO DE MATERIAS PRIMAS', titleX, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (fechaReporte) doc.text(`Generado: ${fechaReporte}`, titleX, 21)
  if (tenantNombre) {
    doc.setFontSize(10)
    doc.text(tenantNombre, pageWidth - MARGIN, 14, { align: 'right' })
    doc.setFontSize(8)
    doc.text('Lomitería', pageWidth - MARGIN, 21, { align: 'right' })
  }
  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.3)
  doc.line(0, HEADER_HEIGHT_MM, pageWidth, HEADER_HEIGHT_MM)
}

function addFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, pageHeight - 18, pageWidth - MARGIN, pageHeight - 18)
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MUTED)
  doc.text(PDF_FOOTER_TEXT, pageWidth / 2, pageHeight - 12, { align: 'center' })
  doc.text(
    `Generado: ${new Date().toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  )
}

export async function generarPdfInventario(
  items: InventoryRecord[],
  opciones: OpcionesPdfInventario = {}
): Promise<void> {
  const { tenantNombre } = opciones
  const sorted = sortInventoryByCriticality(items)
  const logo = await loadPdfSistemaLogo()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const fechaReporte = new Date().toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  addHeader(doc, tenantNombre, fechaReporte, logo)

  const startY = 36
  doc.setFontSize(10)
  doc.setTextColor(...GRAY_TEXT)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Orden: del insumo más crítico (menor cobertura frente al mínimo) al de mayor stock relativo.',
    MARGIN,
    startY
  )

  const head = [['#', 'Insumo', 'Unidad', 'Stock actual', 'Mínimo', 'Diferencia', 'Estado']]
  const body = sorted.map((item, i) => {
    const min = item.stock_minimo
    const act = item.stock_actual
    const diff = act - min
    const diffStr = diff >= 0 ? `+${diff}` : String(diff)
    return [
      String(i + 1),
      nombreItem(item),
      item.unidad,
      String(act),
      String(min),
      diffStr,
      estadoLabel(act, min),
    ]
  })

  autoTable(doc, {
    head,
    body,
    startY: startY + 6,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'striped',
    styles: {
      fontSize: 9,
      textColor: GRAY_TEXT,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
    },
    headStyles: {
      fillColor: ORANGE_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 48 },
      2: { cellWidth: 24 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: GRAY_LIGHT,
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 6) return
      const row = body[data.row.index]
      if (!row) return
      const estado = row[6]
      if (estado === 'Crítico') {
        data.cell.styles.fillColor = RED_SOFT
        data.cell.styles.textColor = RED_TEXT
      } else if (estado === 'En límite') {
        data.cell.styles.fillColor = AMBER_SOFT
        data.cell.styles.textColor = AMBER_TEXT
      } else {
        data.cell.styles.fillColor = GREEN_SOFT
        data.cell.styles.textColor = GREEN_TEXT
      }
    },
  })

  addFooter(doc)

  const fechaArchivo = new Date().toISOString().slice(0, 10)
  doc.save(`inventario-materias-primas-${fechaArchivo}.pdf`)
}
