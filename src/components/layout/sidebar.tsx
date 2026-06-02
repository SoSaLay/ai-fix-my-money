'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  CreditCard,
  PieChart,
  PiggyBank,
  TrendingUp,
  Upload,
  BrainCircuit,
  Trash2,
  BookOpen,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import { useFinancialData } from '@/contexts/financial-data-context'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',  icon: <LayoutDashboard size={18} /> },
  { label: 'Accounts',   href: '/accounts',   icon: <CreditCard size={18} /> },
  { label: 'Spending',   href: '/spending',   icon: <PieChart size={18} /> },
  { label: 'Savings',    href: '/savings',    icon: <PiggyBank size={18} /> },
  { label: 'Investing',  href: '/investing',  icon: <TrendingUp size={18} /> },
  { label: 'AI Adviser', href: '/advisor',    icon: <BrainCircuit size={18} /> },
]

interface SidebarProps {
  pathname: string
}

export function Sidebar({ pathname }: SidebarProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const { clearData } = useFinancialData()

  const handleClearConfirm = () => {
    clearData()
    setShowConfirm(false)
  }

  return (
    <>
      <aside
        className="fixed top-0 left-0 h-screen bg-surface-container-lowest flex flex-col py-8 px-4 z-40"
        style={{ width: 220 }}
      >
        {/* Brand — links back to home */}
        <Link href="/" className="px-2 mb-6 block group">
          <p className="text-headline-sm text-on-surface font-bold leading-tight group-hover:text-secondary transition-colors">
            AI Fix My Money
          </p>
          <p className="text-label-sm text-on-surface-variant mt-0.5 tracking-widest uppercase">
            AI Finance
          </p>
        </Link>

        {/* Tutorial — pinned above main nav */}
        <div className="mb-3">
          <Link
            href="/tutorial"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-label-lg font-medium transition-all duration-150',
              pathname.startsWith('/tutorial')
                ? 'bg-secondary-fixed/30 text-secondary'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
            )}
          >
            <BookOpen size={18} />
            Tutorial
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-3 mb-3 border-t border-outline-variant/40" />

        {/* Main nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-label-lg font-medium transition-all duration-150',
                  isActive
                    ? 'bg-secondary-fixed/30 text-secondary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col gap-2">
          <Link
            href="/setup"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-label-lg font-medium transition-all duration-150',
              pathname.startsWith('/setup')
                ? 'bg-secondary-fixed/30 text-secondary'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
            )}
          >
            <Upload size={18} />
            Import Data
          </Link>

          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-label-lg font-medium transition-all duration-150 text-on-surface-variant hover:bg-error/10 hover:text-error w-full text-left"
          >
            <Trash2 size={18} />
            Clear Data
          </button>
        </div>
      </aside>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="bg-surface rounded-3xl p-6 flex flex-col gap-4 shadow-xl"
            style={{ width: 340 }}
          >
            <div>
              <p className="text-title-lg text-on-surface font-semibold">Clear all data?</p>
              <p className="text-body-md text-on-surface-variant mt-1.5">
                This will permanently delete all your local financial data — accounts, transactions, budgets, and goals. You'll need to re-import from Perplexity to start fresh.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2.5 rounded-xl text-label-lg font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearConfirm}
                className="px-5 py-2.5 rounded-xl text-label-lg font-semibold text-white transition-colors"
                style={{ background: '#ba1a1a' }}
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
