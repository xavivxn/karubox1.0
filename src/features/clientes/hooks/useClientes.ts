/**
 * Clientes Module - Custom Hook
 * Hook para gestionar el estado y operaciones de clientes
 */

import { useState, useEffect } from 'react'
import type { ClienteLocal, ClienteFormData } from '../types/clientes.types'
import { INITIAL_FORM_DATA } from '../types/clientes.types'
import { validarFormulario } from '../utils/clientes.utils'
import {
  loadClientes,
  searchClientes,
  crearCliente,
  actualizarCliente
} from '../services/clientesService'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { measureEnd, measureStart } from '@/lib/perf/metrics'

interface UseClientesReturn {
  // Estado
  clientes: ClienteLocal[]
  loading: boolean
  searchTerm: string
  showModal: boolean
  editingCliente: ClienteLocal | null
  formData: ClienteFormData
  saving: boolean
  
  // Acciones
  setSearchTerm: (term: string) => void
  handleSearch: () => Promise<void>
  handleClearSearch: () => void
  handleNuevoCliente: () => void
  handleEditarCliente: (cliente: ClienteLocal) => void
  handleCloseModal: () => void
  handleFormChange: (data: ClienteFormData) => void
  handleGuardar: () => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook principal para la gestión de clientes
 */
export const useClientes = (tenantId: string | undefined): UseClientesReturn => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<ClienteLocal | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ClienteFormData>(INITIAL_FORM_DATA)
  const queryClient = useQueryClient()
  const normalizedSearch = debouncedSearch.trim()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 350)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const clientesQuery = useQuery({
    queryKey: ['clientes', tenantId, normalizedSearch],
    enabled: Boolean(tenantId),
    staleTime: 60_000,
    queryFn: async () => {
      const startedAt = measureStart()
      const data = normalizedSearch
        ? await searchClientes(normalizedSearch, tenantId as string, { page: 1, pageSize: 100 })
        : await loadClientes(tenantId as string, { page: 1, pageSize: 100 })
      measureEnd('clientes.list.load', startedAt, {
        tenant_id: tenantId,
        search: normalizedSearch || null,
        rows: data.length
      })
      return data
    }
  })

  // Buscar clientes (filtro en memoria para ignorar tildes)
  const handleSearch = async () => {
    setDebouncedSearch(searchTerm)
    await clientesQuery.refetch()
  }

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
    setDebouncedSearch('')
  }

  // Abrir modal para nuevo cliente
  const handleNuevoCliente = () => {
    setEditingCliente(null)
    setFormData(INITIAL_FORM_DATA)
    setShowModal(true)
  }

  // Abrir modal para editar cliente
  const handleEditarCliente = (cliente: ClienteLocal) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre || '',
      ci: cliente.ci || '',
      ruc: cliente.ruc || '',
      pasaporte: cliente.pasaporte || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      fecha_nacimiento: cliente.fecha_nacimiento ?? ''
    })
    setShowModal(true)
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    setFormData(INITIAL_FORM_DATA)
  }

  // Actualizar datos del formulario
  const handleFormChange = (data: ClienteFormData) => {
    setFormData(data)
  }

  // Guardar cliente (crear o actualizar)
  const handleGuardar = async () => {
    if (!tenantId) return

    // Validar
    const validation = validarFormulario(formData)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    try {
      setSaving(true)

      if (editingCliente) {
        await actualizarCliente(editingCliente.id, formData)
        alert('✅ Cliente actualizado correctamente')
      } else {
        await crearCliente(formData, tenantId)
        alert('✅ Cliente creado correctamente')
      }

      handleCloseModal()
      await queryClient.invalidateQueries({ queryKey: ['clientes', tenantId] })
    } catch (error: any) {
      console.error('Error guardando cliente:', error)
      alert(`Error: ${error.message || 'Error al guardar cliente'}`)
    } finally {
      setSaving(false)
    }
  }

  return {
    clientes: clientesQuery.data ?? [],
    loading: clientesQuery.isLoading || clientesQuery.isFetching,
    searchTerm,
    showModal,
    editingCliente,
    formData,
    saving,
    setSearchTerm,
    handleSearch,
    handleClearSearch,
    handleNuevoCliente,
    handleEditarCliente,
    handleCloseModal,
    handleFormChange,
    handleGuardar,
    refetch: async () => {
      await clientesQuery.refetch()
    }
  }
}
