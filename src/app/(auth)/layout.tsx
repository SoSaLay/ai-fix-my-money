import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-center">
        <div className="text-title-lg font-bold text-on-surface">AI Fix My Money</div>
        <div className="text-label-sm uppercase tracking-[0.09em] text-on-surface-variant mt-1">
          AI Finance
        </div>
      </Link>
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  )
}
