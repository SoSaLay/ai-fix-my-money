'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authErrorMessage } from '@/lib/auth/messages'
import { createClient } from '@/lib/supabase/client'

/** Supabase's floor is 6. Eight is the lowest number worth asking for. */
const MIN_PASSWORD = 8

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (password.length < MIN_PASSWORD) {
      setError(`Use a password of at least ${MIN_PASSWORD} characters.`)
      return
    }

    setBusy(true)
    setError(null)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (signUpError) {
      setError(authErrorMessage(signUpError.message))
      setBusy(false)
      return
    }

    // With email confirmation on, there is no session yet — say so rather than
    // pushing to a dashboard that would bounce straight back to /login.
    if (!data.session) {
      setConfirmSent(true)
      setBusy(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (confirmSent) {
    return (
      <Card className="p-6">
        <h1 className="text-title-md font-semibold text-on-surface">Check your email</h1>
        <p className="text-body-sm text-on-surface-variant mt-2">
          We sent a confirmation link to <span className="font-medium">{email}</span>. Open it and
          you are in.
        </p>
        <p className="text-body-sm text-on-surface-variant mt-6">
          Already confirmed?{' '}
          <Link href="/login" className="text-secondary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h1 className="text-title-md font-semibold text-on-surface">Create an account</h1>
      <p className="text-body-sm text-on-surface-variant mt-1">
        Your progress follows you between devices, and nothing you enter is shared.
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
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="text-body-sm text-error">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-body-sm text-on-surface-variant mt-6 text-center">
        Already have one?{' '}
        <Link href="/login" className="text-secondary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
