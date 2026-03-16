/**
 * Clientes Module - Custom Hook
 * Hook para gestionar el estado y operaciones de clientes
 */

import { useState, useEffect, useCallback } from 'react'
import type { ClienteLocal, ClienteFormData } from '../types/clientes.types'
import { INITIAL_FORM_DATA } from '../types/clientes.types'
import { validarFormulario, normalizarParaBusqueda } from '../utils/clientes.utils'
import {
  loadClientes,
  crearCliente,
  actualizarCliente
} from '../services/clientesService'

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
  const [clientes, setClientes] = useState<ClienteLocal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<ClienteLocal | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ClienteFormData>(INITIAL_FORM_DATA)

  // Cargar clientes
  const fetchClientes = useCallback(async () => {
    if (!tenantId) return

    try {
      setLoading(true)
      const data = await loadClientes(tenantId)
      setClientes(data)
    } catch (error) {
      console.error('Error cargando clientes:', error)
      alert('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // Buscar clientes (filtro en memoria para ignorar tildes)
  const handleSearch = async () => {
    if (!tenantId) return

    try {
      setLoading(true)
      const todos = await loadClientes(tenantId)
      if (!searchTerm.trim()) {
        setClientes(todos)
        return
      }
      const termino = normalizarParaBusqueda(searchTerm)
      const filtrados = todos.filter((c) => {
        const nombre = normalizarParaBusqueda(c.nombre ?? '')
        const telefono = normalizarParaBusqueda(c.telefono ?? '')
        const email = normalizarParaBusqueda(c.email ?? '')
        const ci = normalizarParaBusqueda(c.ci ?? '')
        return (
          nombre.includes(termino) ||
          telefono.includes(termino) ||
          email.includes(termino) ||
          ci.includes(termino)
        )
      })
      setClientes(filtrados)
    } catch (error) {
      console.error('Error buscando clientes:', error)
      alert('Error al buscar clientes')
    } finally {
      setLoading(false)
    }
  }

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('')
    fetchClientes()
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
      fetchClientes()
    } catch (error: any) {
      console.error('Error guardando cliente:', error)
      alert(`Error: ${error.message || 'Error al guardar cliente'}`)
    } finally {
      setSaving(false)
    }
  }

  return {
    clientes,
    loading,
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
    refetch: fetchClientes
  }
}
