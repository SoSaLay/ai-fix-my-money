import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface-container-lowest rounded-2xl shadow-card p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
