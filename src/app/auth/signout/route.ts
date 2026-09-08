// Sign-out is a POST, so a prefetch or an image tag cannot end someone's
// session for them.

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`, { status: 303 })
}
