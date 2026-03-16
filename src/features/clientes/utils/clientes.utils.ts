/**
 * Clientes Module - Utility Functions
 * Funciones auxiliares para el módulo de clientes
 */

import type { ClienteFormData } from '../types/clientes.types'

/**
 * Normaliza un texto para búsqueda: minúsculas y sin tildes/acentos.
 * Así "Iván", "ivan" e "Ivan" coinciden al buscar.
 */
export function normalizarParaBusqueda(texto: string): string {
  if (!texto || typeof texto !== 'string') return ''
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * Formatea una fecha a formato dd/mm/yyyy
 */
export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-PY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Valida los datos del formulario de cliente
 */
export const validarFormulario = (formData: ClienteFormData): { valid: boolean; error?: string } => {
  if (!formData.nombre.trim()) {
    return { valid: false, error: 'El nombre es requerido' }
  }

  if (!formData.telefono.trim() && !formData.ci.trim()) {
    return { valid: false, error: 'Debe ingresar al menos teléfono o CI' }
  }

  return { valid: true }
}

/**
 * Limpia los espacios en blanco de los campos del formulario
 */
export const limpiarFormData = (formData: ClienteFormData) => {
  return {
    nombre: formData.nombre.trim(),
    ci: formData.ci.trim() || null,
    ruc: formData.ruc?.trim() || null,
    pasaporte: formData.pasaporte?.trim() || null,
    telefono: formData.telefono.trim() || null,
    email: formData.email.trim() || null,
    direccion: formData.direccion.trim() || null,
    fecha_nacimiento: formData.fecha_nacimiento?.trim() || null,
  }
}
