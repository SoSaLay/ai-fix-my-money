'use client'

interface TopNavProps {
  title: string
}

export function TopNav({ title }: TopNavProps) {
  return (
    <header className="flex items-center justify-between px-8 py-5">
      <h1 className="text-headline-lg text-on-surface">{title}</h1>
    </header>
  )
}
