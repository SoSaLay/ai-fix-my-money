import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface MetricCardBadge {
  text: string
  color: string
}

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  subLabel: string
  badge?: MetricCardBadge
  className?: string
}

export function MetricCard({
  icon,
  label,
  value,
  subLabel,
  badge,
  className,
}: MetricCardProps) {
  return (
    <div
      className={clsx(
        'bg-surface-container-lowest rounded-2xl shadow-card p-5 flex flex-col gap-3',
        className,
      )}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
        {icon}
      </div>

      {/* Label + badge row */}
      <div className="flex items-center gap-2">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
          {label}
        </p>
        {badge && (
          <span
            className="rounded-full px-2.5 py-0.5 text-label-sm font-medium"
            style={{
              backgroundColor: `${badge.color}22`,
              color: badge.color,
            }}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-headline-md font-bold text-on-surface">{value}</p>

      {/* Sub label */}
      <p className="text-label-sm text-on-surface-variant">{subLabel}</p>
    </div>
  )
}
