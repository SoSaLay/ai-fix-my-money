'use client'

import { type InputHTMLAttributes, useId } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  className?: string
}

export function Input({ label, className, id, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-label-md text-on-surface-variant font-medium"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full bg-surface-container-low rounded-md px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60',
          'transition-all duration-150',
          'focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(76,73,201,0.35)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...rest}
      />
    </div>
  )
}
