import { AUTH_ERRORS, VALIDATION_RULES } from '../constants/auth.constants'

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL_REGEX.test(email)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= VALIDATION_RULES.MIN_PASSWORD_LENGTH
}

export const validateLoginForm = (email: string, password: string): string | null => {
  if (!email.trim()) {
    return AUTH_ERRORS.EMPTY_EMAIL
  }

  if (!validateEmail(email)) {
    return AUTH_ERRORS.INVALID_EMAIL
  }

  if (!password) {
    return AUTH_ERRORS.EMPTY_PASSWORD
  }

  if (!validatePassword(password)) {
    return `La contraseña tiene que tener al menos ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} caracteres.`
  }

  return null
}
