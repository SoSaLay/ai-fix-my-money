'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authErrorMessage } from '@/lib/auth/messages'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  /** Where the middleware turned them away from. Back there once signed in. */
  const next = params.get('next') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(authErrorMessage(signInError.message))
      setBusy(false)
      return
    }

    // refresh() so the server components re-render against the new session.
    router.push(next)
    router.refresh()
  }

  return (
    <Card className="p-6">
      <h1 className="text-title-md font-semibold text-on-surface">Sign in</h1>
      <p className="text-body-sm text-on-surface-variant mt-1">
        Your progress and your figures are waiting where you left them.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-6">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="text-body-sm text-error">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-body-sm text-on-surface-variant mt-6 text-center">
        No account yet?{' '}
        <Link href="/signup" className="text-secondary font-medium hover:underline">
          Create one
        </Link>
      </p>
    </Card>
  )
}

export default function LoginPage() {
  // useSearchParams needs a boundary or the route opts into dynamic rendering.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
