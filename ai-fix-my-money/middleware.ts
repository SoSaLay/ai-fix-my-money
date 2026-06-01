import { type NextRequest, NextResponse } from 'next/server'
import { updateSession, supabaseConfigured } from '@/lib/supabase/middleware'
import { validateApiKey } from '@/lib/api/auth'
import type { ApiKeyRow } from '@/types/database'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── API v1 routes: API key or session authentication ──────
  if (pathname.startsWith('/api/v1')) {
    // Skip auth when Supabase isn't configured (demo mode)
    if (!supabaseConfigured) {
      return NextResponse.next()
    }

    const rawKey = request.headers.get('x-api-key')

    // If an API key is provided, validate it
    if (rawKey) {
      const result = await validateApiKey(rawKey)

      if (!result.valid) {
        if (result.reason === 'expired') {
          return NextResponse.json({ error: 'API key expired' }, { status: 401 })
        }
        if (result.reason === 'limit_exceeded') {
          return NextResponse.json(
            { error: 'Rate limit exceeded', used: result.used, limit: result.limit },
            { status: 429 },
          )
        }
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }

      // Type narrowing: result.valid is true, so apiKey exists
      const apiKey = result.apiKey as ApiKeyRow

      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-api-key-id', apiKey.id)
      if (apiKey.user_id) requestHeaders.set('x-api-user-id', apiKey.user_id)

      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    // No API key — fall back to Supabase session (browser/internal requests)
    const { supabaseResponse, user } = await updateSession(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Provide a valid x-api-key header or an active session.' },
        { status: 401 },
      )
    }
    return supabaseResponse
  }

  // ── Auth-protected app routes ──────────────────────────────
  const isAppRoute = pathname.match(
    /^\/(dashboard|accounts|spending|savings|investing|advisor|settings|onboarding|setup)/
  )

  if (isAppRoute) {
    // No credentials yet — let all app routes through for demo/preview
    if (!supabaseConfigured) {
      return NextResponse.next()
    }

    const { supabaseResponse, user } = await updateSession(request)
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // ── All other routes: refresh Supabase session if configured ─
  if (supabaseConfigured) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
