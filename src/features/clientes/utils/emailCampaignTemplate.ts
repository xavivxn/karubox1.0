/**
 * Genera el HTML del correo de campaña a partir del cuerpo (ya con variables reemplazadas)
 * y el nombre del negocio. Diseño responsive y atractivo, sin dependencias externas.
 */
export interface EmailCampaignTemplateParams {
  /** Cuerpo del mensaje (texto plano; se convierte en párrafos por saltos de línea). Soporta *texto* en negrita. */
  body: string
  /** Nombre del negocio para cabecera y pie */
  tenantNombre: string
  /** Asunto (opcional, para metadatos) */
  subject?: string
}

/**
 * Escapa HTML para evitar inyección. Convierte saltos de línea en párrafos y *texto* en negrita.
 */
function bodyToHtml(body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  const withBold = escaped.replace(/\*([^*]+)\*/g, '<strong style="font-weight:700;">$1</strong>')
  return withBold
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 1.25em; line-height:1.6; color:#374151;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

/**
 * Devuelve el HTML completo del correo (inline styles para clientes de correo).
 * Diseño: cabecera con marca, cuerpo legible, CTA destacado, pie limpio.
 */
export function buildEmailCampaignHtml(params: EmailCampaignTemplateParams): string {
  const { body, tenantNombre } = params
  const bodyHtml = bodyToHtml(body)
  const safeNombre = escapeHtml(tenantNombre)

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeNombre}</title>
</head>
<body style="margin:0; padding:0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif; background-color:#f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #fef3c7 0%, #f8fafc 24%); min-height:100%;">
    <tr>
      <td align="center" style="padding:40px 20px 48px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06); overflow:hidden;">
          <!-- Cabecera con identidad -->
          <tr>
            <td style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding:28px 32px; text-align:center;">
              <div style="font-size:1.5rem; font-weight:800; color:#ffffff; letter-spacing:-0.02em;">${safeNombre}</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.85); margin-top:4px; letter-spacing:0.05em;">Te esperamos</div>
            </td>
          </tr>
          <!-- Cuerpo del mensaje -->
          <tr>
            <td style="padding:32px 32px 28px;">
              <div style="font-size:16px; line-height:1.6;">
                ${bodyHtml}
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="border-radius:10px; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); box-shadow:0 2px 8px rgba(234,88,12,0.35);">
                    <a href="#" style="display:inline-block; padding:14px 28px; color:#ffffff; text-decoration:none; font-weight:700; font-size:15px;">Visitanos</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Pie -->
          <tr>
            <td style="padding:20px 32px 24px; background:#f8fafc; border-top:1px solid #e2e8f0;">
              <p style="margin:0; font-size:13px; color:#64748b;">— ${safeNombre}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
