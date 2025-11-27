import { VALIDATION_RULES } from '../constants/auth.constants'

export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL_REGEX.test(email)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= VALIDATION_RULES.MIN_PASSWORD_LENGTH
}

export const validateLoginForm = (email: string, password: string): string | null => {
  if (!email.trim()) {
    return 'El correo electrónico es requerido'
  }
  
  if (!validateEmail(email)) {
    return 'Formato de correo electrónico inválido'
  }
  
  if (!password) {
    return 'La contraseña es requerida'
  }
  
  if (!validatePassword(password)) {
    return `La contraseña debe tener al menos ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} caracteres`
  }
  
  return null
}
