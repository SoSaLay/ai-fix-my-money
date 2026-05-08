'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlaidLinkButtonProps {
  onSuccess: (publicToken: string, metadata: unknown) => void
  onExit: () => void
}

export function PlaidLinkButton({ onSuccess, onExit }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLinkToken = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create link token')
      const data = await res.json()
      setLinkToken(data.link_token)
    } catch (err) {
      setError('Unable to connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLinkToken()
  }, [fetchLinkToken])

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: (publicToken, metadata) => {
      onSuccess(publicToken, metadata)
    },
    onExit: () => {
      onExit()
    },
  })

  const handleClick = () => {
    if (ready && linkToken) {
      open()
    } else if (!linkToken && !loading) {
      fetchLinkToken()
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="primary"
        onClick={handleClick}
        disabled={loading || (!ready && !!linkToken)}
        className="flex items-center gap-2.5 px-8 py-4 text-body-md"
      >
        <Building2 size={18} />
        {loading ? 'Preparing...' : 'Connect Bank Account'}
      </Button>

      {error && (
        <p className="text-label-sm text-error">{error}</p>
      )}
    </div>
  )
}
