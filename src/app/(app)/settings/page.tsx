import Link from 'next/link'
import { CreditCard, ChevronRight } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'

export default function SettingsPage() {
  const settingsLinks = [
    {
      href: '/accounts',
      icon: <CreditCard size={22} />,
      title: 'Connected Accounts',
      description: 'View and manage your linked bank accounts',
    },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <TopNav title="Settings" />

      <div className="flex-1 px-8 pb-10 flex flex-col gap-6">
        <p className="text-body-md text-on-surface-variant">
          Manage your account, integrations, and preferences.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {settingsLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex items-center gap-5 hover:shadow-float transition-shadow duration-200 group"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0 group-hover:bg-secondary/15 transition-colors duration-150">
                {item.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-label-lg font-semibold text-on-surface">{item.title}</p>
                <p className="text-label-sm text-on-surface-variant mt-0.5">{item.description}</p>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={18}
                className="text-on-surface-variant flex-shrink-0 group-hover:text-on-surface transition-colors duration-150"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
