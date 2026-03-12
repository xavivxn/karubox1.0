/**
 * Clientes Module - Type Definitions
 * Tipos para el módulo de gestión de clientes
 */

import type { Cliente } from '@/types/supabase'

/**
 * Cliente extendido con campos opcionales de base de datos
 */
export type ClienteLocal = Cliente & {
  tenant_id?: string
  created_at?: string
  ci?: string
}

/**
 * Datos del formulario de cliente (receptor en factura)
 */
export interface ClienteFormData {
  nombre: string
  ci: string
  ruc: string
  pasaporte: string
  telefono: string
  email: string
  direccion: string
}

/**
 * Estado inicial del formulario vacío
 */
export const INITIAL_FORM_DATA: ClienteFormData = {
  nombre: '',
  ci: '',
  ruc: '',
  pasaporte: '',
  telefono: '',
  email: '',
  direccion: ''
}

/**
 * Props del modal de cliente
 */
export interface ClienteModalProps {
  showModal: boolean
  editingCliente: ClienteLocal | null
  formData: ClienteFormData
  saving: boolean
  onClose: () => void
  onSave: () => Promise<void>
  onFormChange: (data: ClienteFormData) => void
}

/**
 * Props de la tabla de clientes
 */
export interface ClientesTableProps {
  clientes: ClienteLocal[]
  loading: boolean
  searchTerm: string
  onEdit: (cliente: ClienteLocal) => void
}
