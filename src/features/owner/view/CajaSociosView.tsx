'use client'

import { useEffect, useState } from 'react'
import { Plus, CalendarDays, CheckCircle2, Clock, TrendingUp, CreditCard } from 'lucide-react'
import {
  createOwnerCashMovement,
  listOwnerCashMovements,
  markOwnerCashMovementPaid,
  listOwnerInvestments,
  getOwnerInvestmentsSummary,
  createOwnerMonthlyExpense,
  listOwnerMonthlyExpenses,
  deactivateOwnerMonthlyExpense,
} from '@/app/actions/ownerCaja'
import type { OwnerCashMovement, OwnerMonthlyExpense } from '@/app/actions/ownerCaja'
import { formatGuaranies } from '@/lib/utils/format'

export function CajaSociosView() {
  const [items, setItems] = useState<OwnerCashMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const [investments, setInvestments] = useState<OwnerCashMovement[]>([])
  const [investSummary, setInvestSummary] = useState<{
    totalInvertido: number
    porSocio: { naser: number; ivan: number }
  } | null>(null)

  const [monthly, setMonthly] = useState<OwnerMonthlyExpense[]>([])
  const [monthlyError, setMonthlyError] = useState<string | null>(null)
  const [monthlySaving, setMonthlySaving] = useState(false)
  const [conceptoMensual, setConceptoMensual] = useState('')
  const [montoMensual, setMontoMensual] = useState('')
  const [fechaMensual, setFechaMensual] = useState(() => new Date().toISOString().slice(0, 10))

  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    setLoading(true)
    setError(null)
    listOwnerCashMovements({})
      .then((res) => {
        if (!res.success) {
          setError(res.error)
          setItems([])
          return
        }
        setItems(res.data)
      })
      .catch((e) => {
        console.error('[CajaSociosView] list error:', e)
        setError('No se pudo cargar la caja de socios.')
        setItems([])
      })
      .finally(() => setLoading(false))

    ;(async () => {
      try {
        const [invRes, sumRes, monthlyRes] = await Promise.all([
          listOwnerInvestments(),
          getOwnerInvestmentsSummary(),
          listOwnerMonthlyExpenses(),
        ])

        if (invRes.success) setInvestments(invRes.data)
        if (sumRes.success) setInvestSummary(sumRes.data)
        if (monthlyRes.success) setMonthly(monthlyRes.data)
      } catch (e) {
        console.error('[CajaSociosView] extra data error:', e)
      }
    })()
  }, [])

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria.')
      return
    }
    const montoNumber = Number(monto)
    if (!Number.isFinite(montoNumber) || montoNumber <= 0) {
      setError('El monto debe ser mayor a cero.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await createOwnerCashMovement({
        tipo: 'gasto',
        monto: montoNumber,
        descripcion: descripcion.trim(),
        fecha,
        pagado: false,
      })
      if (!res.success) {
        setError(res.error)
        return
      }
      setItems((prev) => [res.data, ...prev])
      setDescripcion('')
      setMonto('')
      setFecha(new Date().toISOString().slice(0, 10))
      setShowForm(false)
    } catch (e) {
      console.error('[CajaSociosView] create error:', e)
      setError('No se pudo guardar el registro.')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id)
    setError(null)
    try {
      const res = await markOwnerCashMovementPaid(id)
      if (!res.success) {
        setError(res.error)
        return
      }
      setItems((prev) => prev.map((it) => (it.id === id ? res.data : it)))
    } catch (e) {
      console.error('[CajaSociosView] mark paid error:', e)
      setError('No se pudo marcar como pagado.')
    } finally {
      setMarkingId(null)
    }
  }

  const handleCrearMensual = async (e: React.FormEvent) => {
    e.preventDefault()
    setMonthlyError(null)
    const montoNumber = Number(montoMensual)
    if (!conceptoMensual.trim()) {
      setMonthlyError('El concepto es obligatorio.')
      return
    }
    if (!Number.isFinite(montoNumber) || montoNumber <= 0) {
      setMonthlyError('El monto debe ser mayor a cero.')
      return
    }

    setMonthlySaving(true)
    try {
      const res = await createOwnerMonthlyExpense({
        concepto: conceptoMensual,
        monto: montoNumber,
        fecha_inicio: fechaMensual,
      })
      if (!res.success) {
        setMonthlyError(res.error)
        return
      }
      setMonthly((prev) => [res.data, ...prev])
      setConceptoMensual('')
      setMontoMensual('')
      setFechaMensual(new Date().toISOString().slice(0, 10))
    } catch (e) {
      console.error('[CajaSociosView] create monthly error:', e)
      setMonthlyError('No se pudo guardar el pago mensual.')
    } finally {
      setMonthlySaving(false)
    }
  }

  const handleDeactivateMensual = async (id: string) => {
    setMonthlyError(null)
    try {
      const res = await deactivateOwnerMonthlyExpense(id)
      if (!res.success) {
        setMonthlyError(res.error)
        return
      }
      setMonthly((prev) => prev.filter((m) => m.id !== id))
    } catch (e) {
      console.error('[CajaSociosView] deactivate monthly error:', e)
      setMonthlyError('No se pudo desactivar el pago mensual.')
    }
  }

  const resumen = items.reduce(
    (acc, item) => {
      const total = Number(item.monto) || 0
      const mitad = total / 2
      if (!item.pagado) {
        acc.totalPendiente += total
        acc.naserPendiente += mitad
        acc.ivanPendiente += mitad
      }
      return acc
    },
    { totalPendiente: 0, naserPendiente: 0, ivanPendiente: 0 }
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold">
          Caja de socios
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-50">
          Lista de cosas a pagar 
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Todo lo que se cargue acá se divide automáticamente entre Naser e Ivan.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResumenCard
          title="Total pendiente"
          value={resumen.totalPendiente}
          subtitle="Suma completa de cosas pendientes"
        />
        <ResumenCard
          title="Naser pendiente"
          value={resumen.naserPendiente}
          subtitle="Mitad de cada ítem para Naser"
        />
        <ResumenCard
          title="Ivan pendiente"
          value={resumen.ivanPendiente}
          subtitle="Mitad de cada ítem para Ivan"
        />
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Registro manual de compromisos
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cada fila es algo que se paga entre los dos socios.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cerrar' : 'Agregar cosa a pagar'}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {showForm && (
          <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Alquiler marzo, Luz ANDE..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Monto total
              </label>
              <input
                type="number"
                min={0}
                step="1000"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Fecha
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 h-[38px] disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="text-left py-2 pr-2">Descripción</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-right py-2 px-2">Naser (50%)</th>
                <th className="text-right py-2 px-2">Ivan (50%)</th>
                <th className="text-left py-2 px-2">Fecha</th>
                <th className="text-left py-2 pl-2">Estado</th>
                <th className="text-left py-2 pl-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400">
                    Cargando registros...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400">
                    Todavía no cargaste ninguna cosa a pagar.
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((item) => {
                  const total = Number(item.monto) || 0
                  const mitad = total / 2
                  const fechaTexto =
                    (item.fecha as string | undefined) ??
                    (item.created_at && item.created_at.slice(0, 10)) ??
                    ''
                  const estado = item.pagado ? 'Pagado' : 'Pendiente'
                  const EstadoIcon = item.pagado ? CheckCircle2 : Clock
                  const estadoColor = item.pagado
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'

                  return (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-2 max-w-xs">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.descripcion || 'Sin descripción'}
                        </p>
                      </td>
                      <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">
                        {formatGuaranies(total)}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">
                        {formatGuaranies(mitad)}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">
                        {formatGuaranies(mitad)}
                      </td>
                      <td className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">
                        {fechaTexto}
                      </td>
                      <td className="py-2 pl-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${estadoColor}`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estado}
                        </span>
                      </td>
                      <td className="py-2 pl-2">
                        {!item.pagado && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(item.id)}
                            disabled={markingId === item.id}
                            className="text-xs px-3 py-1 rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 disabled:opacity-60"
                          >
                            {markingId === item.id ? 'Marcando...' : 'Marcar pagado'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inversiones en la empresa */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Inversiones en la empresa
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Historial de dinero que cada socio fue poniendo en Karubox.
            </p>
          </div>
        </div>

        {investSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ResumenCard
              title="Total invertido"
              value={investSummary.totalInvertido}
              subtitle="Suma histórica de inversiones"
            />
            <ResumenCard
              title="Invertido por Naser"
              value={investSummary.porSocio.naser}
              subtitle="Aportes hechos por Naser"
            />
            <ResumenCard
              title="Invertido por Ivan"
              value={investSummary.porSocio.ivan}
              subtitle="Aportes hechos por Ivan"
            />
          </div>
        )}

        {investments.length > 0 && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                  <th className="text-left py-2 pr-2">Descripción</th>
                  <th className="text-left py-2 px-2">Socio</th>
                  <th className="text-right py-2 px-2">Monto</th>
                  <th className="text-left py-2 px-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => {
                  const fechaTexto =
                    (inv.fecha as string | undefined) ??
                    (inv.created_at && inv.created_at.slice(0, 10)) ??
                    ''
                  return (
                    <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-2 max-w-xs">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {inv.descripcion || 'Sin descripción'}
                        </p>
                      </td>
                      <td className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">
                        {inv.socio === 'naser' ? 'Naser' : inv.socio === 'ivan' ? 'Ivan' : '-'}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">
                        {formatGuaranies(Number(inv.monto) || 0)}
                      </td>
                      <td className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">
                        {fechaTexto}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagos mensuales fijos */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Pagos mensuales fijos
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ejemplo: base de datos, dominios, herramientas que se pagan todos los meses (50/50).
            </p>
          </div>
        </div>

        {monthlyError && (
          <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {monthlyError}
          </p>
        )}

        <form
          onSubmit={handleCrearMensual}
          className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Concepto
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              value={conceptoMensual}
              onChange={(e) => setConceptoMensual(e.target.value)}
              placeholder="Ej: BD Supabase, Dominio, Notion..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Monto mensual
            </label>
            <input
              type="number"
              min={0}
              step="1000"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              value={montoMensual}
              onChange={(e) => setMontoMensual(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Desde
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              value={fechaMensual}
              onChange={(e) => setFechaMensual(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={monthlySaving}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 h-[38px] disabled:opacity-60"
          >
            {monthlySaving ? 'Guardando...' : 'Agregar mensual'}
          </button>
        </form>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="text-left py-2 pr-2">Concepto</th>
                <th className="text-right py-2 px-2">Total mensual</th>
                <th className="text-right py-2 px-2">Naser (50%)</th>
                <th className="text-right py-2 px-2">Ivan (50%)</th>
                <th className="text-left py-2 px-2">Desde</th>
                <th className="text-left py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {monthly.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    Todavía no configuraste pagos mensuales fijos.
                  </td>
                </tr>
              )}
              {monthly.map((m) => {
                const total = Number(m.monto) || 0
                const mitad = total / 2
                return (
                  <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-2 max-w-xs">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {m.concepto}
                      </p>
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">
                      {formatGuaranies(total)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">
                      {formatGuaranies(mitad)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">
                      {formatGuaranies(mitad)}
                    </td>
                    <td className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">
                      {m.fecha_inicio}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => handleDeactivateMensual(m.id)}
                        className="text-xs px-3 py-1 rounded-full border border-gray-400 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

interface ResumenCardProps {
  title: string
  value: number
  subtitle: string
}

function ResumenCard({ title, value, subtitle }: ResumenCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-1">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {formatGuaranies(value)}
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
    </div>
  )
}

