'use client'

import { useState } from 'react'
import { X, Search, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCartStore, Cliente } from '@/store/cartStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ClientModal({ isOpen, onClose }: Props) {
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState('')
  const [searching, setSearching] = useState(false)
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null)
  const [modoCrear, setModoCrear] = useState(false)
  const { setCliente } = useCartStore()

  if (!isOpen) return null

  const buscarCliente = async () => {
    if (!telefono.trim()) return
    
    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefono', telefono)
        .eq('activo', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró el cliente
          setClienteEncontrado(null)
          setModoCrear(true)
        } else {
          throw error
        }
      } else {
        setClienteEncontrado(data as Cliente)
        setNombre(data.nombre)
        setModoCrear(false)
      }
    } catch (error) {
      console.error('Error buscando cliente:', error)
      alert('Error al buscar cliente')
    } finally {
      setSearching(false)
    }
  }

  const crearCliente = async () => {
    if (!telefono.trim() || !nombre.trim()) {
      alert('Por favor completa teléfono y nombre')
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          telefono: telefono.trim(),
          nombre: nombre.trim(),
          puntos_totales: 0
        })
        .select()
        .single()

      if (error) throw error

      setCliente(data as Cliente)
      handleClose()
    } catch (error) {
      console.error('Error creando cliente:', error)
      alert('Error al crear cliente')
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

  const handleClose = () => {
    setTelefono('')
    setNombre('')
    setClienteEncontrado(null)
    setModoCrear(false)
    onClose()
  }

  const continuarSinCliente = () => {
    setCliente(null)
    handleClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">👤 Cliente</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Teléfono
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarCliente()}
                placeholder="099123456"
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={searching}
              />
              <button
                onClick={buscarCliente}
                disabled={searching || !telefono.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* Resultado de búsqueda */}
          {clienteEncontrado && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <div className="font-semibold text-lg text-green-900">
                ✅ Cliente encontrado
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-gray-900"><strong>Nombre:</strong> {clienteEncontrado.nombre}</div>
                <div className="text-gray-900"><strong>Teléfono:</strong> {clienteEncontrado.telefono}</div>
                <div className="text-blue-600 font-semibold">
                  ⭐ {clienteEncontrado.puntos_totales} puntos acumulados
                </div>
              </div>
              <button
                onClick={seleccionarCliente}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Seleccionar Cliente
              </button>
            </div>
          )}

          {/* Crear nuevo cliente */}
          {modoCrear && (
            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={20} className="text-blue-600" />
                <div className="font-semibold text-blue-900">
                  Cliente no encontrado - Crear nuevo
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={crearCliente}
                  disabled={searching || !nombre.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {searching ? 'Creando...' : 'Crear Cliente'}
                </button>
              </div>
            </div>
          )}

          {/* Continuar sin cliente */}
          <button
            onClick={continuarSinCliente}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Continuar sin cliente
          </button>
        </div>
      </div>
    </div>
  )
}


