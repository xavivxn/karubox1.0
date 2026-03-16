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
  fecha_nacimiento?: string | null
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
  fecha_nacimiento: string
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
  direccion: '',
  fecha_nacimiento: ''
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

// ============================================
// PANEL DE FIDELIZACIÓN
// ============================================

/**
 * Cliente enriquecido con datos de visita calculados
 */
export type ClienteConVisita = ClienteLocal & {
  ultima_visita: string | null
  total_pedidos: number
  total_gastado: number
  dias_sin_visita: number | null
  fecha_nacimiento?: string | null
}

/**
 * Segmento de cliente según inactividad
 */
export type SegmentoCliente = 'activo' | 'en_riesgo' | 'inactivo' | 'sin_visita'

/**
 * Tipo de campaña de fidelización
 */
export type TipoCampana = 'inactivos_15' | 'inactivos_30' | 'personalizado' | 'cumpleanos'

/**
 * Configuración de campañas por tenant
 */
export interface CampanaConfig {
  id?: string
  tenant_id: string
  auto_15_dias: boolean
  auto_30_dias: boolean
  auto_cumpleanos?: boolean
  template_wa_15dias: string
  template_wa_30dias: string
  template_wa_personalizado: string
  template_wa_cumpleanos?: string
  puntos_regalo_15dias: number
  puntos_regalo_30dias: number
  puntos_regalo_personalizado: number
  puntos_regalo_cumpleanos?: number
}

/**
 * Segmentos calculados del listado de clientes
 */
export interface Segmentos {
  total: number
  activos: ClienteConVisita[]
  enRiesgo: ClienteConVisita[]
  inactivos: ClienteConVisita[]
}

/**
 * Determina el segmento de un cliente según días sin visita
 */
export function getSegmento(diasSinVisita: number | null): SegmentoCliente {
  if (diasSinVisita === null) return 'sin_visita'
  if (diasSinVisita < 15) return 'activo'
  if (diasSinVisita < 30) return 'en_riesgo'
  return 'inactivo'
}

/**
 * Templates por defecto para WhatsApp
 */
export const DEFAULT_TEMPLATES = {
  wa_15dias: `Hola {{nombre_cliente}} 👋

En {{nombre_lomiteria}} te extrañamos. Hace {{dias_inactivo}} días que no pasás por acá.

Tenés *{{puntos}} puntos* esperándote. Para que vuelvas con más ganas, te regalamos *{{puntos_regalo}} puntos* si venís esta semana.

¿Cuándo nos visitás? 🍔`,

  wa_30dias: `Hola {{nombre_cliente}} 👋

Hace {{dias_inactivo}} días que no te vemos en {{nombre_lomiteria}}. ¡Queremos que vuelvas!

Tu saldo: *{{puntos}} puntos*. Como regalo por ser parte de nosotros, te acreditamos *{{puntos_regalo}} puntos* solo por pasar esta quincena.

Te esperamos 🧡`,

  wa_personalizado: `Hola {{nombre_cliente}} 👋

{{mensaje_personalizado}}

Tu saldo actual: *{{puntos}} puntos*.

— {{nombre_lomiteria}}`,

  wa_cumpleanos: `¡Feliz cumpleaños, {{nombre_cliente}}! 🎂

Desde {{nombre_lomiteria}} te deseamos un día increíble. Como regalo, te acreditamos *{{puntos_regalo}} puntos* para que los uses cuando quieras.

Tu saldo actual: *{{puntos}} puntos*.

¡Que lo disfrutes! 🧡`,
}
