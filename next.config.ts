import type { NextConfig } from 'next'

/**
 * Sent on every response. `X-Frame-Options` is DENY because nothing in this app
 * is meant to be embedded — the only iframe involved is TikTok's, inside our
 * page, which this does not affect.
 *
 * There is no Content-Security-Policy here yet. A CSP that forgets the TikTok
 * embed breaks the quiz silently, so it goes on in Report-Only first. See
 * DEPLOYMENT.md §6.3.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
const posthogAssetHost = posthogHost.replace('.i.posthog.com', '-assets.i.posthog.com')

const nextConfig: NextConfig = {
  devIndicators: false,

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },

  // Analytics is served from this origin, so a content blocker cannot remove it
  // and take the funnel data with it.
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${posthogAssetHost}/static/:path*` },
      { source: '/ingest/:path*', destination: `${posthogHost}/:path*` },
    ]
  },

  // The rewrite target sets its own headers; this stops Next stripping them.
  skipTrailingSlashRedirect: true,
}

export default nextConfig
