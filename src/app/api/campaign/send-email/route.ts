import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { buildEmailCampaignHtml } from '@/features/clientes/utils/emailCampaignTemplate'

export interface SendEmailDestinatario {
  email: string
  nombre: string
  puntos_totales?: number
  puntos_regalo?: number
  dias_sin_visita?: number
}

export interface SendEmailBody {
  tenantNombre: string
  destinatarios: SendEmailDestinatario[]
  subject: string
  mensajeConVariables: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() ?? '')
}

function replaceVariables(
  mensaje: string,
  dest: SendEmailDestinatario,
  tenantNombre: string
): string {
  return mensaje
    .replace(/\{\{nombre_cliente\}\}/g, dest.nombre || '')
    .replace(/\{\{nombre_lomiteria\}\}/g, tenantNombre || '')
    .replace(/\{\{puntos\}\}/g, String(dest.puntos_totales ?? ''))
    .replace(/\{\{puntos_regalo\}\}/g, String(dest.puntos_regalo ?? ''))
    .replace(/\{\{dias_inactivo\}\}/g, String(dest.dias_sin_visita ?? ''))
    .replace(/\{\{mensaje_personalizado\}\}/g, '')
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { sent: 0, failed: 0, error: 'EMAIL_NOT_CONFIGURED' },
      { status: 200 }
    )
  }

  let body: SendEmailBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { sent: 0, failed: 0, error: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const { tenantNombre, destinatarios, subject, mensajeConVariables } = body
  if (!tenantNombre || !Array.isArray(destinatarios) || !subject || typeof mensajeConVariables !== 'string') {
    return NextResponse.json(
      { sent: 0, failed: 0, error: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  const valid = destinatarios.filter(
    (d) => d && isValidEmail(d.email)
  ) as SendEmailDestinatario[]

  if (valid.length === 0) {
    return NextResponse.json({ sent: 0, failed: destinatarios.length })
  }

  // Con onboarding@resend.dev solo llega al email de tu cuenta. Para enviar a TODOS los clientes
  // hay que verificar un dominio en Resend y poner RESEND_FROM (ej. "Atlas Burger <campanas@tudominio.com>").
  const fromAddress =
    process.env.RESEND_FROM?.trim() || `${tenantNombre} <onboarding@resend.dev>`

  const resend = new Resend(apiKey)
  let sent = 0
  let failed = 0
  const failedEmails: string[] = []
  let lastError: string | undefined

  for (const dest of valid) {
    const bodyReplaced = replaceVariables(mensajeConVariables, dest, tenantNombre)
    const html = buildEmailCampaignHtml({
      body: bodyReplaced,
      tenantNombre,
      subject,
    })
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [dest.email.trim()],
      subject,
      html,
    })
    if (error) {
      failed++
      failedEmails.push(dest.email.trim())
      if (error.message) lastError = error.message
    } else {
      sent++
    }
  }

  return NextResponse.json({
    sent,
    failed,
    ...(failedEmails.length > 0 && { failedEmails }),
    ...(lastError && { lastError }),
    // Si no tenés RESEND_FROM, Resend solo permite enviar al email de tu cuenta.
    ...(!process.env.RESEND_FROM?.trim() &&
      failed > 0 && {
        hint: 'Para enviar a todos los clientes, verificá un dominio en resend.com/domains y configurá RESEND_FROM en el servidor (ej. "Nombre Local <campanas@tudominio.com>").',
      }),
  })
}
