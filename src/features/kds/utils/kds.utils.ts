/**
 * KDS Module - Utility Functions
 * Funciones auxiliares para el KDS
 */

import type { EstadoPedidoKDS } from '../types/kds.types'
import { TIEMPO_URGENTE_MINUTOS } from '../constants/kds.constants'

/**
 * Formatea la hora actual en formato HH:MM
 */
export const formatearHoraActual = (): string => {
  return new Date().toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formatea una hora específica en formato HH:MM
 */
export const formatearHora = (fecha: Date | string): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return date.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calcula los minutos transcurridos desde una hora
 */
export const calcularMinutosTranscurridos = (horaCreacion: Date | string): number => {
  const ahora = new Date()
  const fecha = typeof horaCreacion === 'string' ? new Date(horaCreacion) : horaCreacion
  const diferencia = ahora.getTime() - fecha.getTime()
  return Math.floor(diferencia / 60000)
}

/**
 * Determina si un pedido debe marcarse como urgente
 */
export const esUrgente = (minutosTranscurridos: number): boolean => {
  return minutosTranscurridos > TIEMPO_URGENTE_MINUTOS
}

/**
 * Calcula el estado de un pedido basado en el tiempo transcurrido
 */
export const calcularEstadoAutomatico = (
  estadoActual: EstadoPedidoKDS,
  minutosTranscurridos: number
): EstadoPedidoKDS => {
  if (estadoActual === 'listo') return 'listo'
  
  if (esUrgente(minutosTranscurridos)) {
    return 'urgente'
  }
  
  return estadoActual
}
