/**
 * Genera un PDF con el informe de destinatarios por campaña.
 * Diseño tipo dashboard: filas con bordes sutiles, nombre destacado, contacto/identificación
 * agrupados, badges de nivel y moneda en una sola línea. Sin columnas estrechas que estiren el texto.
 */

'use client'

import { jsPDF } from 'jspdf'
import type { ClienteConVisita, TipoCampana } from '../types/clientes.types'
import { getNivel } from './clientes.utils'
import { formatGuaranies } from '@/lib/utils/format'
import { TIPO_LABELS } from '../services/campanasService'
import { PDF_FOOTER_TEXT } from './pdf.constants'

const MARGIN = 16
const HEADER_HEIGHT = 36
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN
const ROW_HEIGHT = 22
/** Espacio reservado a la derecha para el monto (evita solapamiento con texto secundario) */
const GASTADO_ZONE_MM = 44
const PAGE_HEIGHT = 297

const ORANGE_HEADER = [234, 88, 12] as [number, number, number]
const GRAY_BORDER = [226, 232, 240] as [number, number, number]
const GRAY_TEXT = [71, 85, 105] as [number, number, number]
const GRAY_MUTED = [148, 163, 184] as [number, number, number]

const BADGE_ORO = { fill: [254, 243, 199] as [number, number, number], text: [180, 83, 9] as [number, number, number] }
const BADGE_PLATA = { fill: [248, 250, 252] as [number, number, number], text: [71, 85, 105] as [number, number, number] }
const BADGE_BRONCE = { fill: [255, 237, 213] as [number, number, number], text: [194, 65, 12] as [number, number, number] }

function formatFechaReporte() {
  return new Date().toLocaleString('es-PY', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function sanitizePdfText(s: string): string {
  return s
    .replace(/[\u{10000}-\u{10FFFF}]/gu, '')
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '-')
}

function limpia(s: unknown): string {
  const raw = String(s ?? '').replace(/\r?\n/g, ' ')
  return sanitizePdfText(raw).replace(/\s+/g, ' ').trim() || '-'
}

function truncar(doc: jsPDF, texto: string, maxMm: number, fontSize: number): string {
  doc.setFontSize(fontSize)
  const approxPerMm = 0.38
  const maxChars = Math.floor(maxMm * approxPerMm)
  if (texto.length <= maxChars) return texto
  return texto.slice(0, maxChars - 2) + '…'
}

function addHeader(doc: jsPDF, tenantNombre: string | undefined, tipo: TipoCampana, fechaReporte: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...ORANGE_HEADER)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('INFORME DE CAMPAÑA', MARGIN, 21)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 248, 240)

  const tipoLabel = TIPO_LABELS[tipo] ?? String(tipo)
  doc.text(`${tipoLabel}${tenantNombre ? ` • ${tenantNombre}` : ''}`, MARGIN, 28)
  doc.text(`Generado: ${fechaReporte}`, MARGIN, 35)

  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.4)
  doc.line(0, HEADER_HEIGHT, pageWidth, HEADER_HEIGHT)
}

function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(...GRAY_BORDER)
  doc.setLineWidth(0.2)
  doc.line(MARGIN, pageHeight - 20, pageWidth - MARGIN, pageHeight - 20)

  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MUTED)
  doc.text(PDF_FOOTER_TEXT, pageWidth / 2, pageHeight - 13, { align: 'center' })
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - MARGIN, pageHeight - 8, { align: 'right' })
}

function drawBadgeNivel(doc: jsPDF, nombreNivel: string, x: number, y: number) {
  const nivel = nombreNivel.toLowerCase()
  const cfg = nivel === 'oro' ? BADGE_ORO : nivel === 'plata' ? BADGE_PLATA : BADGE_BRONCE

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

export interface OpcionesPdfCampanaDestinatarios {
  tenantNombre?: string
  tipo: TipoCampana
  puntosRegalo: number
  mensajeBase?: string
}

export function generarPdfCampanaDestinatarios(
  destinatarios: ClienteConVisita[],
  opciones: OpcionesPdfCampanaDestinatarios
): void {
  const { tenantNombre, tipo, puntosRegalo, mensajeBase } = opciones

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const fechaReporteStr = formatFechaReporte()

  addHeader(doc, tenantNombre, tipo, fechaReporteStr)

  let y = HEADER_HEIGHT + 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...GRAY_TEXT)
  doc.text(`Destinatarios: ${destinatarios.length}`, MARGIN, y)
  y += 6

  if (puntosRegalo > 0) {
    doc.text(`Puntos regalo: ${puntosRegalo} por cliente`, MARGIN, y)
    y += 6
  }

  const mensajeResumen = mensajeBase ? limpia(mensajeBase).slice(0, 220) : ''
  if (mensajeResumen) {
    doc.setFontSize(8)
    const lineas = doc.splitTextToSize(`Mensaje (resumen): ${mensajeResumen}`, CONTENT_WIDTH)
    doc.text(lineas, MARGIN, y)
    y += lineas.length * 4 + 4
  }

  y += 4

  const pageHeight = doc.internal.pageSize.getHeight()
  const yMax = pageHeight - 24

  for (let i = 0; i < destinatarios.length; i++) {
    if (y + ROW_HEIGHT > yMax) {
      doc.addPage()
      addHeader(doc, tenantNombre, tipo, fechaReporteStr)
      y = HEADER_HEIGHT + 10
    }

    const c = destinatarios[i]
    const nivelInfo = getNivel(c.total_gastado ?? 0)
    const ruc = (c as ClienteConVisita & { ruc?: string }).ruc

    // Nombre destacado
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRAY_TEXT)
    const nombre = truncar(doc, limpia(c.nombre), CONTENT_WIDTH - 50, 11)
    doc.text(nombre, MARGIN, y + 5)

    // Contacto (tel · email)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_MUTED)
    const tel = c.telefono ? limpia(c.telefono) : '-'
    const email = c.email ? limpia(c.email) : '-'
    const contacto = [tel !== '-' ? tel : '', email !== '-' ? email : ''].filter(Boolean).join(' · ') || '-'
    doc.text(truncar(doc, contacto, 85, 8), MARGIN, y + 11)

    // Identificación (CI · RUC)
    const ci = c.ci ? limpia(c.ci) : ''
    const rucStr = ruc ? limpia(ruc) : ''
    const ident = [ci ? `CI ${ci}` : '', rucStr ? `RUC ${rucStr}` : ''].filter(Boolean).join(' · ') || '-'
    doc.text(truncar(doc, ident, 50, 8), MARGIN + 90, y + 11)

    // Badge nivel
    drawBadgeNivel(doc, nivelInfo.nombre, MARGIN, y + 17)

    // Gastado (zona fija a la derecha, sin solapamiento)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_TEXT)
    doc.text(formatGuaranies(c.total_gastado ?? 0), MARGIN + CONTENT_WIDTH, y + 17, { align: 'right' })

    // Secundario: Puntos · Días · Últ. visita · Pedidos (termina antes de la zona del gasto)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY_MUTED)
    const pts = c.puntos_totales ?? 0
    const dias = c.dias_sin_visita != null ? String(c.dias_sin_visita) : '-'
    const ped = c.total_pedidos ?? 0
    const sec = `Pts ${pts} · Días ${dias} · Ped. ${ped}`
    const secMaxWidth = CONTENT_WIDTH - GASTADO_ZONE_MM - 26 // 26 ≈ badge + margen
    doc.text(truncar(doc, sec, secMaxWidth, 7), MARGIN + CONTENT_WIDTH - GASTADO_ZONE_MM, y + 17, { align: 'right' })

    doc.setDrawColor(...GRAY_BORDER)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, y + ROW_HEIGHT - 2, MARGIN + CONTENT_WIDTH, y + ROW_HEIGHT - 2)

    y += ROW_HEIGHT
  }

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    addFooter(doc, p, totalPages)
  }

  const fecha = new Date().toISOString().slice(0, 10)
  const safeTipo = String(tipo).replace(/[^a-z0-9_-]/gi, '')
  doc.save(`informe-campana-${safeTipo}-${fecha}.pdf`)
}
