'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

type ButtonVariant = 'primary' | 'sunset' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-secondary text-white rounded-xl px-6 py-3 font-medium text-label-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  sunset:
    'bg-sunset text-white rounded-xl px-6 py-3 font-medium text-label-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-surface-container-high text-on-surface rounded-xl px-6 py-3 font-medium text-label-lg hover:bg-surface-container active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-secondary rounded-xl px-6 py-3 font-medium text-label-lg hover:bg-secondary/8 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
}

export function Button({
  variant = 'primary',
  children,
  className,
  disabled,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(variantClasses[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
}
