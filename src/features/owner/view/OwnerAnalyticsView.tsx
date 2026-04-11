'use client'

import Link from 'next/link'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { OwnerGa4Dashboard } from '@/lib/analytics/ga4OwnerReports'
import { useTenant } from '@/contexts/TenantContext'
import { ROUTES } from '@/config/routes'
import { ExternalLink } from 'lucide-react'

type Props =
  | { status: 'ok'; dashboard: OwnerGa4Dashboard }
  | { status: 'not_configured'; hint: string }
  | { status: 'error'; message: string }

function formatInt(n: number): string {
  return new Intl.NumberFormat('es-PY').format(Math.round(n))
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}m ${s}s`
}

export function OwnerAnalyticsView(props: Props) {
  const { darkMode } = useTenant()
  const card = `rounded-xl border p-5 ${
    darkMode
      ? 'border-slate-700/80 bg-slate-900/40 text-slate-100'
      : 'border-slate-200 bg-white text-slate-900 shadow-sm'
  }`
  const muted = darkMode ? 'text-slate-400' : 'text-slate-600'
  const tableHead = darkMode ? 'text-slate-500' : 'text-slate-500'
  const rowBorder = darkMode ? 'border-slate-700/60' : 'border-slate-100'

  if (props.status === 'not_configured') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className={card}>
          <h1 className="text-xl font-semibold tracking-tight">Analytics de la landing</h1>
          <p className={`mt-2 text-sm ${muted}`}>
            Google Analytics 4 no está conectado al panel todavía. Cuando configures las variables de
            entorno, acá vas a ver usuarios, sesiones, páginas vistas, fuentes de tráfico y dispositivos.
          </p>
          <ol className={`mt-4 list-decimal space-y-2 pl-5 text-sm ${muted}`}>
            <li>
              Creá una propiedad GA4 y un flujo web con la URL de producción (ej.{' '}
              <code className="rounded bg-black/10 px-1 py-0.5 text-xs">https://tudominio.com</code>).
            </li>
            <li>
              Instalá el tag de GA4 (por ejemplo con Google Tag Manager en todo el sitio, ya integrado en el layout).
            </li>
            <li>
              En Google Cloud, creá una cuenta de servicio con acceso a la API “Google Analytics Data API”,
              descargá la clave JSON y pegá el JSON completo (una línea) en{' '}
              <code className="rounded bg-black/10 px-1 py-0.5 text-xs">GA4_SERVICE_ACCOUNT_JSON</code>.
            </li>
            <li>
              En GA4 → Administrar → acceso a la propiedad, agregá el email de la cuenta de servicio con rol{' '}
              <strong>Lector</strong> o superior.
            </li>
            <li>
              El ID numérico de la propiedad va en{' '}
              <code className="rounded bg-black/10 px-1 py-0.5 text-xs">GA4_PROPERTY_ID</code> (solo números, o{' '}
              <code className="rounded bg-black/10 px-1 py-0.5 text-xs">properties/123...</code>).
            </li>
          </ol>
          <p className={`mt-4 text-xs ${muted}`}>{props.hint}</p>
        </div>
        <Link
          href={ROUTES.PROTECTED.OWNER}
          className="inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Volver al panel Owner
        </Link>
      </div>
    )
  }

  if (props.status === 'error') {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className={`${card} border-red-300/50 dark:border-red-900/50`}>
          <h1 className="text-xl font-semibold text-red-700 dark:text-red-400">No se pudo leer GA4</h1>
          <p className={`mt-2 text-sm ${muted}`}>{props.message}</p>
        </div>
        <Link
          href={ROUTES.PROTECTED.OWNER}
          className="inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Volver al panel Owner
        </Link>
      </div>
    )
  }

  const { dashboard: d } = props
  const axisColor = darkMode ? '#94a3b8' : '#64748b'
  const gridColor = darkMode ? '#334155' : '#e2e8f0'
  const lineColor = darkMode ? '#38bdf8' : '#0284c7'

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Landing — Google Analytics</h1>
          <p className={`mt-1 text-sm ${muted}`}>
            Resumen de los últimos días (misma propiedad que el tag en <code className="text-xs">/</code>). Para
            informes avanzados abrí la consola de Google.
          </p>
        </div>
        <a
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            darkMode
              ? 'border-slate-600 bg-slate-800 hover:bg-slate-800/90'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          Abrir GA4
          <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
        </a>
      </div>

      {d.realtimeActiveUsers !== null && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            darkMode ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          <span className="font-semibold">Ahora mismo:</span>{' '}
          {formatInt(d.realtimeActiveUsers)} usuario(s) activo(s) (ventana en tiempo real de GA4).
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <p className={`text-xs font-medium uppercase tracking-wide ${tableHead}`}>Usuarios activos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatInt(d.summary.activeUsers)}</p>
          <p className={`text-xs ${muted}`}>últimos 28 días</p>
        </div>
        <div className={card}>
          <p className={`text-xs font-medium uppercase tracking-wide ${tableHead}`}>Sesiones</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatInt(d.summary.sessions)}</p>
          <p className={`text-xs ${muted}`}>últimos 28 días</p>
        </div>
        <div className={card}>
          <p className={`text-xs font-medium uppercase tracking-wide ${tableHead}`}>Vistas de página</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatInt(d.summary.screenPageViews)}</p>
          <p className={`text-xs ${muted}`}>últimos 28 días</p>
        </div>
        <div className={card}>
          <p className={`text-xs font-medium uppercase tracking-wide ${tableHead}`}>Usuarios nuevos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatInt(d.summary.newUsers)}</p>
          <p className={`text-xs ${muted}`}>últimos 28 días</p>
        </div>
      </section>

      <section className={card}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Duración media de sesión</h2>
          <span className="text-2xl font-bold tabular-nums">
            {formatDuration(d.summary.averageSessionDurationSec)}
          </span>
        </div>
        <h2 className="mb-2 text-lg font-semibold">Usuarios activos por día</h2>
        <p className={`mb-4 text-xs ${muted}`}>Últimos 14 días</p>
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.dailyActiveUsers} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="dateLabel" tick={{ fill: axisColor, fontSize: 11 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} allowDecimals={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#0f172a' : '#fff',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: 8,
                }}
                labelStyle={{ color: axisColor }}
              />
              <Line type="monotone" dataKey="activeUsers" name="Activos" stroke={lineColor} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 text-lg font-semibold">Páginas más vistas</h2>
          <p className={`mb-3 text-xs ${muted}`}>Últimos 28 días</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b ${rowBorder}`}>
                  <th className={`pb-2 pr-2 font-medium ${tableHead}`}>Ruta</th>
                  <th className={`pb-2 text-right font-medium ${tableHead}`}>Vistas</th>
                </tr>
              </thead>
              <tbody>
                {d.topPages.length === 0 ? (
                  <tr>
                    <td colSpan={2} className={`py-4 ${muted}`}>
                      Sin datos aún.
                    </td>
                  </tr>
                ) : (
                  d.topPages.map((row) => (
                    <tr key={row.path} className={`border-b ${rowBorder} last:border-0`}>
                      <td className="max-w-[200px] truncate py-2 font-mono text-xs sm:max-w-xs" title={row.path}>
                        {row.path}
                      </td>
                      <td className="py-2 text-right tabular-nums">{formatInt(row.views)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 text-lg font-semibold">Tráfico por origen / medio</h2>
          <p className={`mb-3 text-xs ${muted}`}>Últimos 28 días</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b ${rowBorder}`}>
                  <th className={`pb-2 font-medium ${tableHead}`}>Origen</th>
                  <th className={`pb-2 font-medium ${tableHead}`}>Medio</th>
                  <th className={`pb-2 text-right font-medium ${tableHead}`}>Sesiones</th>
                </tr>
              </thead>
              <tbody>
                {d.trafficSources.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={`py-4 ${muted}`}>
                      Sin datos aún.
                    </td>
                  </tr>
                ) : (
                  d.trafficSources.map((row) => (
                    <tr
                      key={`${row.source}|${row.medium}`}
                      className={`border-b ${rowBorder} last:border-0`}
                    >
                      <td className="max-w-[120px] truncate py-2" title={row.source}>
                        {row.source}
                      </td>
                      <td className="max-w-[100px] truncate py-2" title={row.medium}>
                        {row.medium}
                      </td>
                      <td className="py-2 text-right tabular-nums">{formatInt(row.sessions)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className={card}>
        <h2 className="mb-3 text-lg font-semibold">Dispositivos</h2>
        <p className={`mb-3 text-xs ${muted}`}>Sesiones por categoría — últimos 28 días</p>
        <div className="flex flex-wrap gap-3">
          {d.devices.length === 0 ? (
            <span className={muted}>Sin datos.</span>
          ) : (
            d.devices.map((row) => (
              <div
                key={row.category}
                className={`rounded-lg border px-4 py-3 ${
                  darkMode ? 'border-slate-600 bg-slate-800/80' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="text-xs font-medium capitalize text-slate-500 dark:text-slate-400">{row.category}</p>
                <p className="text-lg font-semibold tabular-nums">{formatInt(row.sessions)}</p>
                <p className="text-xs text-slate-500">sesiones</p>
              </div>
            ))
          )}
        </div>
      </section>

      <Link
        href={ROUTES.PROTECTED.OWNER}
        className="inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Volver al panel Owner
      </Link>
    </div>
  )
}
