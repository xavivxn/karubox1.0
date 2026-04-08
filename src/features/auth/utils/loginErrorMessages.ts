/**
 * Traduce mensajes de error de login (p. ej. Supabase en inglés) a español paraguayo (tono Asunción).
 */

const LEGACY_SPANISH: Record<string, string> = {
  'credenciales inválidas': 'Los datos no coinciden. Revisá el correo y la contraseña.',
  'error de conexión': 'Falló la conexión. Intentá de nuevo en un ratito.',
  'error al iniciar sesión': 'No pudimos iniciar sesión. Probá otra vez o más tarde.',
  'error al cerrar sesión': 'No pudimos cerrar la sesión. Intentá de nuevo.',
  'el correo electrónico es requerido': 'Tenés que ingresar el correo electrónico.',
  'la contraseña es requerida': 'Hay que completar la contraseña.',
  'formato de correo electrónico inválido': 'Ese correo no se ve bien. Revisá el formato.',
  'el mail o la clave no dan.': 'Los datos no coinciden. Revisá el correo y la contraseña.',
  'no pudimos cerrar la sesión bien. probá de nuevo.':
    'No pudimos cerrar la sesión. Intentá de nuevo.',
}

export function toParaguayanLoginError(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    return 'No pudimos iniciar sesión. Intentá de nuevo, por favor.'
  }

  const key = trimmed.toLowerCase()
  if (LEGACY_SPANISH[key]) {
    return LEGACY_SPANISH[key]
  }

  const m = key

  if (
    m.includes('invalid login credentials') ||
    m.includes('invalid email or password') ||
    m.includes('invalid credentials') ||
    m.includes('wrong password')
  ) {
    return 'Los datos no coinciden. Revisá el correo y la contraseña.'
  }

  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return 'Aún no confirmaste tu correo. Fijate si te llegó el mensaje en la bandeja de entrada.'
  }

  if (
    m.includes('user banned') ||
    m.includes('banned user') ||
    m.includes('user is banned')
  ) {
    return 'Esta cuenta no puede acceder. Si creés que no corresponde, comunicate con nosotros.'
  }

  if (
    m.includes('network') ||
    m.includes('fetch failed') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror') ||
    m.includes('econnrefused') ||
    m.includes('enotfound')
  ) {
    return 'No hay conexión o falló la red. Fijate el Wi‑Fi o los datos móviles e intentá de nuevo.'
  }

  if (
    m.includes('rate limit') ||
    m.includes('too many requests') ||
    (m.includes('too many') && m.includes('email'))
  ) {
    return 'Se hicieron muchos intentos seguidos. Esperá un ratito y volvé a probar.'
  }

  if (m.includes('session') && m.includes('expired')) {
    return 'La sesión venció. Iniciá sesión otra vez con tu correo y contraseña.'
  }

  if (m.includes('invalid refresh token') || m.includes('refresh token')) {
    return 'La sesión ya no sirve. Tenés que entrar de nuevo.'
  }

  if (m.includes('weak_password') || (m.includes('password') && m.includes('weak'))) {
    return 'La contraseña es muy débil. Usá una más larga, con letras y números mezclados.'
  }

  if (/[áéíóúñü]/.test(trimmed)) {
    return trimmed
  }

  if (
    /^(el |la |los |las |no |se |hay |falta|tenés|podés|ingres|ocurr|complet|intent|fijate|aún )/i.test(
      trimmed
    )
  ) {
    return trimmed
  }

  return 'Ocurrió un problema al iniciar sesión. Si sigue igual, intentá más tarde o contactanos.'
}
