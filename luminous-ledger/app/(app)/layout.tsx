'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { FinancialDataProvider } from '@/contexts/financial-data-context'

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <FinancialDataProvider>
      <div className="min-h-screen bg-surface flex">
        {/* Fixed sidebar */}
        <Sidebar pathname={pathname} />

        {/* Main content area — offset by sidebar width */}
        <main
          className="flex-1 flex flex-col min-h-screen"
          style={{ marginLeft: 220 }}
        >
          {children}
        </main>
      </div>
    </FinancialDataProvider>
  )
}
