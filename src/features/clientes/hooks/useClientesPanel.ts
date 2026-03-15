/**
 * Panel de Clientes - Hook principal
 * Maneja: clientes con visita, segmentos, campañas, drawer de detalle, modal crear/editar
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  ClienteConVisita,
  ClienteLocal,
  ClienteFormData,
  CampanaConfig,
  TipoCampana,
  Segmentos,
} from '../types/clientes.types'
import { INITIAL_FORM_DATA } from '../types/clientes.types'
import { validarFormulario } from '../utils/clientes.utils'
import {
  getClientesConVisita,
  getCampanaConfig,
  upsertCampanaConfig,
  registrarCampana,
  regalarPuntosIndividual,
} from '../services/campanasService'
import { crearCliente, actualizarCliente } from '../services/clientesService'

export interface UseClientesPanelReturn {
  // Datos
  clientes: ClienteConVisita[]
  filteredClientes: ClienteConVisita[]
  loading: boolean
  segments: Segmentos
  campanaConfig: CampanaConfig | null
  savingConfig: boolean

  // Búsqueda
  searchTerm: string
  setSearchTerm: (v: string) => void

  // Campaña modal
  showCampana: boolean
  tipoCampana: TipoCampana
  destinatarios: ClienteConVisita[]
  ejecutandoCampana: boolean
  handleAbrirCampana: (tipo: TipoCampana) => void
  handleCerrarCampana: () => void
  handleRegistrarCampana: (mensaje: string, puntosRegalo: number) => Promise<void>

  // Switches de automatización
  handleToggleSwitch: (campo: 'auto_15_dias' | 'auto_30_dias', valor: boolean) => Promise<void>
  handleGuardarTemplate: (campo: keyof CampanaConfig, valor: string | number) => Promise<void>

  // Drawer de detalle
  drawerCliente: ClienteConVisita | null
  handleAbrirDrawer: (cliente: ClienteConVisita) => void
  handleCerrarDrawer: () => void
  handleRegalarPuntosIndividual: (clienteId: string, puntos: number, descripcion: string) => Promise<void>

  // Modal crear/editar cliente
  showModal: boolean
  editingCliente: ClienteLocal | null
  formData: ClienteFormData
  saving: boolean
  handleNuevoCliente: () => void
  handleEditarCliente: (cliente: ClienteLocal) => void
  handleCloseModal: () => void
  handleFormChange: (data: ClienteFormData) => void
  handleGuardar: () => Promise<void>

  // Refresh
  refetch: () => Promise<void>
}

export const useClientesPanel = (tenantId: string | undefined): UseClientesPanelReturn => {
  // ── Clientes ─────────────────────────────
  const [clientes, setClientes] = useState<ClienteConVisita[]>([])
  const [loading, setLoading] = useState(true)

  // ── Búsqueda ─────────────────────────────
  const [searchTerm, setSearchTerm] = useState('')

  // ── Config de campañas ───────────────────
  const [campanaConfig, setCampanaConfig] = useState<CampanaConfig | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)

  // ── Campaña modal ────────────────────────
  const [showCampana, setShowCampana] = useState(false)
  const [tipoCampana, setTipoCampana] = useState<TipoCampana>('personalizado')
  const [ejecutandoCampana, setEjecutandoCampana] = useState(false)

  // ── Drawer de detalle ────────────────────
  const [drawerCliente, setDrawerCliente] = useState<ClienteConVisita | null>(null)

  // ── Modal crear/editar ───────────────────
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<ClienteLocal | null>(null)
  const [formData, setFormData] = useState<ClienteFormData>(INITIAL_FORM_DATA)
  const [saving, setSaving] = useState(false)

  // ── Carga inicial ─────────────────────────
  const fetchClientes = useCallback(async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      const [data, config] = await Promise.all([
        getClientesConVisita(tenantId),
        getCampanaConfig(tenantId),
      ])
      setClientes(data)
      setCampanaConfig(config)
    } catch (e) {
      console.error('Error cargando panel de clientes:', e)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // ── Búsqueda (cliente-side) ───────────────
  const filteredClientes = useMemo(() => {
    if (!searchTerm.trim()) return clientes
    const lower = searchTerm.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(lower) ||
        c.telefono?.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower) ||
        c.ci?.toLowerCase().includes(lower)
    )
  }, [clientes, searchTerm])

  // ── Segmentos ─────────────────────────────
  const segments: Segmentos = useMemo(() => {
    const activos = clientes.filter(
      (c) => c.dias_sin_visita !== null && c.dias_sin_visita < 15
    )
    const enRiesgo = clientes.filter(
      (c) => c.dias_sin_visita !== null && c.dias_sin_visita >= 15 && c.dias_sin_visita < 30
    )
    const inactivos = clientes.filter(
      (c) => c.dias_sin_visita === null || c.dias_sin_visita >= 30
    )
    return { total: clientes.length, activos, enRiesgo, inactivos }
  }, [clientes])

  // ── Destinatarios para campaña actual ─────
  const destinatarios = useMemo(() => {
    if (tipoCampana === 'inactivos_15') return [...segments.enRiesgo, ...segments.inactivos]
    if (tipoCampana === 'inactivos_30') return segments.inactivos
    return clientes
  }, [tipoCampana, segments, clientes])

  // ── Campaña ───────────────────────────────
  const handleAbrirCampana = (tipo: TipoCampana) => {
    setTipoCampana(tipo)
    setShowCampana(true)
  }
  const handleCerrarCampana = () => setShowCampana(false)

  const handleRegistrarCampana = async (mensaje: string, puntosRegalo: number) => {
    if (!tenantId) return
    setEjecutandoCampana(true)
    try {
      const ids = destinatarios.map((c) => c.id)
      await registrarCampana(tenantId, tipoCampana, ids, puntosRegalo, mensaje)
      if (puntosRegalo > 0) await fetchClientes()
      setShowCampana(false)
      const puntosMsg = puntosRegalo > 0 ? ` Se acreditaron ${puntosRegalo} pts a cada cliente.` : ''
      alert(`✅ Campaña registrada. ${ids.length} destinatarios.${puntosMsg}\n\nLos mensajes se enviarán cuando configures WhatsApp y/o Email.`)
    } catch (e: any) {
      alert(`Error al registrar campaña: ${e.message}`)
    } finally {
      setEjecutandoCampana(false)
    }
  }

  // ── Switches / config ─────────────────────
  const handleToggleSwitch = async (
    campo: 'auto_15_dias' | 'auto_30_dias',
    valor: boolean
  ) => {
    if (!tenantId || !campanaConfig) return
    const prev = campanaConfig
    const next = { ...campanaConfig, [campo]: valor }
    setCampanaConfig(next)
    setSavingConfig(true)
    try {
      await upsertCampanaConfig(next)
    } catch (e: any) {
      setCampanaConfig(prev)
      alert(`Error al guardar configuración: ${e.message}`)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleGuardarTemplate = async (
    campo: keyof CampanaConfig,
    valor: string | number
  ) => {
    if (!tenantId || !campanaConfig) return
    const next = { ...campanaConfig, [campo]: valor }
    setCampanaConfig(next)
    setSavingConfig(true)
    try {
      await upsertCampanaConfig(next)
    } catch (e: any) {
      alert(`Error al guardar template: ${e.message}`)
    } finally {
      setSavingConfig(false)
    }
  }

  // ── Drawer ────────────────────────────────
  const handleAbrirDrawer = (cliente: ClienteConVisita) => setDrawerCliente(cliente)
  const handleCerrarDrawer = () => setDrawerCliente(null)

  const handleRegalarPuntosIndividual = async (
    clienteId: string,
    puntos: number,
    descripcion: string
  ) => {
    if (!tenantId) return
    await regalarPuntosIndividual(tenantId, clienteId, puntos, descripcion)
    await fetchClientes()
    // Actualizar drawer si está abierto con ese cliente
    setDrawerCliente((prev) => {
      if (!prev || prev.id !== clienteId) return prev
      return { ...prev, puntos_totales: prev.puntos_totales + puntos }
    })
  }

  // ── Modal crear/editar ───────────────────
  const handleNuevoCliente = () => {
    setEditingCliente(null)
    setFormData(INITIAL_FORM_DATA)
    setShowModal(true)
  }

  const handleEditarCliente = (cliente: ClienteLocal) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre || '',
      ci: cliente.ci || '',
      ruc: (cliente as any).ruc || '',
      pasaporte: (cliente as any).pasaporte || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: (cliente as any).direccion || '',
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    setFormData(INITIAL_FORM_DATA)
  }

  const handleFormChange = (data: ClienteFormData) => setFormData(data)

  const handleGuardar = async () => {
    if (!tenantId) return
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
      await fetchClientes()
    } catch (e: any) {
      alert(`Error: ${e.message || 'Error al guardar cliente'}`)
    } finally {
      setSaving(false)
    }
  }

  return {
    clientes,
    filteredClientes,
    loading,
    segments,
    campanaConfig,
    savingConfig,
    searchTerm,
    setSearchTerm,
    showCampana,
    tipoCampana,
    destinatarios,
    ejecutandoCampana,
    handleAbrirCampana,
    handleCerrarCampana,
    handleRegistrarCampana,
    handleToggleSwitch,
    handleGuardarTemplate,
    drawerCliente,
    handleAbrirDrawer,
    handleCerrarDrawer,
    handleRegalarPuntosIndividual,
    showModal,
    editingCliente,
    formData,
    saving,
    handleNuevoCliente,
    handleEditarCliente,
    handleCloseModal,
    handleFormChange,
    handleGuardar,
    refetch: fetchClientes,
  }
}
