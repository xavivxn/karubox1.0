export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Los datos no coinciden. Revisá el correo y la contraseña.',
  NETWORK_ERROR: 'Falló la conexión. Intentá de nuevo en un ratito.',
  GENERIC: 'No pudimos iniciar sesión. Probá otra vez o más tarde.',
  EMPTY_EMAIL: 'Tenés que ingresar el correo electrónico.',
  EMPTY_PASSWORD: 'Hay que completar la contraseña.',
  INVALID_EMAIL: 'Ese correo no se ve bien. Revisá el formato.',
}

export const DEV_CREDENTIALS = {
  email: 'admin@lomiteria-don-juan.com',
  password: 'Admin123!',
}

export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
}

export const REDIRECT_URLS = {
  DEFAULT: '/home',
  LOGIN: '/',
}
