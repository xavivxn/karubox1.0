'use client'

import { useEffect, useState } from 'react'
import { CalendarRange, RefreshCw } from 'lucide-react'
import { getOwnerCashSummary } from '@/app/actions/ownerCaja'
import { formatGuaranies } from '@/lib/utils/format'

type PeriodType = 'month' | 'year'

interface OwnerCashSummaryProps {
  initialPeriodType?: PeriodType
}

export function OwnerCashSummary({ initialPeriodType = 'month' }: OwnerCashSummaryProps) {
  const [periodType, setPeriodType] = useState<PeriodType>(initialPeriodType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getOwnerCashSummary>>['data'] | null>(
    null
  )

  useEffect(() => {
    const now = new Date()
    let from: string
    let to: string
    if (periodType === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      from = first.toISOString()
      to = last.toISOString()
      setLabel(first.toLocaleDateString('es-PY', { month: 'long', year: 'numeric' }))
    } else {
      const first = new Date(now.getFullYear(), 0, 1)
      const last = new Date(now.getFullYear(), 11, 31)
      from = first.toISOString()
      to = last.toISOString()
      setLabel(String(now.getFullYear()))
    }

    setLoading(true)
    setError(null)
    getOwnerCashSummary({ from, to })
      .then((res) => {
        if (!res.success) {
          setSummary(null)
          setError(res.error || 'No se pudo cargar el resumen de caja.')
          return
        }
        setSummary(res.data)
        setError(null)
      })
      .catch((e) => {
        console.error('[OwnerCashSummary] error:', e)
        setSummary(null)
        setError('No se pudo cargar el resumen de caja.')
      })
      .finally(() => setLoading(false))
  }, [periodType])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-500 font-semibold">
              Caja owners Karubox
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Resumen {periodType === 'month' ? 'mensual' : 'anual'} · {label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriodType('month')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              periodType === 'month'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700'
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setPeriodType('year')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              periodType === 'year'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700'
            }`}
          >
            Anual
          </button>
          <button
            type="button"
            onClick={() => setPeriodType((p) => p)}
            className="p-1.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Recargar"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Ganancia operativa (sesiones caja)
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatGuaranies(summary.gananciaOperativa)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Antes de inversiones y gastos de owners.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Ganancia neta para repartir
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatGuaranies(summary.gananciaNetaParaRepartir)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Después de gastos, pagos a proveedores y ajustes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-800">
            <SmallStat label="Inversión" value={summary.totalInversion} />
            <SmallStat label="Gastos" value={summary.totalGastos} />
            <SmallStat label="Pagos a proveedores" value={summary.totalPagosProveedores} />
            <SmallStat label="Ajustes" value={summary.totalAjustes} />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PartnerCard
              nombre="Naser"
              corresponde={summary.porSocio.naser.corresponde}
              retirado={summary.porSocio.naser.retirado}
              saldo={summary.porSocio.naser.saldo}
            />
            <PartnerCard
              nombre="Ivan"
              corresponde={summary.porSocio.ivan.corresponde}
              retirado={summary.porSocio.ivan.retirado}
              saldo={summary.porSocio.ivan.saldo}
            />
          </div>
        </>
      )}

      {!loading && !summary && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Aún no hay datos de caja de owners para este período.
        </p>
      )}
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {formatGuaranies(value)}
      </p>
    </div>
  )
}

function PartnerCard({
  nombre,
  corresponde,
  retirado,
  saldo,
}: {
  nombre: string
  corresponde: number
  retirado: number
  saldo: number
}) {
  const saldoColor =
    saldo > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 p-4 space-y-2">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
        Socio
      </p>
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{nombre}</p>
      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Corresponde</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {formatGuaranies(corresponde)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Retirado</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {formatGuaranies(retirado)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Saldo</p>
          <p className={`font-semibold ${saldoColor}`}>{formatGuaranies(saldo)}</p>
        </div>
      </div>
    </div>
  )
}

