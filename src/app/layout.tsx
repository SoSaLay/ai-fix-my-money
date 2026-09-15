import type { Metadata } from 'next'
import { Inter_Tight } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'

// Inter Tight: the closest open face to Neue Haas Grotesk, which SuperHi sets in.
const sans = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'AI Fix My Money',
  description: 'Fix your finances with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <AuthProvider>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
