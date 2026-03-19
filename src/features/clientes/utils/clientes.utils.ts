/**
 * Clientes Module - Utility Functions
 * Funciones auxiliares para el módulo de clientes
 */

import type { ClienteFormData, NivelCliente, NivelUmbral } from '../types/clientes.types'
import { NIVELES_DEFAULT } from '../types/clientes.types'

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
 * Resultado de getNivel: nivel actual y datos para "próximo nivel".
 */
export interface NivelInfo {
  nivel: NivelCliente
  nombre: string
  orden: number
  gastoParaProximo: number | null
  nombreProximo: string | null
}

/**
 * Obtiene el nivel VIP del cliente según su gasto total acumulado.
 * Usa umbrales por defecto si no se pasa config.
 */
export function getNivel(totalGastado: number, umbrales: NivelUmbral[] = NIVELES_DEFAULT): NivelInfo {
  const sorted = [...umbrales].sort((a, b) => b.gastoMinimo - a.gastoMinimo)
  for (const u of sorted) {
    if (totalGastado >= u.gastoMinimo) {
      const next = sorted.find((x) => x.orden === u.orden + 1)
      return {
        nivel: u.nivel,
        nombre: u.nombre,
        orden: u.orden,
        gastoParaProximo: next ? next.gastoMinimo - totalGastado : null,
        nombreProximo: next ? next.nombre : null,
      }
    }
  }

  const first = sorted[sorted.length - 1]
  return {
    nivel: first.nivel,
    nombre: first.nombre,
    orden: first.orden,
    gastoParaProximo: null,
    nombreProximo: null,
  }
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
