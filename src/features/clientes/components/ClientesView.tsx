/**
 * Clientes Module - Main View Component
 * Componente principal de gestión de clientes
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useClientes } from '../hooks/useClientes'
import { ClientesHeader } from './ClientesHeader'
import { ClientesSearch } from './ClientesSearch'
import { ClientesTable } from './ClientesTable'
import { ClienteModal } from './ClienteModal'

export const ClientesView = () => {
  const { tenant, loading: tenantLoading } = useTenant()
  
  const {
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
    handleGuardar
  } = useClientes(tenant?.id)

  // Mostrar loader mientras carga el tenant
  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
      </div>
    )
  }

  // Si no hay tenant, no renderizar nada (el middleware debería redirigir)
  if (!tenant) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-x-hidden">
      <div className="w-full min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <ClientesHeader
          tenantName={tenant.nombre}
          onNuevoCliente={handleNuevoCliente}
        />

        {/* Búsqueda */}
        <ClientesSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          onClear={handleClearSearch}
        />

        {/* Tabla de Clientes */}
        <ClientesTable
          clientes={clientes}
          loading={loading}
          searchTerm={searchTerm}
          onEdit={handleEditarCliente}
          tenantNombre={tenant?.nombre}
        />

        {/* Modal de Crear/Editar Cliente */}
        <ClienteModal
          showModal={showModal}
          editingCliente={editingCliente}
          formData={formData}
          saving={saving}
          onClose={handleCloseModal}
          onSave={handleGuardar}
          onFormChange={handleFormChange}
        />
      </div>
    </div>
  )
}
