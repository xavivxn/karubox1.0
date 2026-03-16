/**
 * Genera un PDF con el reporte de cierre de caja.
 * Template estilizado: header con barra, tabla resaltada y pie de página.
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SesionCaja } from '../types/caja.types'
import { PDF_LOGO_URL, PDF_FOOTER_TEXT } from '@/features/clientes/utils/pdf.constants'
import { formatGuaranies } from '@/lib/utils/format'

const LOGO_PLACEHOLDER = '🍔'
const MARGIN = 16
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297

// Colores (RGB)
const ORANGE_HEADER = [234, 88, 12] as [number, number, number]   // orange-600
const ORANGE_LIGHT = [254, 243, 199] as [number, number, number]  // amber-100
const GRAY_LIGHT = [248, 250, 252] as [number, number, number]    // slate-50
const GRAY_BORDER = [226, 232, 240] as [number, number, number]
const GRAY_TEXT = [71, 85, 105] as [number, number, number]
const GRAY_MUTED = [148, 163, 184] as [number, number, number]
const EMERALD_BG = [209, 250, 229] as [number, number, number]   // emerald-200
const EMERALD_TEXT = [5, 150, 105] as [number, number, number]   // emerald-700

export interface OpcionesPdfCierreCaja {
  tenantNombre?: string
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function addHeader(doc: jsPDF, tenantNombre?: string, fechaCierre?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Barra superior naranja
  doc.setFillColor(...ORANGE_HEADER)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Título en blanco
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE CIERRE DE CAJA', MARGIN, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  if (fechaCierre) doc.text(`Cierre: ${fechaCierre}`, MARGIN, 21)

  if (tenantNombre) {
    doc.setFontSize(10)
    doc.text(tenantNombre, pageWidth - MARGIN, 14, { align: 'right' })
    doc.setFontSize(8)
    doc.text('Lomitería', pageWidth - MARGIN, 21, { align: 'right' })
  }

  // Línea bajo el header
  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.3)
  doc.line(0, 28, pageWidth, 28)
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

/**
 * Genera el PDF del reporte de cierre de caja y dispara la descarga.
 */
export function generarPdfCierreCaja(
  sesion: SesionCaja,
  opciones: OpcionesPdfCierreCaja = {}
): void {
  const { tenantNombre } = opciones
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const fechaCierreStr = sesion.cierre_at ? formatFecha(sesion.cierre_at) : null
  addHeader(doc, tenantNombre, fechaCierreStr ?? undefined)

  let startY = 36

  // Título de sección
  doc.setFontSize(11)
  doc.setTextColor(...GRAY_TEXT)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN DEL TURNO', MARGIN, startY)
  startY += 8

  const gastosExtra = sesion.gastos_extra && Array.isArray(sesion.gastos_extra) ? sesion.gastos_extra : []
  const totalGastosExtra = gastosExtra.reduce((sum, g) => sum + Number(g.monto || 0), 0)

  const rows: [string, string][] = [
    ['Fecha de apertura', sesion.apertura_at ? formatFecha(sesion.apertura_at) : '—'],
    ['Fecha de cierre', sesion.cierre_at ? formatFecha(sesion.cierre_at) : '—'],
    ['Total ventas', formatGuaranies(sesion.total_ventas)],
    ['Costo estimado', formatGuaranies(sesion.total_costo_estimado)],
    ['Monto pagado a empleados', formatGuaranies(sesion.monto_pagado_empleados)],
    ...(gastosExtra.length > 0
      ? gastosExtra.map((g) => [g.descripcion || 'Gasto extra', formatGuaranies(Number(g.monto))] as [string, string])
      : []),
    ['Cantidad de pedidos', String(sesion.cantidad_pedidos)],
    ['Ganancia neta', formatGuaranies(sesion.ganancia_neta)],
  ]

  autoTable(doc, {
    head: [['Concepto', 'Valor']],
    body: rows,
    startY,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'plain',
    styles: {
      fontSize: 10,
      textColor: GRAY_TEXT,
      cellPadding: { top: 6, right: 8, bottom: 6, left: 8 },
    },
    headStyles: {
      fillColor: ORANGE_HEADER,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: { top: 7, right: 8, bottom: 7, left: 8 },
    },
    columnStyles: {
      0: { cellWidth: 85, textColor: GRAY_TEXT },
      1: { cellWidth: 'auto', fontStyle: 'bold', halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: GRAY_LIGHT,
    },
    didParseCell: (data) => {
      const rowIndex = data.row.index
      const isGananciaRow = rowIndex !== null && rows[rowIndex]?.[0] === 'Ganancia neta'
      if (isGananciaRow) {
        data.cell.styles.fillColor = EMERALD_BG
        data.cell.styles.textColor = EMERALD_TEXT
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 11
      }
    },
  })

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? startY + 40
  startY = finalY + 4

  // Caja de nota opcional
  doc.setDrawColor(...GRAY_BORDER)
  doc.setFillColor(...ORANGE_LIGHT)
  doc.setLineWidth(0.2)
  doc.roundedRect(MARGIN, startY, PAGE_WIDTH - 2 * MARGIN, 14, 2, 2, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MUTED)
  const formula =
    totalGastosExtra > 0
      ? 'Ganancia neta = Total ventas − Costo − Pagado empleados − Gastos extra'
      : 'Ganancia neta = Total ventas − Costo estimado − Monto pagado a empleados'
  doc.text(formula, MARGIN + 4, startY + 8)

  addFooter(doc)

  const fecha = sesion.cierre_at
    ? new Date(sesion.cierre_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10)
  doc.save(`cierre-caja-${fecha}.pdf`)
}
