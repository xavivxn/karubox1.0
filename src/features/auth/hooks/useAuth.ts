import { useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { validateLoginForm } from '../utils/validators'
import { REDIRECT_URLS } from '../constants/auth.constants'

export function useAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useTenant()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validación del formulario
    const validationError = validateLoginForm(email, password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const result = await signIn(email, password)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // El middleware se encargará de redirigir según el rol
      // Forzamos recarga de página para que el middleware actúe
      window.location.href = REDIRECT_URLS.DEFAULT
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin
  }
}
