'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { ChannelSplit } from '../types/admin.types'

interface ChannelPieChartProps {
  channelSplit: ChannelSplit
  animationKey?: string
}

const CHANNEL_CONFIG = [
  { key: 'local' as const, label: 'Local', color: '#f97316' },
  { key: 'delivery' as const, label: 'Delivery', color: '#3b82f6' },
  { key: 'para_llevar' as const, label: 'Para llevar', color: '#22c55e' }
]

export const ChannelPieChart = ({ channelSplit, animationKey }: ChannelPieChartProps) => {
  const total = channelSplit.local + channelSplit.delivery + channelSplit.para_llevar

  const chartData = useMemo(
    () =>
      CHANNEL_CONFIG.map((ch) => ({
        name: ch.label,
        value: channelSplit[ch.key],
        color: ch.color
      })).filter((d) => d.value > 0),
    [channelSplit]
  )

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-gray-400 dark:text-gray-500">
        Sin pedidos en este período
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[180px] h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={animationKey}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationDuration={900}
              animationEasing="ease-out"
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-white leading-none">
            {total}
          </span>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            pedidos
          </span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
        {CHANNEL_CONFIG.map((ch) => (
          <div key={ch.key} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: ch.color }}
            />
            <span className="text-gray-500 dark:text-gray-400 font-medium">
              {ch.label}
            </span>
            <span className="font-bold text-gray-700 dark:text-gray-200">
              {channelSplit[ch.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
