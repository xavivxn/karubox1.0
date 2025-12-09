import { createClient } from '@/lib/supabase/client'
import type { LoginCredentials, AuthResponse } from '../types/auth.types'

export const authService = {
  async signIn({ email, password }: LoginCredentials): Promise<AuthResponse> {
    const supabase = createClient()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return { data, error: undefined }
    } catch (err: any) {
      return { error: err.message || 'Error al iniciar sesión' }
    }
  },

  async signOut(): Promise<{ error?: string }> {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { error: error.message }
      }
      return {}
    } catch (err: any) {
      return { error: err.message || 'Error al cerrar sesión' }
    }
  },

  async getCurrentUser() {
    const supabase = createClient()
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        return { user: null, error: error.message }
      }
      return { user, error: undefined }
    } catch (err: any) {
      return { user: null, error: err.message }
    }
  }
}
