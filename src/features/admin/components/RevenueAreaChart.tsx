'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { formatGuaranies } from '@/lib/utils/format'
import type { WeeklyTrendItem } from '../types/admin.types'

interface RevenueAreaChartProps {
  data: WeeklyTrendItem[]
  animationKey?: string
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-white/20 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-black/20">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-lg font-extrabold text-gray-900 dark:text-white">
        {formatGuaranies(payload[0].value)}
      </p>
    </div>
  )
}

export const RevenueAreaChart = ({ data, animationKey }: RevenueAreaChartProps) => {
  const chartData = useMemo(
    () => data.map((item) => ({ name: item.label, ingresos: item.value })),
    [data]
  )

  const gradientId = `revenueGradient-${animationKey ?? 'default'}`

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        key={animationKey}
        data={chartData}
        margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-800"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fontWeight: 600 }}
          className="text-gray-500 dark:text-gray-400"
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickFormatter={formatAxisValue}
          tick={{ fontSize: 11 }}
          className="text-gray-400 dark:text-gray-500"
          width={50}
        />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Area
          type="monotone"
          dataKey="ingresos"
          stroke="#f97316"
          strokeWidth={3}
          fill={`url(#${gradientId})`}
          animationDuration={1200}
          animationEasing="ease-out"
          dot={false}
          activeDot={{
            r: 6,
            fill: '#f97316',
            stroke: '#fff',
            strokeWidth: 3,
            className: 'drop-shadow-lg'
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
