import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/contexts/TenantContext'
import { ROUTES } from '@/config'

export function useHomeAuth() {
  const router = useRouter()
  const { tenant, usuario, darkMode, loading, user } = useTenant()

  useEffect(() => {
    if (!loading && !user) {
      router.push(ROUTES.PUBLIC.LOGIN)
    }
  }, [loading, user, router])

  return {
    tenant,
    usuario,
    darkMode,
    loading,
    user,
    isAuthenticated: !!user
  }
}
