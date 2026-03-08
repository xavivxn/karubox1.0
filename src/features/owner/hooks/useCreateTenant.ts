'use client'

import { useState, useCallback } from 'react'
import { createTenant, createTenantUser } from '@/app/actions/owner'

export interface CreateTenantForm {
  nombreNegocio: string
  ruc: string
  nombreAdmin: string
  emailAdmin: string
  passwordAdmin: string
}

type Step = 'tenant' | 'user' | 'done'

export function useCreateTenant() {
  const [form, setForm] = useState<CreateTenantForm>({
    nombreNegocio: '',
    ruc: '',
    nombreAdmin: '',
    emailAdmin: '',
    passwordAdmin: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('tenant')
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null)
  const [createdTenantNombre, setCreatedTenantNombre] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  const setField = <K extends keyof CreateTenantForm>(
    field: K,
    value: CreateTenantForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nombreNegocio.trim()) {
      setError('El nombre del negocio es requerido')
      return
    }

    setLoading(true)
    const result = await createTenant({
      nombreNegocio: form.nombreNegocio,
      ruc: form.ruc,
    })
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setCreatedTenantId(result.tenant!.id)
    setCreatedTenantNombre(result.tenant!.nombre)
    setStep('user')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!createdTenantId) return

    if (!form.nombreAdmin.trim() || !form.emailAdmin.trim() || !form.passwordAdmin) {
      setError('Todos los campos del administrador son requeridos')
      return
    }

    setLoading(true)
    const result = await createTenantUser({
      tenantId: createdTenantId,
      nombreAdmin: form.nombreAdmin,
      emailAdmin: form.emailAdmin,
      passwordAdmin: form.passwordAdmin,
    })
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setAdminEmail(result.email!)
    setStep('done')
  }

  const reset = useCallback(() => {
    setForm({ nombreNegocio: '', ruc: '', nombreAdmin: '', emailAdmin: '', passwordAdmin: '' })
    setStep('tenant')
    setCreatedTenantId(null)
    setCreatedTenantNombre('')
    setAdminEmail('')
    setError('')
  }, [])

  return {
    form,
    setField,
    loading,
    error,
    step,
    createdTenantNombre,
    adminEmail,
    handleCreateTenant,
    handleCreateUser,
    reset,
  }
}
