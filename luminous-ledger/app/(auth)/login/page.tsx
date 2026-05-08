'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-headline-md text-on-surface">Sign in</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Welcome back to your financial dashboard.
        </p>
      </div>

      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="text-label-sm text-error bg-error/10 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full justify-center mt-2"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-body-md text-on-surface-variant">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-secondary font-medium hover:opacity-75 transition-opacity duration-150">
          Create account
        </Link>
      </p>
    </div>
  )
}
