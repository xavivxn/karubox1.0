import { useState } from 'react'
import { signIn as signInAction } from '@/app/actions/auth'
import { validateLoginForm } from '../utils/validators'
import { toParaguayanLoginError } from '../utils/loginErrorMessages'

export function useAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      // Llamar Server Action
      const result = await signInAction(email, password)
      
      // Si hay error, mostrarlo
      if (result?.error) {
        setError(toParaguayanLoginError(result.error))
        setLoading(false)
        return
      }
      
      // Si es exitoso, hacer redirección completa para sincronizar cookies
      // Esto es CRÍTICO con @supabase/ssr
      if (result?.success && result?.redirectTo) {
        window.location.href = result.redirectTo
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      setError(toParaguayanLoginError(msg))
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
