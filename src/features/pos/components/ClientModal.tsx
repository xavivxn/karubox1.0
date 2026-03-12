'use client'

import { useState } from 'react'
import { X, Search, UserPlus, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/contexts/TenantContext'
import type { Cliente } from '@/types/supabase'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ClientModal({ isOpen, onClose }: Props) {
  const { tenant } = useTenant()
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [ci, setCi] = useState('')
  const [ruc, setRuc] = useState('')
  const [pasaporte, setPasaporte] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [searching, setSearching] = useState(false)
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null)
  const [modoCrear, setModoCrear] = useState(false)
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null)
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null)
  const { setCliente } = useCartStore()

  const estaEditando = editingClienteId !== null

  if (!isOpen) return null

  const autocompletarDesdeCliente = (data: Cliente & { ruc?: string; pasaporte?: string }) => {
    setNombre(data.nombre || '')
    setTelefono(data.telefono || '')
    setCi(data.ci || '')
    setRuc(data.ruc || '')
    setEmail(data.email || '')
    setDireccion(data.direccion || '')
    setPasaporte(data.pasaporte || '')
    setClienteEncontrado(data as Cliente)
    setModoCrear(false)
  }

  const buscarCliente = async () => {
    const tieneNombre = nombre.trim().length > 0
    const tieneTelefono = telefono.trim().length > 0
    const tieneCi = ci.trim().length > 0
    const tieneRuc = ruc.trim().length > 0
    if ((!tieneNombre && !tieneTelefono && !tieneCi && !tieneRuc) || !tenant) return

    const supabase = createClient()
    setSearching(true)
    setClienteEncontrado(null)
    setModoCrear(false)
    try {
      // Búsqueda exacta por teléfono, CI o RUC (prioridad)
      if (tieneTelefono || tieneCi || tieneRuc) {
        let query = supabase
          .from('clientes')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)

        if (tieneTelefono) query = query.eq('telefono', telefono.trim())
        else if (tieneCi) query = query.eq('ci', ci.trim())
        else if (tieneRuc) query = query.eq('ruc', ruc.trim())

        const { data, error } = await query.single()

        if (!error && data) {
          autocompletarDesdeCliente(data as Cliente & { ruc?: string; pasaporte?: string })
          setSearching(false)
          return
        }
      }

      // Búsqueda por nombre y apellido (ilike)
      if (tieneNombre) {
        const { data: datos, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .ilike('nombre', `%${nombre.trim()}%`)
          .limit(5)

        if (!error && datos && datos.length > 0) {
          // Tomar el primero y autocompletar todos los campos
          autocompletarDesdeCliente(datos[0] as Cliente & { ruc?: string; pasaporte?: string })
          setSearching(false)
          return
        }
      }

      setClienteEncontrado(null)
      setModoCrear(true)
    } catch (error) {
      console.error('Error buscando cliente:', error)
      alert('Error al buscar cliente')
    } finally {
      setSearching(false)
    }
  }

  const crearCliente = async () => {
    if ((!telefono.trim() && !ci.trim() && !ruc.trim()) || !nombre.trim()) {
      alert('Por favor completa nombre y al menos teléfono, CI o RUC')
      return
    }

    if (!tenant) {
      alert('Error: No se pudo obtener información del tenant')
      return
    }

    setSearching(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          tenant_id: tenant.id,
          telefono: telefono.trim() || null,
          ci: ci.trim() || null,
          ruc: ruc.trim() || null,
          pasaporte: pasaporte.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          nombre: nombre.trim(),
          puntos_totales: 0
        })
        .select()
        .single()

      if (error) throw error

      setCliente(data as Cliente)
      handleClose()
    } catch (error: any) {
      console.error('Error creando cliente:', error)
      alert(`Error al crear cliente: ${error.message || 'Error desconocido'}`)
    } finally {
      setSearching(false)
    }
  }

  const seleccionarCliente = () => {
    if (clienteEncontrado) {
      setCliente(clienteEncontrado)
      handleClose()
    }
  }

  const iniciarEdicion = () => {
    if (clienteEncontrado) {
      setClienteEnEdicion(clienteEncontrado)
      setEditingClienteId(clienteEncontrado.id)
      setClienteEncontrado(null)
    }
  }

  const cancelarEdicion = () => {
    if (clienteEnEdicion) {
      autocompletarDesdeCliente(clienteEnEdicion as Cliente & { ruc?: string; pasaporte?: string })
    }
    setClienteEnEdicion(null)
    setEditingClienteId(null)
  }

  const guardarCambiosCliente = async () => {
    if (!editingClienteId || !tenant) return
    if (!nombre.trim()) {
      alert('El nombre es requerido')
      return
    }

    setSearching(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clientes')
        .update({
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          ci: ci.trim() || null,
          ruc: ruc.trim() || null,
          pasaporte: pasaporte.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
        })
        .eq('id', editingClienteId)
        .eq('tenant_id', tenant.id)
        .select()
        .single()

      if (error) throw error

      setCliente(data as Cliente)
      handleClose()
    } catch (error: any) {
      console.error('Error actualizando cliente:', error)
      alert(`Error al guardar: ${error.message || 'Error desconocido'}`)
    } finally {
      setSearching(false)
    }
  }

  const handleClose = () => {
    setTelefono('')
    setNombre('')
    setCi('')
    setRuc('')
    setPasaporte('')
    setEmail('')
    setDireccion('')
    setClienteEncontrado(null)
    setClienteEnEdicion(null)
    setEditingClienteId(null)
    setModoCrear(false)
    onClose()
  }

  const continuarSinCliente = () => {
    setCliente(null)
    handleClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Buscar o Crear Cliente</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all"
          >
            <X size={22} className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Formulario: búsqueda/crear o editar cliente encontrado */}
          {(!clienteEncontrado || estaEditando) && (
            <>
              {/* Nombre - Siempre visible */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (nombre.trim() || telefono.trim() || ci.trim() || ruc.trim()) && buscarCliente()}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-base"
                  disabled={searching}
                />
              </div>

              {/* Teléfono, CI, RUC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (nombre.trim() || telefono.trim() || ci.trim() || ruc.trim()) && buscarCliente()}
                    placeholder="(0981) 123-456"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-base"
                    disabled={searching}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    CI (Cédula)
                  </label>
                  <input
                    type="text"
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (nombre.trim() || telefono.trim() || ci.trim() || ruc.trim()) && buscarCliente()}
                    placeholder="1234567"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-base"
                    disabled={searching}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  RUC <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (nombre.trim() || telefono.trim() || ci.trim() || ruc.trim()) && buscarCliente()}
                  placeholder="80012345-6"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-base"
                  disabled={searching}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-base"
                  disabled={searching}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Dirección <span className="text-gray-500 font-normal">(opcional, para factura)</span>
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Principal 123"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-base"
                  disabled={searching}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Pasaporte <span className="text-gray-500 font-normal">(extranjeros, opcional)</span>
                </label>
                <input
                  type="text"
                  value={pasaporte}
                  onChange={(e) => setPasaporte(e.target.value)}
                  placeholder="AB123456"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-base"
                  disabled={searching}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col gap-3 pt-2">
                {estaEditando ? (
                  <div className="flex gap-3">
                    <button
                      onClick={guardarCambiosCliente}
                      disabled={searching || !nombre.trim()}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {searching ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      disabled={searching}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={buscarCliente}
                      disabled={searching || (!nombre.trim() && !telefono.trim() && !ci.trim() && !ruc.trim())}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <Search size={18} />
                      {searching ? 'Buscando...' : 'Buscar Cliente'}
                    </button>
                    {!modoCrear && (
                      <button
                        onClick={() => {
                          if (!nombre.trim()) {
                            alert('Por favor ingresa el nombre del cliente')
                            return
                          }
                          if (!telefono.trim() && !ci.trim() && !ruc.trim()) {
                            alert('Por favor ingresa teléfono, CI o RUC')
                            return
                          }
                          crearCliente()
                        }}
                        disabled={searching || !nombre.trim() || (!telefono.trim() && !ci.trim() && !ruc.trim())}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                      >
                        <UserPlus size={18} />
                        {searching ? 'Creando...' : 'Crear Nuevo'}
                      </button>
                    )}
                  </div>
                )}
                {estaEditando && (
                  <p className="text-sm text-gray-500 text-center">Editando datos del cliente. Guarda o cancela.</p>
                )}
              </div>
            </>
          )}

          {/* Resultado: Cliente encontrado */}
          {clienteEncontrado && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
                <h3 className="font-bold text-lg text-green-900">Cliente Encontrado</h3>
              </div>
              
              <div className="bg-white rounded-lg p-4 space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-medium min-w-[80px]">Nombre:</span>
                  <span className="text-gray-900 font-semibold">{clienteEncontrado.nombre}</span>
                </div>
                {clienteEncontrado.telefono && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium min-w-[80px]">Teléfono:</span>
                    <span className="text-gray-900">{clienteEncontrado.telefono}</span>
                  </div>
                )}
                {clienteEncontrado.ci && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium min-w-[80px]">CI:</span>
                    <span className="text-gray-900">{clienteEncontrado.ci}</span>
                  </div>
                )}
                {(clienteEncontrado as { ruc?: string }).ruc && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium min-w-[80px]">RUC:</span>
                    <span className="text-gray-900">{(clienteEncontrado as { ruc?: string }).ruc}</span>
                  </div>
                )}
                {clienteEncontrado.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium min-w-[80px]">Email:</span>
                    <span className="text-gray-900">{clienteEncontrado.email}</span>
                  </div>
                )}
                {clienteEncontrado.direccion && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium min-w-[80px]">Dirección:</span>
                    <span className="text-gray-900">{clienteEncontrado.direccion}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <span className="text-blue-600 font-semibold text-lg">
                    ⭐ {clienteEncontrado.puntos_totales} puntos
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={iniciarEdicion}
                  className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Pencil size={18} />
                  Editar
                </button>
                <button
                  onClick={seleccionarCliente}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  ✓ Seleccionar este Cliente
                </button>
              </div>
            </div>
          )}

          {/* Modo crear: cuando se busca y no se encuentra */}
          {modoCrear && clienteEncontrado === null && (
            <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={20} className="text-blue-600" />
                <span className="font-semibold text-blue-900">Cliente no encontrado</span>
              </div>
              <p className="text-sm text-blue-800 mb-4">
                No se encontró un cliente con esos datos. Puedes crear uno nuevo completando los campos arriba.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">O</span>
            </div>
          </div>

          {/* Continuar sin cliente */}
          <button
            onClick={continuarSinCliente}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all border-2 border-gray-300 hover:border-gray-400"
          >
            Continuar sin cliente
          </button>
        </div>
      </div>
    </div>
  )
}


