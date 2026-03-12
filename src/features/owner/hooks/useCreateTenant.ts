'use client'

import { useState, useCallback } from 'react'
import { createTenant, createTenantUser } from '@/app/actions/owner'

export interface CreateTenantForm {
  nombreNegocio: string
  ruc: string
  razon_social: string
  actividad_economica: string
  email: string
  telefono: string
  direccion: string
  logo_url: string
  nombreAdmin: string
  emailAdmin: string
  passwordAdmin: string
}

type Step = 'tenant' | 'user' | 'done'

export function useCreateTenant() {
  const [form, setForm] = useState<CreateTenantForm>({
    nombreNegocio: '',
    ruc: '',
    razon_social: '',
    actividad_economica: '',
    email: '',
    telefono: '',
    direccion: '',
    logo_url: '',
    nombreAdmin: '',
    emailAdmin: '',
    passwordAdmin: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('tenant')
  const [createdTenantNombre, setCreatedTenantNombre] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  const setField = <K extends keyof CreateTenantForm>(
    field: K,
    value: CreateTenantForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  /** Paso 1: solo validación local, avanza al paso 2 sin llamar a la API */
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nombreNegocio.trim()) {
      setError('El nombre del negocio es requerido')
      return
    }

    setStep('user')
  }

  /** Volver al paso 1 desde el paso 2 */
  const handleBack = useCallback(() => {
    setError('')
    setStep('tenant')
  }, [])

  /** Paso 2: llama a ambas APIs (crear tenant + crear usuario admin) */
  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nombreAdmin.trim() || !form.emailAdmin.trim() || !form.passwordAdmin) {
      setError('Todos los campos del administrador son requeridos')
      return
    }

    if (form.passwordAdmin.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    // 1. Crear el tenant
    const tenantResult = await createTenant({
      nombreNegocio: form.nombreNegocio,
      ruc: form.ruc,
      razon_social: form.razon_social,
      actividad_economica: form.actividad_economica,
      email: form.email,
      telefono: form.telefono,
      direccion: form.direccion,
      logo_url: form.logo_url,
    })

    if (tenantResult.error) {
      setLoading(false)
      setError(tenantResult.error)
      return
    }

    // 2. Crear el usuario administrador
    const userResult = await createTenantUser({
      tenantId: tenantResult.tenant!.id,
      nombreAdmin: form.nombreAdmin,
      emailAdmin: form.emailAdmin,
      passwordAdmin: form.passwordAdmin,
    })

    setLoading(false)

    if (userResult.error) {
      setError(userResult.error)
      return
    }

    setCreatedTenantNombre(tenantResult.tenant!.nombre)
    setAdminEmail(userResult.email!)
    setStep('done')
  }

  const reset = useCallback(() => {
    setForm({ nombreNegocio: '', ruc: '', razon_social: '', actividad_economica: '', email: '', telefono: '', direccion: '', logo_url: '', nombreAdmin: '', emailAdmin: '', passwordAdmin: '' })
    setStep('tenant')
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
    handleNextStep,
    handleBack,
    handleSubmitAll,
    reset,
  }
}
