// ============================================================================
// Session refresh, and the gate.
//
// Supabase access tokens are short-lived. Something has to spend the refresh
// token and write the new cookies back, and middleware is the only place that
// sees every request and can still set a header. Skip it and users are signed
// out mid-lesson.
//
// The cookie dance below is exact on purpose: the response must be built from
// the request, and any cookie the client sets has to land on BOTH the request
// (so the same pass reads it) and the response (so the browser keeps it).
// ============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/types/supabase'
import { authConfigured, supabaseAnonKey, supabaseUrl } from './env'

/** Reachable signed out. Everything else under (app) and /api/quiz is not. */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/auth',
  '/learning/disclosures',
]

/** Dev-only area. The layout hides it and the route handler refuses it. */
const DEV_PATHS = ['/admin']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // No project configured — the app runs exactly as it did before accounts
  // existed. This is what keeps a fresh clone working with no setup.
  if (!authConfigured()) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // getUser, not getSession: this one verifies the token with the auth server.
  // getSession trusts the cookie, which is the thing being checked.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (DEV_PATHS.some(p => pathname.startsWith(p))) return response
  if (isPublic(pathname)) {
    // A signed-in user landing on the marketing or auth pages goes to the app
    // rather than being asked to sign in again.
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return response
  }

  if (!user) {
    // An API caller gets a status code. Redirecting a fetch to an HTML login
    // page produces a JSON parse error at the call site, which is a worse bug
    // to read than a 401.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}
