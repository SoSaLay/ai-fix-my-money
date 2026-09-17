import type { Metadata, Viewport } from 'next'
import { Inter_Tight } from 'next/font/google'
import './globals.css'
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

// The page stays at the width it opened at: no pinch zoom and no zooming in on
// a focused field, both of which let a phone pan the page off to one side.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  )
}
