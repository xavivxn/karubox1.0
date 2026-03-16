'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, UserPlus, Pencil, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/contexts/TenantContext'
import { normalizarParaBusqueda } from '@/features/clientes/utils/clientes.utils'
import type { Cliente } from '@/types/supabase'

const DEBOUNCE_MS = 320
const MIN_NOMBRE_LENGTH = 2
const MIN_CI_LENGTH = 1
const SUGERENCIAS_LIMIT = 8
const CACHE_CLIENTES_LIMIT = 500

interface Props {
  isOpen: boolean
  onClose: () => void
  darkMode?: boolean
}

export default function ClientModal({ isOpen, onClose, darkMode }: Props) {
  const { tenant } = useTenant()
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [ci, setCi] = useState('')
  const [ruc, setRuc] = useState('')
  const [pasaporte, setPasaporte] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [searching, setSearching] = useState(false)
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null)
  const [sugerencias, setSugerencias] = useState<Cliente[]>([])
  const [clientesCache, setClientesCache] = useState<Cliente[] | null>(null)
  const [modoCrear, setModoCrear] = useState(false)
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null)
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { setCliente } = useCartStore()

  // Cargar clientes del tenant al abrir el modal (para filtrar sin tildes en cliente)
  useEffect(() => {
    if (!isOpen || !tenant) {
      setClientesCache(null)
      return
    }
    const supabase = createClient()
    supabase
      .from('clientes')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_deleted', false)
      .order('nombre')
      .limit(CACHE_CLIENTES_LIMIT)
      .then(({ data, error }) => {
        if (!error && data) setClientesCache(data as Cliente[])
        else setClientesCache([])
      })
  }, [isOpen, tenant?.id])

  const estaEditando = editingClienteId !== null

  const autocompletarDesdeCliente = useCallback((data: Cliente & { ruc?: string; pasaporte?: string; fecha_nacimiento?: string | null }) => {
    setNombre(data.nombre || '')
    setTelefono(data.telefono || '')
    setCi(data.ci || '')
    setRuc(data.ruc || '')
    setEmail(data.email || '')
    setDireccion(data.direccion || '')
    setPasaporte(data.pasaporte || '')
    setFechaNacimiento(data.fecha_nacimiento ?? '')
    setClienteEncontrado(data as Cliente)
    setSugerencias([])
    setModoCrear(false)
  }, [])

  // Búsqueda en tiempo real por nombre o CI (debounced), ignorando tildes
  useEffect(() => {
    if (!isOpen || !tenant || estaEditando) {
      setSugerencias([])
      return
    }

    const nombreTrim = nombre.trim()
    const ciTrim = ci.trim()
    const tieneNombre = nombreTrim.length >= MIN_NOMBRE_LENGTH
    const tieneCi = ciTrim.length >= MIN_CI_LENGTH

    if (!tieneNombre && !tieneCi) {
      setSugerencias([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      setSearching(true)
      setSugerencias([])

      if (clientesCache === null) {
        setSearching(false)
        return
      }

      const nombreNorm = normalizarParaBusqueda(nombreTrim)
      const ciNorm = normalizarParaBusqueda(ciTrim)

      const filtrados = clientesCache.filter((c) => {
        const matchNombre = tieneNombre && normalizarParaBusqueda(c.nombre ?? '').includes(nombreNorm)
        const matchCi = tieneCi && c.ci != null && normalizarParaBusqueda(c.ci).includes(ciNorm)
        return matchNombre || matchCi
      })

      setSugerencias(filtrados.slice(0, SUGERENCIAS_LIMIT))
      setSearching(false)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [isOpen, tenant?.id, nombre, ci, estaEditando, clientesCache])

  if (!isOpen) return null

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

      // Búsqueda por nombre (ignorando tildes: desde cache o ilike)
      if (tieneNombre) {
        const nombreNorm = normalizarParaBusqueda(nombre.trim())
        const desdeCache = clientesCache?.find((c) =>
          normalizarParaBusqueda(c.nombre ?? '').includes(nombreNorm)
        )
        if (desdeCache) {
          autocompletarDesdeCliente(desdeCache as Cliente & { ruc?: string; pasaporte?: string })
          setSearching(false)
          return
        }
        const { data: datos, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .ilike('nombre', `%${nombre.trim()}%`)
          .limit(5)

        if (!error && datos && datos.length > 0) {
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
          fecha_nacimiento: fechaNacimiento.trim() || null,
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
          fecha_nacimiento: fechaNacimiento.trim() || null,
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
    setFechaNacimiento('')
    setClienteEncontrado(null)
    setSugerencias([])
    setClienteEnEdicion(null)
    setEditingClienteId(null)
    setModoCrear(false)
    onClose()
  }

  const seleccionarSugerencia = (c: Cliente) => {
    autocompletarDesdeCliente(c as Cliente & { ruc?: string; pasaporte?: string })
  }

  const continuarSinCliente = () => {
    setCliente(null)
    handleClose()
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${darkMode ? 'bg-black/70' : 'bg-black/60'}`}>
      <div className={`flex max-h-[90vh] max-w-lg w-full flex-col overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex flex-shrink-0 items-center justify-between rounded-t-2xl border-b-2 p-6 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
              <span className="text-xl text-white">👤</span>
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Buscar o Crear Cliente</h2>
          </div>
          <button
            onClick={handleClose}
            className={`rounded-full p-2 transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-white hover:shadow-md'}`}
          >
            <X size={22} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Formulario: búsqueda/crear o editar cliente encontrado */}
          {(!clienteEncontrado || estaEditando) && (
            <>
              <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Escribe nombre o cédula y se mostrarán los clientes del tenant. Elige uno de la lista o crea uno nuevo.
              </p>
              {/* Nombre - Siempre visible */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (nombre.trim() || telefono.trim() || ci.trim() || ruc.trim()) && buscarCliente()}
                  placeholder="Ej: Juan Pérez"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
                  disabled={searching}
                />
              </div>

              {/* Teléfono, CI, RUC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (nombre.trim() || telefono.trim() || ci.trim() || ruc.trim()) && buscarCliente()}
                    placeholder="(0981) 123-456"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
                    disabled={searching}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    CI (Cédula)
                  </label>
                  <input
                    type="text"
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (nombre.trim() || telefono.trim() || ci.trim() || ruc.trim()) && buscarCliente()}
                    placeholder="1234567"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
                    disabled={searching}
                  />
                </div>
              </div>

              {/* Fecha de nacimiento (opcional) */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Fecha de nacimiento <span className={darkMode ? 'text-gray-400 font-normal' : 'text-gray-500 font-normal'}>(opcional)</span>
                </label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
                  disabled={searching}
                />
              </div>

              {/* Lista de sugerencias en tiempo real */}
              {sugerencias.length > 0 && (
                <div className={`rounded-xl border-2 overflow-hidden ${darkMode ? 'border-blue-500/40 bg-gray-700/50' : 'border-blue-200 bg-blue-50/50'}`}>
                  <div className={`px-3 py-2 border-b text-xs font-semibold ${darkMode ? 'border-gray-600 text-blue-300' : 'border-blue-100 text-blue-700'}`}>
                    {searching ? 'Buscando...' : `${sugerencias.length} coincidencia${sugerencias.length !== 1 ? 's' : ''} — haz clic para elegir`}
                  </div>
                  <ul className="max-h-48 overflow-y-auto p-1.5 space-y-1" role="listbox">
                    {sugerencias.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => seleccionarSugerencia(c)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-gray-600/80 text-gray-100' : 'hover:bg-blue-100 text-gray-800'}`}
                          role="option"
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-600/60' : 'bg-blue-100'}`}>
                            <User size={14} className={darkMode ? 'text-blue-200' : 'text-blue-600'} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{c.nombre}</div>
                            <div className={`text-xs flex flex-wrap gap-x-2 gap-y-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {c.telefono && <span>{c.telefono}</span>}
                              {c.ci && <span>CI: {c.ci}</span>}
                              <span className={darkMode ? 'text-amber-400' : 'text-amber-600'}>⭐ {c.puntos_totales}</span>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  RUC <span className={darkMode ? 'text-gray-400 font-normal' : 'text-gray-500 font-normal'}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (nombre.trim() || telefono.trim() || ci.trim() || ruc.trim()) && buscarCliente()}
                  placeholder="80012345-6"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
                  disabled={searching}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Email <span className={darkMode ? 'text-gray-400 font-normal' : 'text-gray-500 font-normal'}>(opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
                  disabled={searching}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Dirección <span className={darkMode ? 'text-gray-400 font-normal' : 'text-gray-500 font-normal'}>(opcional, para factura)</span>
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Principal 123"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
                  disabled={searching}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Pasaporte <span className={darkMode ? 'text-gray-400 font-normal' : 'text-gray-500 font-normal'}>(extranjeros, opcional)</span>
                </label>
                <input
                  type="text"
                  value={pasaporte}
                  onChange={(e) => setPasaporte(e.target.value)}
                  placeholder="AB123456"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}`}
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
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all shadow-md disabled:cursor-not-allowed ${darkMode ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600 disabled:shadow-none' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none'}`}
                    >
                      {searching ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      disabled={searching}
                      className={`rounded-xl px-6 py-3 font-semibold transition-all ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={buscarCliente}
                      disabled={searching || (!nombre.trim() && !telefono.trim() && !ci.trim() && !ruc.trim())}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all shadow-md disabled:cursor-not-allowed ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none'}`}
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
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all shadow-md disabled:cursor-not-allowed ${darkMode ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600 disabled:shadow-none' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none'}`}
                      >
                        <UserPlus size={18} />
                        {searching ? 'Creando...' : 'Crear Nuevo'}
                      </button>
                    )}
                  </div>
                )}
                {estaEditando && (
                  <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Editando datos del cliente. Guarda o cancela.</p>
                )}
              </div>
            </>
          )}

          {/* Resultado: Cliente encontrado */}
          {clienteEncontrado && (
            <div className={`rounded-xl border-2 p-5 shadow-lg ${darkMode ? 'border-green-500/60 bg-gray-700/50' : 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                  <span className="text-lg text-white">✓</span>
                </div>
                <h3 className={`font-bold text-lg ${darkMode ? 'text-green-300' : 'text-green-900'}`}>Cliente Encontrado</h3>
              </div>
              
              <div className={`rounded-lg p-4 space-y-2 mb-4 ${darkMode ? 'bg-gray-700/80' : 'bg-white'}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-medium min-w-[80px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nombre:</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{clienteEncontrado.nombre}</span>
                </div>
                {clienteEncontrado.telefono && (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium min-w-[80px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Teléfono:</span>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{clienteEncontrado.telefono}</span>
                  </div>
                )}
                {clienteEncontrado.ci && (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium min-w-[80px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>CI:</span>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{clienteEncontrado.ci}</span>
                  </div>
                )}
                {(clienteEncontrado as { ruc?: string }).ruc && (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium min-w-[80px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>RUC:</span>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{(clienteEncontrado as { ruc?: string }).ruc}</span>
                  </div>
                )}
                {clienteEncontrado.email && (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium min-w-[80px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email:</span>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{clienteEncontrado.email}</span>
                  </div>
                )}
                {clienteEncontrado.direccion && (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium min-w-[80px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dirección:</span>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{clienteEncontrado.direccion}</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 border-t pt-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <span className={`font-semibold text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    ⭐ {clienteEncontrado.puntos_totales} puntos
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={iniciarEdicion}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all shadow-md hover:shadow-lg bg-amber-500 text-white hover:bg-amber-600"
                >
                  <Pencil size={18} />
                  Editar
                </button>
                <button
                  onClick={seleccionarCliente}
                  className="flex-1 rounded-xl px-6 py-3 font-bold text-lg transition-all shadow-lg hover:shadow-xl bg-green-600 text-white hover:bg-green-700"
                >
                  ✓ Seleccionar este Cliente
                </button>
              </div>
            </div>
          )}

          {/* Modo crear: cuando se busca y no se encuentra */}
          {modoCrear && clienteEncontrado === null && (
            <div className={`rounded-xl border-2 p-4 ${darkMode ? 'border-blue-500/60 bg-blue-900/20' : 'border-blue-400 bg-blue-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={20} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                <span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Cliente no encontrado</span>
              </div>
              <p className={`text-sm mb-4 ${darkMode ? 'text-blue-200/90' : 'text-blue-800'}`}>
                No se encontró un cliente con esos datos. Puedes crear uno nuevo completando los campos arriba.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 font-medium ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>O</span>
            </div>
          </div>

          {/* Continuar sin cliente */}
          <button
            onClick={continuarSinCliente}
            className={`w-full rounded-xl border-2 px-6 py-3 font-semibold transition-all ${darkMode ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 hover:border-gray-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'}`}
          >
            Continuar sin cliente
          </button>
        </div>
      </div>
    </div>
  )
}


