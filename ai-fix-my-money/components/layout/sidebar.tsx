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
} from 'lucide-react'
import { clsx } from 'clsx'

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
  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-surface-container-lowest flex flex-col py-8 px-4 z-40"
      style={{ width: 220 }}
    >
      {/* Brand */}
      <div className="px-2 mb-8">
        <p className="text-headline-sm text-on-surface font-bold leading-tight">
          AI Fix My Money
        </p>
        <p className="text-label-sm text-on-surface-variant mt-0.5 tracking-widest uppercase">
          AI Finance
        </p>
      </div>

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
      </div>
    </aside>
  )
}
