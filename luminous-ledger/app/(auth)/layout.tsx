import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      {/* Brand heading */}
      <div className="mb-8 text-center">
        <h1 className="text-headline-lg text-on-surface font-bold">Luminous Ledger</h1>
        <p className="text-label-md text-on-surface-variant mt-1">Premium AI Finance Insights</p>
      </div>

      {/* White card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-8 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
