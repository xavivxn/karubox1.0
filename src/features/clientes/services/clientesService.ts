/**
 * Clientes Module - Data Service
 * Servicios para gestionar clientes (CRUD + búsqueda)
 */

import {
  getClientesPorTenant,
  buscarClientes,
  crearCliente as crearClienteDB,
  actualizarCliente as actualizarClienteDB
} from '@/lib/db/clientes'
import type { Cliente, NuevoCliente } from '@/types/supabase'
import type { ClienteLocal, ClienteFormData } from '../types/clientes.types'
import { limpiarFormData } from '../utils/clientes.utils'

/**
 * Carga todos los clientes de un tenant
 */
export const loadClientes = async (tenantId: string): Promise<ClienteLocal[]> => {
  const data = await getClientesPorTenant(tenantId)
  return (data || []) as ClienteLocal[]
}

/**
 * Busca clientes por término de búsqueda
 */
export const searchClientes = async (
  searchTerm: string,
  tenantId: string
): Promise<ClienteLocal[]> => {
  if (!searchTerm.trim()) {
    return loadClientes(tenantId)
  }

  const resultados = await buscarClientes(searchTerm.trim(), tenantId)
  return (resultados || []) as ClienteLocal[]
}

/**
 * Crea un nuevo cliente
 */
export const crearCliente = async (
  formData: ClienteFormData,
  tenantId: string
): Promise<void> => {
  const datosLimpios = limpiarFormData(formData)

  await crearClienteDB({
    tenant_id: tenantId,
    nombre: datosLimpios.nombre,
    ci: datosLimpios.ci,
    ruc: datosLimpios.ruc,
    pasaporte: datosLimpios.pasaporte,
    telefono: datosLimpios.telefono,
    email: datosLimpios.email,
    direccion: datosLimpios.direccion,
    puntos_totales: 0
  } as NuevoCliente)
}

/**
 * Actualiza un cliente existente
 */
export const actualizarCliente = async (
  clienteId: string,
  formData: ClienteFormData
): Promise<void> => {
  const datosLimpios = limpiarFormData(formData)

  await actualizarClienteDB(clienteId, {
    nombre: datosLimpios.nombre,
    ci: datosLimpios.ci,
    ruc: datosLimpios.ruc,
    pasaporte: datosLimpios.pasaporte,
    telefono: datosLimpios.telefono,
    email: datosLimpios.email,
    direccion: datosLimpios.direccion,
  } as Partial<Cliente>)
}
