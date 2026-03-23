'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, Gift, Search, Plus, Minus, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { FeedbackModal } from '@/components/ui/FeedbackModal'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/contexts/TenantContext'
import type { Cliente } from '@/types/supabase'
import type { Producto } from '../types/pos.types'
import { normalizarParaBusqueda } from '@/features/clientes/utils/clientes.utils'
import { VALOR_PUNTO_GS } from '../utils/pos.utils'
import { formatGuaranies } from '@/lib/utils/format'
import { orderService } from '../services/orderService'
import type { TipoPedido, FeedbackState, FeedbackDetail } from '../types/pos.types'

const DEBOUNCE_MS = 320
const MIN_NOMBRE_LENGTH = 2
const MIN_CI_LENGTH = 1
const MIN_TELEFONO_LENGTH = 3
const SUGERENCIAS_LIMIT = 8
const CACHE_CLIENTES_LIMIT = 500

interface Props {
  open: boolean
  onClose: () => void
  darkMode?: boolean
  productos: Producto[]
}

function getPuntosNecesariosPorProducto(precioGs: number) {
  // 1 punto = 1 Gs de crédito, redondeamos hacia arriba para cubrir el costo del producto.
  if (!precioGs || precioGs <= 0) return 0
  return Math.ceil(precioGs / VALOR_PUNTO_GS)
}

export default function CanjePuntosModal({ open, onClose, darkMode, productos }: Props) {
  const { usuario, tenant } = useTenant()
  const tenantId = tenant?.id

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  // Importante: no dejar ningún tipo pre-seleccionado.
  // El usuario debe elegir explícitamente el tipo de pedido al canjear puntos.
  const [tipoCanje, setTipoCanje] = useState<'delivery' | 'local' | 'para_llevar' | null>(null)

  type CanjeDraftItem = {
    id: string
    producto_id: string
    nombre: string
    descripcion?: string
    cantidad: number
    precio: number
    subtotal: number
    tipo: 'producto'
    modo: 'canje'
    puntos_canje: number
  }

  // Draft local del canje (para que el pos cart de venta no “se ensucie” mientras el modal está abierto)
  const [canjeDraft, setCanjeDraft] = useState<CanjeDraftItem[]>([])

  const [clientesCache, setClientesCache] = useState<Cliente[] | null>(null)
  const [nombre, setNombre] = useState('')
  const [ci, setCi] = useState('')
  const [telefono, setTelefono] = useState('')
  const [sugerencias, setSugerencias] = useState<Cliente[]>([])
  const [searching, setSearching] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)

  type SectionKey = 'cliente' | 'productos' | 'tipo' | 'resumen'
  const [openSection, setOpenSection] = useState<SectionKey>('cliente')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resetAll = useCallback(() => {
    setClienteSeleccionado(null)
    setNombre('')
    setCi('')
    setTelefono('')
    setSugerencias([])
    setClientesCache(null)
    setCanjeDraft([])
    setTipoCanje(null)
    setSearching(false)
    setIsProcessing(false)
    setOpenSection('cliente')

    // Evitar que un debounce pendiente deje estados "raros" al reabrir.
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [])

  const handleClose = useCallback(() => {
    // Si se muestra el modal de feedback (éxito/error), evitamos cerrar el canje debajo.
    if (feedback) return
    resetAll()
    onClose()
  }, [resetAll, onClose, feedback])

  // Garantiza que el estado interno (incl. tipo de pedido) vuelva al default
  // tanto al abrir como al cerrar, independientemente de cómo se cierre.
  useEffect(() => {
    resetAll()
  }, [open, resetAll])

  // Load clients cache for the tenant
  useEffect(() => {
    if (!open || !tenantId) return
    const supabase = createClient()
    supabase
      .from('clientes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_deleted', false)
      .order('puntos_totales', { ascending: false })
      .limit(CACHE_CLIENTES_LIMIT)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error cargando clientes para canje:', error)
          setClientesCache([])
        } else {
          setClientesCache((data ?? []) as Cliente[])
        }
      })
  }, [open, tenantId])

  // Filter suggestions by coincidence (like ClientModal)
  useEffect(() => {
    if (!open) return
    if (!clientesCache) return

    const nombreTrim = nombre.trim()
    const ciTrim = ci.trim()
    const telTrim = telefono.trim().replace(/\D/g, '')

    const tieneNombre = nombreTrim.length >= MIN_NOMBRE_LENGTH
    const tieneCi = ciTrim.length >= MIN_CI_LENGTH
    const tieneTelefono = telTrim.length >= MIN_TELEFONO_LENGTH

    if (!tieneNombre && !tieneCi && !tieneTelefono) {
      setSugerencias([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      setSearching(true)

      const nombreNorm = normalizarParaBusqueda(nombreTrim)
      const ciNorm = normalizarParaBusqueda(ciTrim)

      const filtrados = clientesCache.filter((c) => {
        const matchNombre = tieneNombre && normalizarParaBusqueda(c.nombre ?? '').includes(nombreNorm)
        const matchCi = tieneCi && c.ci != null && normalizarParaBusqueda(c.ci).includes(ciNorm)
        const matchTel = tieneTelefono && c.telefono != null && c.telefono.replace(/\D/g, '').includes(telTrim)
        return matchNombre || matchCi || matchTel
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
  }, [open, clientesCache, nombre, ci, telefono])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, handleClose])

  const canjeItems = canjeDraft
  const canjeCostoTotalPts = canjeItems.reduce((sum, i) => sum + (i.puntos_canje * i.cantidad), 0)
  const saldoClientePts = clienteSeleccionado?.puntos_totales ?? 0

  const canjeDistinctProductsCount = useMemo(() => {
    const set = new Set<string>()
    for (const i of canjeItems) set.add(i.producto_id)
    return set.size
  }, [canjeItems])

  const canjeCantidadTotal = canjeItems.reduce((sum, i) => sum + i.cantidad, 0)
  const canjeSoloUnItem = canjeCantidadTotal === 1 && canjeDistinctProductsCount === 1

  const canjeAllowed = Boolean(clienteSeleccionado) && canjeItems.length > 0 && canjeSoloUnItem && canjeCostoTotalPts <= saldoClientePts && tipoCanje !== null

  const ctaDisabledReason = canjeAllowed
    ? null
    : !clienteSeleccionado
      ? 'Elegí un cliente para continuar'
      : canjeItems.length === 0
        ? 'Elegí un producto para canjear'
        : tipoCanje === null
          ? 'Elegí el tipo de pedido'
          : canjeCostoTotalPts > saldoClientePts
            ? 'Saldo insuficiente en puntos'
            : 'Faltan datos para completar el canje'

  const [isProcessing, setIsProcessing] = useState(false)

  const handleApplyCanje = async () => {
    if (!tenant || !usuario || !clienteSeleccionado) return
    if (!canjeAllowed) return
    if (isProcessing) return

    try {
      setIsProcessing(true)

      const total = canjeItems.reduce((s, i) => s + (i.subtotal ?? 0), 0)
      const tipo: TipoPedido = tipoCanje

      const result = await orderService.confirmOrder({
        tenantId: tenant.id,
        usuarioId: usuario.id,
        tenantNombre: tenant.nombre,
        usuarioNombre: usuario.nombre,
        cliente: clienteSeleccionado,
        tipo,
        items: canjeItems,
        total,
        conFactura: false
      })

      const details: FeedbackDetail[] = result.successDetails ?? []

      setFeedback({
        type: 'success',
        title: `Pedido #${result.pedido.numero_pedido} confirmado`,
        message: 'Canje registrado y stock actualizado.',
        details
      })
      setIsProcessing(false)
      setOpenSection('resumen')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setFeedback({
        type: 'error',
        title: 'No se pudo aplicar el canje',
        message: msg
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const canjeByProductId = useMemo(() => {
    const map = new Map<string, { id: string; cantidad: number; puntos_canje: number }>()
    for (const i of canjeItems) {
      map.set(i.producto_id, { id: i.id, cantidad: i.cantidad, puntos_canje: i.puntos_canje })
    }
    return map
  }, [canjeItems])

  const productosParaCanje = useMemo(() => {
    return productos.filter((p) => {
      // Canje solo para productos simples (no combos) por simplicidad.
      if (!p.disponible) return false
      if (p.combo_items && p.combo_items.length > 0) return false
      const puntosNecesarios = getPuntosNecesariosPorProducto(p.precio)
      return puntosNecesarios > 0
    })
  }, [productos])

  const onSelectCliente = (c: Cliente) => {
    setClienteSeleccionado(c)
    setNombre('')
    setCi('')
    setTelefono('')
    setSugerencias([])
    setOpenSection('productos')
  }

  const handleAddOne = (p: Producto) => {
    if (!clienteSeleccionado) return
    const puntosUnidad = getPuntosNecesariosPorProducto(p.precio)
    if (puntosUnidad <= 0) return

    // Validación: solo 1 unidad por canje
    if (canjeCantidadTotal >= 1) return

    if (canjeCostoTotalPts + puntosUnidad > saldoClientePts) return

    // Solo 1 producto distinto por canje
    const existing = canjeByProductId.get(p.id)
    if (existing) return
    if (canjeItems.length > 0) return

    setCanjeDraft([
      {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `canje-${Date.now()}`,
        producto_id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        cantidad: 1,
        // Usamos precio para mostrar "Valor" en UI del modal, pero el canje se cobra con puntos (total=0).
        precio: p.precio,
        subtotal: 0,
        tipo: 'producto',
        modo: 'canje',
        puntos_canje: puntosUnidad,
      },
    ])
    setOpenSection('tipo')
  }

  const handleRemoveOne = (pId: string) => {
    const existing = canjeByProductId.get(pId)
    if (!existing) return
    setCanjeDraft([])
    setTipoCanje(null)
    setOpenSection('productos')
  }

  const ORDER_TYPES = [
    {
      value: 'delivery' as const,
      label: 'Delivery',
      helper: 'Entrega a domicilio',
      icon: '🏠',
      activeClass: 'bg-blue-600 text-white ring-2 ring-blue-200/70 border-blue-500/80 shadow-lg'
    },
    {
      value: 'local' as const,
      label: 'Comer aquí',
      helper: 'Consumo en salón',
      icon: '🍽️',
      activeClass: 'bg-green-600 text-white ring-2 ring-green-200/70 border-green-500/80 shadow-lg'
    },
    {
      value: 'para_llevar' as const,
      label: 'Para llevar',
      helper: 'El cliente retira',
      icon: '📦',
      activeClass: 'bg-orange-600 text-white ring-2 ring-orange-200/70 border-orange-500/80 shadow-lg'
    }
  ]

  const orderTypeInactiveClasses = darkMode
    ? 'bg-gray-700/60 text-gray-200 border-gray-600 hover:bg-gray-600'
    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'

  const orderTypeFocusOffset = darkMode
    ? 'focus-visible:ring-offset-gray-800'
    : 'focus-visible:ring-offset-white'

  if (!open || !mounted) return null

  const modalTitle = 'Canje de puntos'

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-4 backdrop-blur-sm ${
        darkMode ? 'bg-black/60' : 'bg-black/50'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="canje-puntos-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Cerrar"
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh] ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div
          className={`flex flex-shrink-0 items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <Gift className={darkMode ? 'w-5 h-5 text-orange-300' : 'w-5 h-5 text-orange-600'} />
            </div>
            <div className="min-w-0">
              <h2 id="canje-puntos-title" className={`text-lg font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {modalTitle}
              </h2>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Admin y cajero seleccionan productos para canje. Luego el pedido descuenta stock.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`rounded-xl p-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="space-y-3 p-4 sm:p-5">
            {/*
              Acordeones por pasos:
              cliente -> productos -> tipo -> resumen
              Se habilitan en cascada y se respeta safe area con footer fijo.
            */}

            {(() => {
              const stepClienteEnabled = true
              const stepClienteComplete = Boolean(clienteSeleccionado)

              const stepProductoEnabled = Boolean(clienteSeleccionado)
              const stepProductoComplete = canjeItems.length > 0

              const stepTipoEnabled = stepProductoComplete
              const stepTipoComplete = tipoCanje !== null

              const stepResumenEnabled = stepClienteComplete && stepProductoComplete && stepTipoComplete

              const sectionClasses = `rounded-2xl border ${
                darkMode ? 'border-gray-700 bg-gray-900/10' : 'border-gray-200 bg-white'
              } overflow-hidden`

              const headerBase = `w-full flex items-center justify-between gap-3 px-4 py-3 text-left ${
                darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400`

              const headerDisabled = darkMode
                ? 'opacity-50 cursor-not-allowed'
                : 'opacity-60 cursor-not-allowed'

              const statusPill = (complete: boolean) => (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    complete
                      ? darkMode
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-green-500/15 text-green-700'
                      : darkMode
                        ? 'bg-gray-700/60 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {complete ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Listo
                    </span>
                  ) : (
                    'Pendiente'
                  )}
                </span>
              )

              const AccordionHeader = ({
                keyName,
                title,
                enabled,
                complete,
                icon
              }: {
                keyName: SectionKey
                title: string
                enabled: boolean
                complete: boolean
                icon: ReactNode
              }) => {
                const isOpen = openSection === keyName
                const canToggle = enabled
                return (
                  <button
                    type="button"
                    disabled={!canToggle}
                    onClick={() => setOpenSection(keyName)}
                    aria-expanded={isOpen}
                    aria-disabled={!canToggle}
                    className={`${headerBase} ${
                      isOpen ? (darkMode ? 'bg-gray-800/60' : 'bg-gray-50') : ''
                    } ${!canToggle ? headerDisabled : ''}`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        darkMode ? 'bg-orange-500/15 text-orange-300' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {icon}
                      </span>
                      <span className="min-w-0">
                        <span className={`block font-bold text-sm truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {title}
                        </span>
                        <span className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {complete ? 'Completado' : enabled ? 'A completar' : 'Bloqueado'}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      {statusPill(complete)}
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                )
              }

              const ClienteContent = (
                <div className="p-4 sm:p-5 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className={darkMode ? 'w-4 h-4 text-orange-300' : 'w-4 h-4 text-orange-600'} />
                    <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Cliente</p>
                  </div>

                  {clienteSeleccionado ? (
                    <div className={`rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{clienteSeleccionado.nombre}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {clienteSeleccionado.telefono ?? 'Sin teléfono'} • ⭐ {clienteSeleccionado.puntos_totales} pts
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`text-xs font-semibold rounded-lg px-3 py-2 ${
                            darkMode
                              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setClienteSeleccionado(null)
                            setTipoCanje(null)
                            setNombre('')
                            setCi('')
                            setTelefono('')
                            setCanjeDraft([])
                            setSugerencias([])
                            setOpenSection('cliente')
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="Nombre"
                          className={`w-full px-3 py-2 rounded-xl border-2 outline-none transition ${
                            darkMode
                              ? 'bg-gray-900/30 border-gray-700 text-white focus:border-orange-400'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-orange-400'
                          }`}
                        />
                        <input
                          value={ci}
                          onChange={(e) => setCi(e.target.value)}
                          placeholder="CI"
                          className={`w-full px-3 py-2 rounded-xl border-2 outline-none transition ${
                            darkMode
                              ? 'bg-gray-900/30 border-gray-700 text-white focus:border-orange-400'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-orange-400'
                          }`}
                        />
                        <input
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          placeholder="Teléfono"
                          className={`w-full sm:col-span-2 px-3 py-2 rounded-xl border-2 outline-none transition ${
                            darkMode
                              ? 'bg-gray-900/30 border-gray-700 text-white focus:border-orange-400'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-orange-400'
                          }`}
                        />
                      </div>

                      {searching && (
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Buscando...</p>
                      )}

                      {sugerencias.length > 0 && (
                        <div className={`rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                          <div
                            className={`px-4 py-2 text-xs font-semibold ${
                              darkMode ? 'bg-gray-900/20 text-gray-300' : 'bg-white text-gray-600'
                            } border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                          >
                            {sugerencias.length} coincidencias
                          </div>
                          <div className="max-h-44 overflow-y-auto overscroll-contain">
                            {sugerencias.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => onSelectCliente(c)}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-orange-50/60 ${
                                  darkMode ? 'hover:bg-gray-700' : ''
                                }`}
                              >
                                <span className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {c.nombre}
                                </span>
                                <span className={`text-xs font-bold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                                  ⭐ {c.puntos_totales} pts
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!sugerencias.length && (
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Escribí nombre, CI o teléfono para buscar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )

              const ProductoContent = (
                <div className="p-4 sm:p-5 border-t">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Productos disponibles al canje
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {productosParaCanje.length} disponibles
                    </p>
                  </div>

                  {canjeItems.length > 0 && (
                    <div className={`rounded-xl border p-4 mb-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Producto seleccionado
                      </p>
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{canjeDraft[0]?.nombre}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {canjeDraft[0]?.puntos_canje} pts • Valor: {formatGuaranies(canjeDraft[0]?.precio ?? 0)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`text-xs font-semibold rounded-lg px-3 py-2 ${
                            darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setCanjeDraft([])
                            setTipoCanje(null)
                            setOpenSection('productos')
                          }}
                        >
                          Cambiar producto
                        </button>
                      </div>
                    </div>
                  )}

                  {canjeItems.length === 0 && (
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      Elegí un producto para canjear con tus puntos.
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {productosParaCanje.map((p) => {
                      const puntosUnidad = getPuntosNecesariosPorProducto(p.precio)
                      const canjeLine = canjeByProductId.get(p.id)
                      const currentQty = canjeLine?.cantidad ?? 0

                      const saldoOkParaAgregar = clienteSeleccionado
                        ? canjeCostoTotalPts + puntosUnidad <= saldoClientePts
                        : false

                      const canAdd = canjeCantidadTotal < 1 && saldoOkParaAgregar
                      const canRemove = Boolean(canjeLine) && currentQty > 0

                      return (
                        <div key={p.id} className={`rounded-2xl border p-4 ${
                          darkMode ? 'border-gray-700 bg-gray-900/10' : 'border-gray-200 bg-gray-50'
                        }`}>
                          {p.descripcion && (
                            <p className={`text-[11px] mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{p.descripcion}</p>
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={`font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.nombre}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Costo: <span className="font-bold">{puntosUnidad}</span> pts • Valor: {formatGuaranies(p.precio)}
                              </p>
                            </div>

                            <div className="flex flex-col items-end">
                              <span className={`text-[11px] font-bold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                                {currentQty} unidad{currentQty === 1 ? '' : 'es'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveOne(p.id)}
                              disabled={!canRemove}
                              className={`p-2 rounded-xl transition ${
                                darkMode
                                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                              }`}
                              aria-label="Quitar producto seleccionado"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAddOne(p)}
                              disabled={!canAdd}
                              className={`px-3 py-2 rounded-xl font-bold transition ${
                                darkMode
                                  ? canAdd
                                    ? 'bg-orange-500 text-white hover:bg-orange-400'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : canAdd
                                    ? 'bg-orange-500 text-white hover:bg-orange-400'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                              aria-label="Elegir producto"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Elegir
                              </span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )

              const TipoContent = (
                <div className="p-4 sm:p-5 border-t">
                  <div className={`text-[10px] font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Tipo de entrega:</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ORDER_TYPES.map((option) => {
                      const isActive = tipoCanje === option.value
                      const helperColor = isActive
                        ? 'text-white/90'
                        : darkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'

                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={isActive}
                          aria-label={option.label}
                          onClick={() => {
                            setTipoCanje(option.value)
                            setOpenSection('resumen')
                          }}
                          disabled={!stepTipoEnabled}
                          className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex flex-col items-center gap-0.5 border text-center focus-visible:outline-none focus-visible:ring-2 ${orderTypeFocusOffset} ${
                            isActive ? option.activeClass : stepTipoEnabled ? orderTypeInactiveClasses : (darkMode ? 'bg-gray-700 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200')
                          }`}
                          title={option.helper}
                        >
                          <span className="text-lg leading-none">{option.icon}</span>
                          <span className="leading-tight">{option.label}</span>
                          <span className={`text-[9px] font-medium leading-tight ${helperColor}`}>{option.helper}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )

              const ResumenContent = (
                <div className="p-4 sm:p-5 border-t">
                  <div className={`rounded-xl border p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Resumen de canje
                    </p>
                    <div className="mt-2 space-y-2">
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Cliente: <span className="font-bold">{clienteSeleccionado?.nombre}</span>
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Producto: <span className="font-bold">{canjeDraft[0]?.nombre}</span>
                      </p>
                      <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Modo: <span className="font-bold">{`CANJE DE PUNTOS`}</span>
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tipo: <span className="font-bold">{tipoCanje ? ORDER_TYPES.find((t) => t.value === tipoCanje)?.label : '-'}</span>
                      </p>

                      <div className="pt-1">
                        <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          Costo en puntos (producto): <span className="font-bold">{canjeCostoTotalPts}</span> pts
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Puntos consumidos: <span className="font-bold">{canjeCostoTotalPts}</span> pts
                        </p>
                      </div>

                      <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Solo se puede canjear 1 unidad por canje.
                      </p>
                      <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Al confirmar, se descuenta solo el costo del producto.
                      </p>
                    </div>
                  </div>
                </div>
              )

              return (
                <>
                  <div className={sectionClasses}>
                    <AccordionHeader
                      keyName="cliente"
                      title="Cliente"
                      enabled={stepClienteEnabled}
                      complete={stepClienteComplete}
                      icon={<Search className="w-4 h-4" />}
                    />
                    {openSection === 'cliente' && ClienteContent}
                  </div>

                  <div className={sectionClasses}>
                    <AccordionHeader
                      keyName="productos"
                      title="Productos para canjear"
                      enabled={stepProductoEnabled}
                      complete={stepProductoComplete}
                      icon={<Gift className="w-4 h-4" />}
                    />
                    {openSection === 'productos' && stepProductoEnabled ? ProductoContent : null}
                  </div>

                  <div className={sectionClasses}>
                    <AccordionHeader
                      keyName="tipo"
                      title="Tipo de pedido"
                      enabled={stepTipoEnabled}
                      complete={stepTipoComplete}
                      icon={<Plus className="w-4 h-4" />}
                    />
                    {openSection === 'tipo' && stepTipoEnabled ? TipoContent : null}
                  </div>

                  <div className={sectionClasses}>
                    <AccordionHeader
                      keyName="resumen"
                      title="Resumen y confirmacion"
                      enabled={stepResumenEnabled}
                      complete={stepResumenEnabled}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    />
                    {openSection === 'resumen' && stepResumenEnabled ? ResumenContent : null}
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex-shrink-0 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <button
              type="button"
              onClick={handleClose}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl font-semibold transition ${
                darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cerrar
            </button>

            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <button
                type="button"
                onClick={handleApplyCanje}
                disabled={!canjeAllowed}
                className={`min-h-[44px] w-full px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode
                    ? canjeAllowed
                      ? 'bg-orange-500 text-white hover:bg-orange-400'
                      : 'bg-gray-700 text-gray-400'
                    : canjeAllowed
                      ? 'bg-orange-500 text-white hover:bg-orange-400'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isProcessing ? 'Procesando...' : 'Aplicar canje'}
              </button>
              {ctaDisabledReason ? (
                <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                  {ctaDisabledReason}
                </p>
              ) : (
                <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {`Listo para aplicar`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {feedback && (
        <FeedbackModal
          open
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          details={feedback.details}
          onClose={() => {
            setFeedback(null)
            resetAll()
            onClose()
          }}
          darkMode={darkMode}
          actionLabel={feedback.type === 'success' ? 'Continuar' : 'Cerrar'}
        />
      )}
    </div>,
    document.body
  )
}

