'use client'

import type { ReactNode } from 'react'
import { usePreview } from '@/contexts/preview-context'

interface TopNavProps {
  title: string
  /** Optional control shown opposite the title — e.g. the dashboard's Export. */
  action?: ReactNode
}

export function TopNav({ title, action }: TopNavProps) {
  // The preview runs the pages back to back, where a title on each is noise.
  if (usePreview()) return null

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-8 py-5">
      <h1 className="text-headline-md sm:text-headline-lg text-on-surface">{title}</h1>
      {action}
    </header>
  )
}
