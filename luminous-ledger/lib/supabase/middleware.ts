import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

  // No credentials yet — skip session refresh, return no user
  if (!supabaseConfigured) {
    return { supabaseResponse, user: null }
  }

  let response = supabaseResponse

  const supabase = createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            response.cookies.set(name, value, options as any))
        },
      },
    },
  )

  try {
    const { data: { user } } = await supabase.auth.getUser()
    return { supabaseResponse: response, user }
  } catch {
    return { supabaseResponse: response, user: null }
  }
}
