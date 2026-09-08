// Where an email confirmation or an OAuth redirect lands. Exchanges the code
// for a session cookie, then sends the user into the app.

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // `next` is attacker-controlled in the general case, so only a path on
      // this origin is honoured — an absolute URL here is an open redirect.
      const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`)
}
