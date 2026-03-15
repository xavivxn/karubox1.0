/**
 * Panel de Clientes - Vista principal (Admin)
 * Integra: segmentos, campañas, switches de automatización, tabla enriquecida,
 * drawer de detalle y modal de crear/editar cliente
 */

'use client'

import { UserPlus, Send, Users, BellOff, Bell, Loader2, Search, X as XIcon } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { useClientesPanel } from '../hooks/useClientesPanel'
import { SegmentCards } from './SegmentCards'
import { CampanaModal } from './CampanaModal'
import { ClienteDetailDrawer } from './ClienteDetailDrawer'
import { ClientesTableRich } from './ClientesTableRich'
import { ClienteModal } from './ClienteModal'
import type { TipoCampana } from '../types/clientes.types'

export const ClientesPanelView = () => {
  const { tenant, loading: tenantLoading } = useTenant()

  const {
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
  } = useClientesPanel(tenant?.id)

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 dark:text-orange-400" />
      </div>
    )
  }

  if (!tenant) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Clientes
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm sm:text-base">
                {tenant.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={handleNuevoCliente}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold shadow-sm dark:shadow-black/20 hover:shadow-md dark:hover:shadow-black/30"
          >
            <UserPlus size={18} />
            Nuevo Cliente
          </button>
        </header>

        {/* ── Tarjetas de segmentos ── */}
        <SegmentCards segments={segments} loading={loading} />

        {/* ── Panel de Campañas ── */}
        <section className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-6 sm:p-6 space-y-5">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Send size={18} className="text-orange-500 dark:text-orange-400" />
            Campañas de fidelización
          </h2>

          {/* Botones de campaña */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CampanaButton
              label="Inactivos +15 días"
              count={segments.enRiesgo.length + segments.inactivos.length}
              emoji="⏰"
              colorCls="border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-200"
              countCls="bg-amber-100 dark:bg-amber-800/60 text-amber-700 dark:text-amber-300"
              onClick={() => handleAbrirCampana('inactivos_15')}
            />
            <CampanaButton
              label="Inactivos +30 días"
              count={segments.inactivos.length}
              emoji="😴"
              colorCls="border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-800 dark:text-red-200"
              countCls="bg-red-100 dark:bg-red-800/60 text-red-700 dark:text-red-300"
              onClick={() => handleAbrirCampana('inactivos_30')}
            />
            <CampanaButton
              label="Mensaje a todos"
              count={segments.total}
              emoji="📣"
              colorCls="border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-800 dark:text-blue-200"
              countCls="bg-blue-100 dark:bg-blue-800/60 text-blue-700 dark:text-blue-300"
              onClick={() => handleAbrirCampana('personalizado')}
            />
          </div>

          {/* Switches de automatización */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Envíos automáticos
            </p>
            <div className="space-y-3">
              <AutoSwitch
                label="Notificar clientes inactivos cada 15 días"
                description="Envía un mensaje cuando WhatsApp/Email esté configurado"
                enabled={campanaConfig?.auto_15_dias ?? false}
                loading={savingConfig}
                onChange={(v) => handleToggleSwitch('auto_15_dias', v)}
              />
              <AutoSwitch
                label="Notificar clientes inactivos cada 30 días"
                description="Envía un recordatorio mensual a quienes dejaron de venir"
                enabled={campanaConfig?.auto_30_dias ?? false}
                loading={savingConfig}
                onChange={(v) => handleToggleSwitch('auto_30_dias', v)}
              />
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1.5">
              <span className="mt-0.5">ℹ️</span>
              Los mensajes automáticos se activarán cuando configures WhatsApp y/o Email.
            </p>
          </div>
        </section>

        {/* ── Búsqueda ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, teléfono, CI o email..."
              className="w-full pl-9 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 focus:border-transparent transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XIcon size={15} />
              </button>
            )}
          </div>
          <div className="flex-shrink-0 flex items-center justify-center sm:justify-start gap-1.5 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5">
            <Users size={15} />
            <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredClientes.length}</span>
            clientes
          </div>
        </div>

        {/* ── Tabla enriquecida ── */}
        <ClientesTableRich
          clientes={filteredClientes}
          loading={loading}
          searchTerm={searchTerm}
          onRowClick={handleAbrirDrawer}
          onEdit={handleEditarCliente}
        />
      </div>

      {/* ── Modals & Drawer ── */}
      <CampanaModal
        isOpen={showCampana}
        tipo={tipoCampana}
        destinatarios={destinatarios}
        campanaConfig={campanaConfig}
        tenantNombre={tenant.nombre}
        ejecutando={ejecutandoCampana}
        onClose={handleCerrarCampana}
        onConfirm={handleRegistrarCampana}
      />

      <ClienteDetailDrawer
        cliente={drawerCliente}
        isOpen={!!drawerCliente}
        onClose={handleCerrarDrawer}
        onEdit={handleEditarCliente}
        onRegalarPuntos={handleRegalarPuntosIndividual}
      />

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
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CampanaButton({
  label,
  count,
  emoji,
  colorCls,
  countCls,
  onClick,
}: {
  label: string
  count: number
  emoji: string
  colorCls: string
  countCls: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3.5 border-2 rounded-xl font-semibold transition-colors ${colorCls}`}
    >
      <span className="flex items-center gap-2">
        <span>{emoji}</span>
        {label}
      </span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${countCls}`}>
        {count}
      </span>
    </button>
  )
}

function AutoSwitch({
  label,
  description,
  enabled,
  loading,
  onChange,
}: {
  label: string
  description: string
  enabled: boolean
  loading: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <button
        onClick={() => onChange(!enabled)}
        disabled={loading}
        className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
          enabled ? 'bg-orange-500 dark:bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
        }`}
        aria-checked={enabled}
        role="switch"
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-gray-100 shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {enabled ? (
            <Bell size={14} className="text-orange-500 dark:text-orange-400 flex-shrink-0" />
          ) : (
            <BellOff size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
          <p className={`text-sm font-semibold ${enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {label}
          </p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
