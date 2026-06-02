'use client'

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface SpendingDataPoint {
  day: string
  amount: number
}

interface SpendingChartProps {
  data: SpendingDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-float px-4 py-2.5">
      <p className="text-label-sm text-on-surface-variant mb-0.5">{label}</p>
      <p className="text-label-lg font-semibold text-on-surface">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <div className="w-full" style={{ height: 200 }}>
      {/* SVG gradient definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c7ae8" />
            <stop offset="100%" stopColor="#ff9817" />
          </linearGradient>
        </defs>
      </svg>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          barCategoryGap="35%"
        >
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#5a5b60', fontSize: 11, fontFamily: 'Inter' }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(76,73,201,0.05)', radius: 8 }}
          />
          <Bar
            dataKey="amount"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill="url(#barGradient)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
