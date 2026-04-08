import { createClient } from '@/lib/supabase/client'
import type { LoginCredentials, AuthResponse } from '../types/auth.types'
import { toParaguayanLoginError } from '../utils/loginErrorMessages'

export const authService = {
  async signIn({ email, password }: LoginCredentials): Promise<AuthResponse> {
    const supabase = createClient()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return { error: toParaguayanLoginError(error.message) }
      }

      return { data, error: undefined }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      return { error: toParaguayanLoginError(msg) }
    }
  },

  async signOut(): Promise<{ error?: string }> {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { error: toParaguayanLoginError(error.message) }
      }
      return {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      return {
        error: msg
          ? toParaguayanLoginError(msg)
          : 'No pudimos cerrar la sesión. Intentá de nuevo.',
      }
    }
  },

  async getCurrentUser() {
    const supabase = createClient()
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        return { user: null, error: toParaguayanLoginError(error.message) }
      }
      return { user, error: undefined }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      return { user: null, error: toParaguayanLoginError(msg) }
    }
  }
}
