'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  CreditCard,
  PieChart,
  PiggyBank,
  TrendingUp,
  GraduationCap,
  Lock,
  Check,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useLearning } from '@/contexts/learning-context'
import type { TrackId } from '@/lib/learning/tracks'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  /** Sections tied to a track are locked until that track is finished. */
  track?: TrackId
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Accounts',  href: '/accounts',  icon: <CreditCard size={18} />,  track: 'accounts' },
  { label: 'Spending',  href: '/spending',  icon: <PieChart size={18} />,    track: 'spending' },
  { label: 'Savings',   href: '/savings',   icon: <PiggyBank size={18} />,   track: 'savings' },
  { label: 'Investing', href: '/investing', icon: <TrendingUp size={18} />,  track: 'investing' },
]

interface SidebarProps {
  pathname: string
}

export function Sidebar({ pathname }: SidebarProps) {
  const { ready, isToolUnlocked, isTrackComplete, dueReviews } = useLearning()
  const due = ready ? dueReviews().length : 0

  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-surface-container-lowest flex flex-col py-8 px-4 z-40"
      style={{ width: 220 }}
    >
      {/* Brand — links back to home */}
      <Link href="/" className="px-2 mb-6 block group">
        <p className="text-headline-sm text-on-surface font-bold leading-tight group-hover:text-secondary transition-colors">
          AI Fix My Money
        </p>
      </Link>

      {/* Learning — the entry point, and the archive */}
      <div className="mb-3">
        <Link
          href="/learning"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-label-lg font-medium transition-all duration-150',
            pathname.startsWith('/learning')
              ? 'bg-secondary-fixed/30 text-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
          )}
        >
          <GraduationCap size={18} />
          Learning
          {due > 0 && (
            <span className="ml-auto text-label-sm bg-secondary text-white rounded-full px-1.5 min-w-[18px] text-center tabular-nums">
              {due}
            </span>
          )}
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

          // Locked items stay visible — seeing what is ahead is the point.
          // Clicking one lands on the gate, which explains how to open it.
          const locked = !!item.track && ready && !isToolUnlocked(item.track)
          const complete = !!item.track && ready && isTrackComplete(item.track)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-label-lg font-medium transition-all duration-150',
                isActive
                  ? 'bg-secondary-fixed/30 text-secondary'
                  : locked
                    ? 'text-on-surface-variant/45 hover:bg-surface-container-low'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
              )}
            >
              {item.icon}
              {item.label}
              {locked && <Lock size={13} className="ml-auto shrink-0" />}
              {complete && !isActive && (
                <Check size={13} className="ml-auto shrink-0" style={{ color: '#1a6b3a' }} />
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
