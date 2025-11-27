/**
 * Clientes Module - Main Exports
 * Punto de entrada principal del módulo clientes
 */

// Components
export { ClientesView } from './components/ClientesView'
export { ClientesHeader } from './components/ClientesHeader'
export { ClientesSearch } from './components/ClientesSearch'
export { ClientesTable } from './components/ClientesTable'
export { ClienteModal } from './components/ClienteModal'
export { ClienteFormFields } from './components/ClienteFormFields'

// Hooks
export { useClientes } from './hooks/useClientes'

// Services
export * from './services/clientesService'

// Types
export type {
  ClienteLocal,
  ClienteFormData,
  ClienteModalProps,
  ClientesTableProps
} from './types/clientes.types'

// Utils
export * from './utils/clientes.utils'
