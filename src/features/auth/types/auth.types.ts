export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse {
  error?: string
  data?: any
}

export interface LoginFormProps {
  onSuccess?: () => void
  redirectUrl?: string
}
